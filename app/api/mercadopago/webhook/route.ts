import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanoId = "essencial" | "profissional" | "expertise";

function normalizarStatusMercadoPago(status?: string) {
  if (status === "authorized") return "ativo";
  if (status === "paused") return "pausado";
  if (status === "cancelled") return "cancelado";
  if (status === "pending") return "pendente";
  return status || "pendente";
}

function extrairUserId(externalReference?: string) {
  if (!externalReference?.includes(":")) return null;
  return externalReference.split(":")[0] || null;
}

function extrairEmailPagamento(externalReference?: string, payerEmail?: string) {
  const partes = externalReference?.split(":") || [];
  const emailReference = partes[2];

  if (emailReference) {
    try {
      return decodeURIComponent(emailReference).trim().toLowerCase();
    } catch {
      return emailReference.trim().toLowerCase();
    }
  }

  return payerEmail?.trim().toLowerCase() || null;
}

function extrairPlano(
  externalReference?: string,
  reason?: string
): PlanoId | null {
  if (externalReference?.includes(":")) {
    const plano = externalReference.split(":")[1];

    if (
      plano === "essencial" ||
      plano === "profissional" ||
      plano === "expertise"
    ) {
      return plano;
    }
  }

  const texto = `${reason || ""}`.toLowerCase();

  if (texto.includes("expertise")) return "expertise";
  if (texto.includes("profissional")) return "profissional";
  if (texto.includes("essencial")) return "essencial";

  return null;
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const tipo = String(
      body?.type || body?.topic || body?.action || ""
    ).toLowerCase();

    const dataId = body?.data?.id;

    if (!tipo.includes("preapproval")) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Evento ignorado. Não é assinatura.",
        tipo,
      });
    }

    if (!dataId) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Evento de assinatura sem data.id.",
      });
    }

    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!mpToken || !supabaseUrl || !serviceRole) {
      return NextResponse.json({
        success: false,
        error: "Variáveis de ambiente ausentes.",
      });
    }

    const resposta = await fetch(
      `https://api.mercadopago.com/preapproval/${dataId}`,
      {
        headers: {
          Authorization: `Bearer ${mpToken}`,
        },
      }
    );

    const assinaturaMp = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro ao consultar preapproval:", assinaturaMp);

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Não foi possível consultar preapproval. Evento ignorado.",
        details: assinaturaMp,
      });
    }

    const userId = extrairUserId(assinaturaMp.external_reference);

    if (!userId) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Assinatura sem user_id em external_reference.",
      });
    }

    const plano = extrairPlano(
      assinaturaMp.external_reference,
      assinaturaMp.reason
    );

    if (!plano) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Plano não identificado na assinatura.",
      });
    }

    const status = normalizarStatusMercadoPago(assinaturaMp.status);

    const emailPagamento = extrairEmailPagamento(
      assinaturaMp.external_reference,
      assinaturaMp.payer_email
    );

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const { data: assinaturaAtual } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    /*
      PROTEÇÃO DA CONTA OWNER:
      Nunca alteramos assinatura owner por webhook.
    */
    if (assinaturaAtual?.plano === "owner") {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Conta owner ignorada pelo webhook.",
      });
    }

    /*
      REGRA CRÍTICA:
      Não gravar assinatura pendente na tabela subscriptions.

      Motivo:
      Se o usuário está em teste ativo e apenas clica no checkout,
      o Mercado Pago pode disparar webhook pending antes do pagamento.
      Se gravarmos pending, o usuário perde o acesso ao trial.

      Portanto:
      - pending: ignorar
      - authorized: ativar plano
      - paused/cancelled: atualizar somente se já existir assinatura ativa
        vinculada ao mesmo mercadopago_subscription_id
    */
    if (status === "pendente") {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Status pendente ignorado para não bloquear trial/acesso atual.",
        user_id: userId,
        plano,
        status,
        email_pagamento: emailPagamento,
      });
    }

    const { data: assinaturaPorMercadoPagoId } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("mercadopago_subscription_id", assinaturaMp.id)
      .maybeSingle();

    if (status === "ativo") {
      if (assinaturaAtual?.id) {
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            plano,
            status: "ativo",
            data_inicio:
              assinaturaMp.date_created ||
              assinaturaAtual.data_inicio ||
              new Date().toISOString(),
            data_fim: assinaturaMp.next_payment_date || null,
            mercadopago_subscription_id: assinaturaMp.id,
            email_pagamento: emailPagamento,
          })
          .eq("id", assinaturaAtual.id);

        if (error) {
          console.error("Erro ao ativar assinatura existente:", error);

          return NextResponse.json({
            success: false,
            error: "Erro ao ativar assinatura existente.",
          });
        }
      } else {
        const { error } = await supabaseAdmin.from("subscriptions").insert({
          user_id: userId,
          plano,
          status: "ativo",
          data_inicio: assinaturaMp.date_created || new Date().toISOString(),
          data_fim: assinaturaMp.next_payment_date || null,
          mercadopago_subscription_id: assinaturaMp.id,
          email_pagamento: emailPagamento,
        });

        if (error) {
          console.error("Erro ao criar assinatura ativa:", error);

          return NextResponse.json({
            success: false,
            error: "Erro ao criar assinatura ativa.",
          });
        }
      }

      return NextResponse.json({
        success: true,
        user_id: userId,
        plano,
        status: "ativo",
        email_pagamento: emailPagamento,
      });
    }

    /*
      Cancelamento ou pausa:
      Só altera se a assinatura do Mercado Pago já estiver vinculada no GIBA.
      Isso evita cancelar/bloquear uma conta por uma tentativa não finalizada.
    */
    if (
      (status === "cancelado" || status === "pausado") &&
      assinaturaPorMercadoPagoId?.id
    ) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({
          status,
          data_fim: assinaturaMp.next_payment_date || new Date().toISOString(),
          email_pagamento: emailPagamento,
        })
        .eq("id", assinaturaPorMercadoPagoId.id);

      if (error) {
        console.error("Erro ao atualizar assinatura cancelada/pausada:", error);

        return NextResponse.json({
          success: false,
          error: "Erro ao atualizar status da assinatura.",
        });
      }

      return NextResponse.json({
        success: true,
        user_id: userId,
        plano,
        status,
      });
    }

    return NextResponse.json({
      success: true,
      ignored: true,
      reason:
        "Evento não exigiu alteração. Status não ativo ou assinatura ainda não vinculada.",
      user_id: userId,
      plano,
      status,
      email_pagamento: emailPagamento,
    });
  } catch (error) {
    console.error("Webhook erro capturado:", error);

    return NextResponse.json({
      success: true,
      ignored: true,
      reason: "Erro capturado para evitar falha no webhook.",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "GIBA Mercado Pago Webhook",
  });
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function extrairPlano(externalReference?: string, reason?: string) {
  if (externalReference?.includes(":")) {
    const plano = externalReference.split(":")[1];
    if (plano === "essencial" || plano === "profissional") return plano;
  }

  const texto = `${reason || ""}`.toLowerCase();
  if (texto.includes("profissional")) return "profissional";
  if (texto.includes("essencial")) return "essencial";

  return "teste";
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const tipo = String(body?.type || body?.topic || body?.action || "").toLowerCase();
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

    const status = normalizarStatusMercadoPago(assinaturaMp.status);

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    const { data: existente } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("mercadopago_subscription_id", assinaturaMp.id)
      .maybeSingle();

    if (existente?.id) {
      await supabaseAdmin
        .from("subscriptions")
        .update({
          user_id: userId,
          plano,
          status,
          data_inicio: assinaturaMp.date_created || new Date().toISOString(),
          data_fim: assinaturaMp.next_payment_date || null,
          mercadopago_subscription_id: assinaturaMp.id,
        })
        .eq("id", existente.id);
    } else {
      await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        plano,
        status,
        data_inicio: assinaturaMp.date_created || new Date().toISOString(),
        data_fim: assinaturaMp.next_payment_date || null,
        mercadopago_subscription_id: assinaturaMp.id,
      });
    }

    return NextResponse.json({
      success: true,
      user_id: userId,
      plano,
      status,
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
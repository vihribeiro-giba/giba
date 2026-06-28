import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanoId = "essencial" | "profissional" | "expertise";

function normalizarStatusMercadoPago(status?: string) {
  const statusNormalizado = String(status || "").toLowerCase();

  if (statusNormalizado === "authorized") return "ativo";
  if (statusNormalizado === "active") return "ativo";
  if (statusNormalizado === "approved") return "ativo";
  if (statusNormalizado === "accredited") return "ativo";

  if (statusNormalizado === "paused") return "pausado";
  if (statusNormalizado === "cancelled") return "cancelado";
  if (statusNormalizado === "canceled") return "cancelado";

  if (statusNormalizado === "pending") return "pendente";
  if (statusNormalizado === "in_process") return "pendente";

  if (statusNormalizado === "rejected") return "recusado";
  if (statusNormalizado === "refunded") return "estornado";
  if (statusNormalizado === "charged_back") return "chargeback";

  return statusNormalizado || "pendente";
}

function extrairUserId(externalReference?: string) {
  if (!externalReference?.includes(":")) return null;
  return externalReference.split(":")[0] || null;
}

function extrairUserIdDeMetadata(metadata?: Record<string, unknown> | null) {
  const userId = metadata?.user_id || metadata?.userId || metadata?.giba_user_id;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
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

function extrairEmailDeMetadata(metadata?: Record<string, unknown> | null) {
  const email =
    metadata?.mercado_pago_email ||
    metadata?.mercadoPagoEmail ||
    metadata?.payer_email ||
    metadata?.payerEmail;

  return typeof email === "string" && email.includes("@")
    ? email.trim().toLowerCase()
    : null;
}

function extrairPlano(
  externalReference?: string,
  reason?: string,
  metadata?: Record<string, unknown> | null
): PlanoId | null {
  const planoMetadata = metadata?.plan || metadata?.plano;

  if (
    planoMetadata === "essencial" ||
    planoMetadata === "profissional" ||
    planoMetadata === "expertise"
  ) {
    return planoMetadata;
  }

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

async function buscarUsuarioPorAssinaturaMp(
  supabaseAdmin: any,
  assinaturaMpId?: string | null
) {
  if (!assinaturaMpId) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("mercadopago_subscription_id", assinaturaMpId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[MP WEBHOOK] erro ao buscar user_id por assinatura MP", error);
    return null;
  }

  return data?.user_id || null;
}

async function buscarUsuarioPorEmailPagamento(
  supabaseAdmin: any,
  email?: string | null
) {
  if (!email) return null;

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id")
    .eq("email_pagamento", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[MP WEBHOOK] erro ao buscar user_id por e-mail de pagamento", error);
    return null;
  }

  return data?.user_id || null;
}

async function consultarMercadoPago(endpoint: string, token: string) {
  const resposta = await fetch(`https://api.mercadopago.com${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const dados = await resposta.json();

  return {
    ok: resposta.ok,
    status: resposta.status,
    dados,
  };
}

async function buscarPreapprovalPorReferencia(
  externalReference: string,
  token: string
) {
  const query = encodeURIComponent(externalReference);

  const resposta = await consultarMercadoPago(
    `/preapproval/search?external_reference=${query}`,
    token
  );

  if (!resposta.ok) return null;

  const results = resposta.dados?.results;

  if (Array.isArray(results) && results.length > 0) {
    return results[0];
  }

  return null;
}

async function ativarOuAtualizarAssinatura({
  supabaseAdmin,
  userId,
  plano,
  status,
  assinaturaMpId,
  dataInicio,
  dataFim,
  emailPagamento,
}: {
  supabaseAdmin: any;
  userId: string;
  plano: PlanoId;
  status: string;
  assinaturaMpId: string | null;
  dataInicio: string | null;
  dataFim: string | null;
  emailPagamento: string | null;
}) {
  const { data: assinaturaAtual, error: erroAssinaturaAtual } =
    await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (erroAssinaturaAtual) {
    console.error("Erro ao buscar assinatura atual:", erroAssinaturaAtual);

    return {
      ok: false,
      error: "Erro ao buscar assinatura atual.",
    };
  }

  if (assinaturaAtual?.plano === "owner") {
    return {
      ok: true,
      ignored: true,
      reason: "Conta owner ignorada pelo webhook.",
    };
  }

  const dadosAssinatura = {
    plano,
    status,
    data_inicio:
      dataInicio || assinaturaAtual?.data_inicio || new Date().toISOString(),
    data_fim: dataFim,
    mercadopago_subscription_id:
      assinaturaMpId || assinaturaAtual?.mercadopago_subscription_id || null,
    email_pagamento: emailPagamento,
  };

  if (assinaturaAtual?.id) {
    if (assinaturaMpId) {
      const { data: assinaturaPorMercadoPagoId } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("mercadopago_subscription_id", assinaturaMpId)
        .limit(1)
        .maybeSingle();

      if (assinaturaPorMercadoPagoId?.id) {
        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update(dadosAssinatura)
          .eq("id", assinaturaPorMercadoPagoId.id);

        if (error) {
          console.error("Erro ao atualizar assinatura por ID Mercado Pago:", error);

          return {
            ok: false,
            error: "Erro ao atualizar assinatura.",
          };
        }

        return {
          ok: true,
          action: "updated_by_mp_id",
        };
      }
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update(dadosAssinatura)
      .eq("id", assinaturaAtual.id);

    if (error) {
      console.error("Erro ao atualizar assinatura:", error);

      return {
        ok: false,
        error: "Erro ao atualizar assinatura.",
      };
    }

    return {
      ok: true,
      action: "updated",
    };
  }

  const { error } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    ...dadosAssinatura,
  });

  if (error) {
    console.error("Erro ao criar assinatura:", error);

    return {
      ok: false,
      error: "Erro ao criar assinatura.",
    };
  }

  return {
    ok: true,
    action: "inserted",
  };
}

async function atualizarMetadadosExtrasAssinatura({
  supabaseAdmin,
  assinaturaMpId,
  plano,
  status,
  customerId,
  evento,
}: {
  supabaseAdmin: any;
  assinaturaMpId?: string | null;
  plano?: PlanoId | null;
  status?: string | null;
  customerId?: string | null;
  evento: string;
}) {
  if (!assinaturaMpId) return;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      current_plan: plano || null,
      subscription_status: status || null,
      mercado_pago_customer_id: customerId || null,
      plan_updated_at: new Date().toISOString(),
      subscription_last_event: evento,
      subscription_last_event_at: new Date().toISOString(),
    })
    .eq("mercadopago_subscription_id", assinaturaMpId);

  if (error) {
    console.log(
      "[MP WEBHOOK] metadados extras nao salvos; colunas opcionais podem nao existir",
      error.message
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    console.log("[MP WEBHOOK] evento recebido", JSON.stringify(body));

    const tipo = String(
      body?.type || body?.topic || body?.action || ""
    ).toLowerCase();

    const dataId = body?.data?.id || body?.id;

    if (!dataId) {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Evento sem data.id/id.",
        tipo,
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

    const supabaseAdmin = createClient(supabaseUrl, serviceRole);

    if (tipo.includes("preapproval")) {
      const resposta = await consultarMercadoPago(
        `/preapproval/${dataId}`,
        mpToken
      );

      const assinaturaMp = resposta.dados;

      if (!resposta.ok) {
        console.error("Erro ao consultar preapproval:", assinaturaMp);

        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "Não foi possível consultar preapproval. Evento ignorado.",
          details: assinaturaMp,
        });
      }

      const emailPagamento =
        extrairEmailDeMetadata(assinaturaMp.metadata) ||
        extrairEmailPagamento(
          assinaturaMp.external_reference,
          assinaturaMp.payer_email
        );

      const userId =
        extrairUserIdDeMetadata(assinaturaMp.metadata) ||
        extrairUserId(assinaturaMp.external_reference) ||
        (await buscarUsuarioPorAssinaturaMp(
          supabaseAdmin,
          assinaturaMp.id || dataId
        )) ||
        (await buscarUsuarioPorEmailPagamento(supabaseAdmin, emailPagamento));

      if (!userId) {
        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "Assinatura sem user_id em external_reference.",
          external_reference: assinaturaMp.external_reference,
        });
      }

      const plano = extrairPlano(
        assinaturaMp.external_reference,
        assinaturaMp.reason,
        assinaturaMp.metadata
      );

      if (!plano) {
        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "Plano não identificado na assinatura.",
          external_reference: assinaturaMp.external_reference,
          reason_mp: assinaturaMp.reason,
        });
      }

      const status = normalizarStatusMercadoPago(assinaturaMp.status);

      console.log("[MP WEBHOOK] user_id identificado", userId);
      console.log("[MP WEBHOOK] plano identificado", plano);

      if (status === "pendente") {
        return NextResponse.json({
          success: true,
          ignored: true,
          reason:
            "Status pendente ignorado para não bloquear trial/acesso atual.",
          user_id: userId,
          plano,
          status,
          email_pagamento: emailPagamento,
        });
      }

      if (status === "ativo") {
        const resultado = await ativarOuAtualizarAssinatura({
          supabaseAdmin,
          userId,
          plano,
          status: "ativo",
          assinaturaMpId: assinaturaMp.id || dataId,
          dataInicio: assinaturaMp.date_created || new Date().toISOString(),
          dataFim: assinaturaMp.next_payment_date || null,
          emailPagamento,
        });

        if (!resultado.ok) {
          return NextResponse.json({
            success: false,
            error: resultado.error,
          });
        }

        await atualizarMetadadosExtrasAssinatura({
          supabaseAdmin,
          assinaturaMpId: assinaturaMp.id || dataId,
          plano,
          status: "ativo",
          customerId: assinaturaMp.payer_id ? String(assinaturaMp.payer_id) : null,
          evento: "preapproval_active",
        });

        console.log("[MP WEBHOOK] plano aprovado", plano);
        console.log("[MP WEBHOOK] subscription atualizada", resultado);

        return NextResponse.json({
          success: true,
          source: "preapproval",
          user_id: userId,
          plano,
          status: "ativo",
          email_pagamento: emailPagamento,
          resultado,
        });
      }

      if (status === "cancelado" || status === "pausado") {
        const { data: assinaturaPorMercadoPagoId } = await supabaseAdmin
          .from("subscriptions")
          .select("*")
          .eq("mercadopago_subscription_id", assinaturaMp.id)
          .maybeSingle();

        if (!assinaturaPorMercadoPagoId?.id) {
          return NextResponse.json({
            success: true,
            ignored: true,
            reason:
              "Cancelamento/pausa ignorado porque assinatura ainda não está vinculada.",
            status,
          });
        }

        const { error } = await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            data_fim: assinaturaMp.next_payment_date || new Date().toISOString(),
            email_pagamento: emailPagamento,
          })
          .eq("id", assinaturaPorMercadoPagoId.id);

        if (error) {
          console.error("Erro ao atualizar cancelamento/pausa:", error);

          return NextResponse.json({
            success: false,
            error: "Erro ao atualizar cancelamento/pausa.",
          });
        }

        await atualizarMetadadosExtrasAssinatura({
          supabaseAdmin,
          assinaturaMpId: assinaturaMp.id || dataId,
          plano: null,
          status,
          customerId: assinaturaMp.payer_id ? String(assinaturaMp.payer_id) : null,
          evento: `preapproval_${status}`,
        });

        return NextResponse.json({
          success: true,
          source: "preapproval",
          status,
        });
      }

      return NextResponse.json({
        success: true,
        ignored: true,
        source: "preapproval",
        reason: "Status não exige atualização.",
        status,
      });
    }

    if (tipo.includes("payment")) {
      const respostaPagamento = await consultarMercadoPago(
        `/v1/payments/${dataId}`,
        mpToken
      );

      const pagamentoMp = respostaPagamento.dados;

      if (!respostaPagamento.ok) {
        console.error("Erro ao consultar payment:", pagamentoMp);

        return NextResponse.json({
          success: true,
          ignored: true,
          reason: "Não foi possível consultar payment. Evento ignorado.",
          details: pagamentoMp,
        });
      }

      const statusPagamento = normalizarStatusMercadoPago(pagamentoMp.status);

      if (statusPagamento !== "ativo") {
        return NextResponse.json({
          success: true,
          ignored: true,
          source: "payment",
          reason: "Pagamento ainda não aprovado.",
          status: pagamentoMp.status,
          status_normalizado: statusPagamento,
        });
      }

      let externalReference = pagamentoMp.external_reference || "";

      const preapprovalId =
        pagamentoMp.metadata?.preapproval_id ||
        pagamentoMp.metadata?.preapprovalId ||
        pagamentoMp.point_of_interaction?.transaction_data?.subscription_id ||
        pagamentoMp.subscription_id ||
        null;

      let assinaturaMp: any = null;

      if (preapprovalId) {
        const respostaPreapproval = await consultarMercadoPago(
          `/preapproval/${preapprovalId}`,
          mpToken
        );

        if (respostaPreapproval.ok) {
          assinaturaMp = respostaPreapproval.dados;
          externalReference =
            assinaturaMp.external_reference || externalReference;
        }
      }

      if (!assinaturaMp && externalReference) {
        assinaturaMp = await buscarPreapprovalPorReferencia(
          externalReference,
          mpToken
        );
      }

      const emailPagamento =
        extrairEmailDeMetadata(pagamentoMp.metadata) ||
        extrairEmailDeMetadata(assinaturaMp?.metadata) ||
        extrairEmailPagamento(
          externalReference,
          pagamentoMp.payer?.email || assinaturaMp?.payer_email
        );

      const userId =
        extrairUserIdDeMetadata(pagamentoMp.metadata) ||
        extrairUserIdDeMetadata(assinaturaMp?.metadata) ||
        extrairUserId(externalReference) ||
        (await buscarUsuarioPorAssinaturaMp(
          supabaseAdmin,
          assinaturaMp?.id || preapprovalId
        )) ||
        (await buscarUsuarioPorEmailPagamento(supabaseAdmin, emailPagamento));

      if (!userId) {
        return NextResponse.json({
          success: true,
          ignored: true,
          source: "payment",
          reason:
            "Pagamento aprovado, mas sem external_reference com user_id. Verifique logs do Mercado Pago.",
          payment_id: dataId,
          external_reference: externalReference,
        });
      }

      const plano = extrairPlano(
        externalReference,
        assinaturaMp?.reason || pagamentoMp.description,
        assinaturaMp?.metadata || pagamentoMp.metadata
      );

      if (!plano) {
        return NextResponse.json({
          success: true,
          ignored: true,
          source: "payment",
          reason: "Plano não identificado no pagamento aprovado.",
          payment_id: dataId,
          external_reference: externalReference,
          description: pagamentoMp.description,
        });
      }

      console.log("[MP WEBHOOK] user_id identificado", userId);
      console.log("[MP WEBHOOK] plano aprovado", plano);

      const resultado = await ativarOuAtualizarAssinatura({
        supabaseAdmin,
        userId,
        plano,
        status: "ativo",
        assinaturaMpId: assinaturaMp?.id || preapprovalId || null,
        dataInicio:
          assinaturaMp?.date_created ||
          pagamentoMp.date_approved ||
          pagamentoMp.date_created ||
          new Date().toISOString(),
        dataFim:
          assinaturaMp?.next_payment_date ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        emailPagamento,
      });

      if (!resultado.ok) {
        return NextResponse.json({
          success: false,
          error: resultado.error,
        });
      }

      await atualizarMetadadosExtrasAssinatura({
        supabaseAdmin,
        assinaturaMpId: assinaturaMp?.id || preapprovalId || null,
        plano,
        status: "ativo",
        customerId:
          pagamentoMp.payer?.id || assinaturaMp?.payer_id
            ? String(pagamentoMp.payer?.id || assinaturaMp?.payer_id)
            : null,
        evento: "payment_approved",
      });

      console.log("[MP WEBHOOK] subscription atualizada", resultado);

      return NextResponse.json({
        success: true,
        source: "payment",
        user_id: userId,
        plano,
        status: "ativo",
        email_pagamento: emailPagamento,
        resultado,
      });
    }

    return NextResponse.json({
      success: true,
      ignored: true,
      reason: "Evento ignorado. Tipo não tratado pelo GIBA.",
      tipo,
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

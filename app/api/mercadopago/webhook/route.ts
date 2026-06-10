import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type MercadoPagoPreapproval = {
  id?: string;
  status?: string;
  reason?: string;
  external_reference?: string;
  init_point?: string;
  sandbox_init_point?: string;
  date_created?: string;
  last_modified?: string;
  next_payment_date?: string;
  payer_email?: string;
  auto_recurring?: {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    currency_id?: string;
  };
};

function normalizarStatusMercadoPago(status?: string) {
  switch (status) {
    case "authorized":
      return "ativo";

    case "paused":
      return "pausado";

    case "cancelled":
    case "cancelled_by_collector":
    case "cancelled_by_payer":
      return "cancelado";

    case "pending":
      return "pendente";

    default:
      return status || "pendente";
  }
}

function extrairPlano(externalReference?: string, reason?: string) {
  if (externalReference?.includes(":")) {
    const partes = externalReference.split(":");
    const plano = partes[1];

    if (plano === "essencial" || plano === "profissional") {
      return plano;
    }
  }

  const texto = `${reason || ""}`.toLowerCase();

  if (texto.includes("profissional")) return "profissional";
  if (texto.includes("essencial")) return "essencial";

  return "teste";
}

function extrairUserId(externalReference?: string) {
  if (!externalReference?.includes(":")) return null;

  const partes = externalReference.split(":");
  return partes[0] || null;
}

async function consultarAssinaturaMercadoPago(preapprovalId: string) {
  const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!mercadoPagoAccessToken) {
    throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  }

  const resposta = await fetch(
    `https://api.mercadopago.com/preapproval/${preapprovalId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${mercadoPagoAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  const dados = await resposta.json();

  if (!resposta.ok) {
    console.error("Erro ao consultar assinatura no Mercado Pago:", dados);
    throw new Error("Erro ao consultar assinatura no Mercado Pago.");
  }

  return dados as MercadoPagoPreapproval;
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Variáveis do Supabase não configuradas." },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const url = new URL(request.url);
    const topic = url.searchParams.get("topic") || url.searchParams.get("type");
    const idQuery =
      url.searchParams.get("id") ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("preapproval_id");

    let body: any = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const tipoEvento =
      body?.type ||
      body?.topic ||
      topic ||
      body?.action ||
      "";

    const preapprovalId =
      body?.data?.id ||
      body?.id ||
      body?.preapproval_id ||
      idQuery;

    if (!preapprovalId) {
      console.log("Webhook Mercado Pago recebido sem preapproval id:", {
        topic,
        tipoEvento,
        body,
      });

      return NextResponse.json({
        success: true,
        ignored: true,
        reason: "Evento sem ID de assinatura.",
      });
    }

    const assinaturaMp = await consultarAssinaturaMercadoPago(String(preapprovalId));

    const mercadoPagoSubscriptionId = assinaturaMp.id || String(preapprovalId);
    const userId = extrairUserId(assinaturaMp.external_reference);
    const plano = extrairPlano(assinaturaMp.external_reference, assinaturaMp.reason);
    const status = normalizarStatusMercadoPago(assinaturaMp.status);

    if (!userId) {
      console.error("Webhook sem user_id no external_reference:", assinaturaMp);

      return NextResponse.json(
        {
          error: "Assinatura sem user_id no external_reference.",
        },
        { status: 400 }
      );
    }

    const dataInicio =
      assinaturaMp.date_created || new Date().toISOString();

    const dataFim =
      assinaturaMp.next_payment_date || null;

    const { data: assinaturaExistente, error: erroBuscar } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("mercadopago_subscription_id", mercadoPagoSubscriptionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erroBuscar) {
      console.error("Erro ao buscar assinatura no GIBA:", erroBuscar);

      return NextResponse.json(
        { error: "Erro ao buscar assinatura no GIBA." },
        { status: 500 }
      );
    }

    if (assinaturaExistente?.id) {
      const { error: erroAtualizar } = await supabaseAdmin
        .from("subscriptions")
        .update({
          user_id: userId,
          plano,
          status,
          data_inicio: dataInicio,
          data_fim: dataFim,
          mercadopago_subscription_id: mercadoPagoSubscriptionId,
        })
        .eq("id", assinaturaExistente.id);

      if (erroAtualizar) {
        console.error("Erro ao atualizar assinatura pelo webhook:", erroAtualizar);

        return NextResponse.json(
          { error: "Erro ao atualizar assinatura." },
          { status: 500 }
        );
      }
    } else {
      const { error: erroCriar } = await supabaseAdmin
        .from("subscriptions")
        .insert({
          user_id: userId,
          plano,
          status,
          data_inicio: dataInicio,
          data_fim: dataFim,
          mercadopago_subscription_id: mercadoPagoSubscriptionId,
        });

      if (erroCriar) {
        console.error("Erro ao criar assinatura pelo webhook:", erroCriar);

        return NextResponse.json(
          { error: "Erro ao criar assinatura." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      tipoEvento,
      mercadopago_subscription_id: mercadoPagoSubscriptionId,
      user_id: userId,
      plano,
      status,
    });
  } catch (error) {
    console.error("Erro inesperado no webhook Mercado Pago:", error);

    return NextResponse.json(
      { error: "Erro inesperado no webhook Mercado Pago." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "GIBA Mercado Pago Webhook",
  });
}

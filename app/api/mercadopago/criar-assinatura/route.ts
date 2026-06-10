import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanoId = "essencial" | "profissional";

type PlanoConfig = {
  nome: string;
  valor: number;
};

const PLANOS: Record<PlanoId, PlanoConfig> = {
  essencial: {
    nome: "Plano Essencial - Plataforma GIBA",
    valor: 49.9,
  },
  profissional: {
    nome: "Plano Profissional - Plataforma GIBA",
    valor: 99.9,
  },
};

export async function POST(request: NextRequest) {
  try {
    const mercadoPagoAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!mercadoPagoAccessToken) {
      return NextResponse.json(
        { error: "MERCADO_PAGO_ACCESS_TOKEN não configurado." },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Variáveis do Supabase não configuradas." },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        { error: "Token de autenticação não enviado." },
        { status: 401 }
      );
    }

    const token = authorization.replace("Bearer ", "");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const planoRecebido = String(body?.plano || "").toLowerCase() as PlanoId;

    if (!planoRecebido || !PLANOS[planoRecebido]) {
      return NextResponse.json(
        { error: "Plano inválido." },
        { status: 400 }
      );
    }

    const plano = PLANOS[planoRecebido];

    const payloadMercadoPago = {
      reason: plano.nome,
      external_reference: `${user.id}:${planoRecebido}`,
      payer_email: user.email,
      back_url: `${appUrl}/assinatura`,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: plano.valor,
        currency_id: "BRL",
      },
    };

    const respostaMercadoPago = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payloadMercadoPago),
      }
    );

    const dadosMercadoPago = await respostaMercadoPago.json();

    if (!respostaMercadoPago.ok) {
      console.error("Erro Mercado Pago:", dadosMercadoPago);

      return NextResponse.json(
        {
          error: "Erro ao criar assinatura no Mercado Pago.",
          details: dadosMercadoPago,
        },
        { status: respostaMercadoPago.status }
      );
    }

    const mercadoPagoSubscriptionId = dadosMercadoPago?.id;
    const initPoint =
      dadosMercadoPago?.init_point || dadosMercadoPago?.sandbox_init_point;

    if (!mercadoPagoSubscriptionId || !initPoint) {
      return NextResponse.json(
        {
          error: "Mercado Pago não retornou os dados da assinatura.",
          details: dadosMercadoPago,
        },
        { status: 500 }
      );
    }

    const { data: assinaturaExistente, error: erroBuscarAssinatura } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (erroBuscarAssinatura) {
      console.error("Erro ao buscar assinatura:", erroBuscarAssinatura);

      return NextResponse.json(
        { error: "Erro ao buscar assinatura atual." },
        { status: 500 }
      );
    }

    if (assinaturaExistente?.id) {
      const { error: erroAtualizarAssinatura } = await supabase
        .from("subscriptions")
        .update({
          plano: planoRecebido,
          status: "pendente",
          mercadopago_subscription_id: mercadoPagoSubscriptionId,
          data_inicio: new Date().toISOString(),
          data_fim: null,
        })
        .eq("id", assinaturaExistente.id)
        .eq("user_id", user.id);

      if (erroAtualizarAssinatura) {
        console.error("Erro ao atualizar assinatura:", erroAtualizarAssinatura);

        return NextResponse.json(
          { error: "Erro ao atualizar assinatura no GIBA." },
          { status: 500 }
        );
      }
    } else {
      const { error: erroCriarAssinatura } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.id,
          plano: planoRecebido,
          status: "pendente",
          data_inicio: new Date().toISOString(),
          data_fim: null,
          mercadopago_subscription_id: mercadoPagoSubscriptionId,
        });

      if (erroCriarAssinatura) {
        console.error("Erro ao criar assinatura:", erroCriarAssinatura);

        return NextResponse.json(
          { error: "Erro ao criar assinatura no GIBA." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      plano: planoRecebido,
      mercadopago_subscription_id: mercadoPagoSubscriptionId,
      init_point: initPoint,
    });
  } catch (error) {
    console.error("Erro inesperado ao criar assinatura:", error);

    return NextResponse.json(
      { error: "Erro inesperado ao criar assinatura." },
      { status: 500 }
    );
  }
}

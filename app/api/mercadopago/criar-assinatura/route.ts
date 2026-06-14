import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PlanoId = "essencial" | "profissional" | "expertise";

type PlanoConfig = {
  nome: string;
  valor: number;
};

const PLANOS: Record<PlanoId, PlanoConfig> = {
  essencial: {
    nome: "Plano Essencial - Plataforma GIBA",
    valor: 109.9,
  },
  profissional: {
    nome: "Plano Profissional - Plataforma GIBA",
    valor: 209.9,
  },
  expertise: {
    nome: "Plano Expertise - Plataforma GIBA",
    valor: 359.9,
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

    const { data: assinaturaAtualAntesCheckout, error: erroAssinaturaAtual } =
      await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (erroAssinaturaAtual) {
      console.error("Erro ao buscar assinatura atual:", erroAssinaturaAtual);

      return NextResponse.json(
        { error: "Erro ao validar assinatura atual." },
        { status: 500 }
      );
    }

    if (assinaturaAtualAntesCheckout?.plano === "owner") {
      return NextResponse.json(
        {
          error: "Conta master não pode contratar plano pelo checkout.",
        },
        { status: 403 }
      );
    }

    /*
      IMPORTANTE:
      Esta rota NÃO deve alterar a tabela subscriptions antes do pagamento.

      Motivo:
      Se o usuário estiver em teste ativo e clicar para contratar um plano,
      mas não finalizar o pagamento, ele não pode perder o acesso ao trial.

      Fluxo correto:
      1. Usuário clica em contratar.
      2. Esta rota cria a assinatura/preapproval no Mercado Pago.
      3. O usuário é redirecionado para pagamento.
      4. Somente o webhook do Mercado Pago deve atualizar subscriptions
         quando a assinatura/pagamento for aprovado.

      Portanto, não fazemos update/insert em subscriptions aqui.
    */

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

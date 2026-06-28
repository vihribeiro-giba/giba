"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CreditCard,
  Crown,
  Mail,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../lib/supabase";

type Assinatura = {
  id: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_fim?: string | null;
  created_at?: string | null;
  mercadopago_subscription_id?: string | null;
  mercado_pago_customer_id?: string | null;
  email_pagamento?: string | null;
};

type PlanoId = "essencial" | "profissional" | "expertise";

type PlanoComercial = {
  id: PlanoId;
  nome: string;
  preco: string;
  descricao: string;
  destaque?: boolean;
  recursos: string[];
};

const planosComerciais: PlanoComercial[] = [
  {
    id: "essencial",
    nome: "Essencial",
    preco: "R$ 109,90",
    descricao: "Para organizar agenda, clientes, contratos e financeiro com clareza.",
    recursos: [
      "Dashboard",
      "Clientes",
      "Agenda",
      "Financeiro",
      "Formatos",
      "Contratos",
      "Contratos Modelo",
      "Configuracoes",
      "Assinatura",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: "R$ 209,90",
    descricao: "O plano mais completo para artistas, bandas e equipes em crescimento.",
    destaque: true,
    recursos: [
      "Tudo do Essencial",
      "Relatorios",
      "Calculadora de Show",
      "Colaboradores",
      "Agenda do Colaborador",
    ],
  },
  {
    id: "expertise",
    nome: "Expertise",
    preco: "R$ 359,90",
    descricao: "Para operacoes maiores, CRM comercial e recursos avancados.",
    recursos: [
      "Tudo do Profissional",
      "CRM Prefeituras",
      "Modulos avancados",
      "Automacoes futuras",
    ],
  },
];

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [emailGiba, setEmailGiba] = useState("");
  const [emailPagamento, setEmailPagamento] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processandoPlano, setProcessandoPlano] = useState<PlanoId | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    carregarAssinatura();
  }, []);

  const contaMaster = assinatura?.plano === "owner";
  const planoAtual = assinatura?.plano;

  const statusInfo = useMemo(() => {
    return obterStatusInfo(assinatura?.status, assinatura?.plano);
  }, [assinatura?.status, assinatura?.plano]);

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarAssinatura() {
    setCarregando(true);
    setFeedback("");

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    setEmailGiba(user.email || "");

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      setFeedback("Nao foi possivel carregar sua assinatura agora.");
      setCarregando(false);
      return;
    }

    setAssinatura(data as Assinatura | null);
    setEmailPagamento(data?.email_pagamento?.trim() || user.email?.trim() || "");
    setCarregando(false);
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomePlano(plano?: string) {
    if (!plano) return "Sem plano";
    if (plano === "teste") return "Teste gratis";
    if (plano === "essencial") return "Essencial";
    if (plano === "profissional") return "Profissional";
    if (plano === "expertise") return "Expertise";
    if (plano === "owner") return "Acesso Master";
    return plano;
  }

  function acaoPlano(plano: PlanoComercial) {
    if (planoAtual === plano.id && assinatura?.status === "ativo") {
      return "Plano atual";
    }

    if (assinatura?.status === "pendente" && planoAtual === plano.id) {
      return "Pagamento pendente";
    }

    if (!assinatura || planoAtual === "teste") {
      return `Assinar ${plano.nome}`;
    }

    if (assinatura.status !== "ativo") {
      return `Renovar ${plano.nome}`;
    }

    return `Trocar para ${plano.nome}`;
  }

  async function assinarPlano(plano: PlanoId) {
    if (contaMaster) {
      setFeedback("Conta master nao contrata planos pelo checkout.");
      return;
    }

    const emailTratado = emailPagamento.trim().toLowerCase();

    if (!emailTratado || !emailTratado.includes("@")) {
      setFeedback("Informe um e-mail valido para o pagamento no Mercado Pago.");
      return;
    }

    try {
      setFeedback("");
      setProcessandoPlano(plano);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        setFeedback("Sessao expirada. Faca login novamente.");
        window.location.href = "/login";
        return;
      }

      const resposta = await fetch("/api/mercadopago/criar-assinatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          plano,
          email_pagamento: emailTratado,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        console.error("Erro ao criar assinatura:", dados);
        setFeedback(dados?.error || "Nao foi possivel criar a assinatura agora.");
        return;
      }

      setFeedback("Assinatura criada. Finalize o pagamento no Mercado Pago.");

      if (!dados?.init_point) {
        setFeedback("Link de pagamento nao retornado pelo Mercado Pago.");
        return;
      }

      window.location.href = dados.init_point;
    } catch (error) {
      console.error("Erro inesperado ao assinar plano:", error);
      setFeedback("Erro inesperado ao iniciar assinatura.");
    } finally {
      setProcessandoPlano(null);
    }
  }

  async function salvarEmailPagamento() {
    if (!assinatura?.id) {
      setFeedback("Assinatura nao encontrada para salvar o e-mail.");
      return;
    }

    const emailTratado = emailPagamento.trim().toLowerCase();

    if (!emailTratado || !emailTratado.includes("@")) {
      setFeedback("Informe um e-mail valido para o Mercado Pago.");
      return;
    }

    const { error } = await supabase
      .from("subscriptions")
      .update({ email_pagamento: emailTratado })
      .eq("id", assinatura.id);

    if (error) {
      console.error("Erro ao salvar e-mail do Mercado Pago:", error);
      setFeedback("Nao foi possivel salvar o e-mail do Mercado Pago agora.");
      return;
    }

    setAssinatura({ ...assinatura, email_pagamento: emailTratado });
    setEmailPagamento(emailTratado);
    setFeedback("E-mail do Mercado Pago salvo com sucesso.");
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <main className="min-h-screen pb-12 text-white">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_24px_55px_rgba(0,170,255,0.22)]">
                <Crown size={36} />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                  Assinatura
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300">
                  Gerencie seu plano, pagamento e acesso a Plataforma GIBA.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={carregarAssinatura}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
              >
                <RefreshCw size={18} />
                Atualizar status
              </button>
              <button
                type="button"
                onClick={() => window.open("https://wa.me/5531993575969", "_blank", "noopener,noreferrer")}
                className="inline-flex h-12 items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 text-sm font-black text-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-500/15"
              >
                <MessageCircle size={18} />
                Falar com suporte
              </button>
            </div>
          </header>

          {feedback && (
            <div className="mb-6 rounded-3xl border border-sky-400/25 bg-sky-500/10 px-5 py-4 text-sm font-bold text-sky-100">
              {feedback}
            </div>
          )}

          <section className="mb-7 rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-xl md:p-7">
            {carregando ? (
              <p className="text-slate-300">Carregando assinatura...</p>
            ) : (
              <div className="grid gap-6">
                <div className="max-w-5xl">
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black uppercase tracking-wide text-slate-300">
                      <ShieldCheck size={16} />
                      Status atual
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wide ${statusInfo.classe}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  <h2 className="text-3xl font-black text-white md:text-[40px]">
                    {nomePlano(assinatura?.plano)}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    {assinatura?.status === "pendente"
                      ? "Pagamento pendente. Aguardando confirmacao do Mercado Pago."
                      : "Seu acesso e liberado de acordo com o plano ativo mais recente."}
                  </p>

                  <div className="mt-6 overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/20">
                    <StatusItem label="E-mail GIBA" value={emailGiba || "-"} />
                    <StatusItem label="Status" value={assinatura?.status || "-"} />
                    <StatusItem
                      label="Inicio"
                      value={formatarData(assinatura?.data_inicio)}
                    />
                    <StatusItem
                      label="Proximo vencimento"
                      value={formatarData(assinatura?.data_fim)}
                    />
                    <StatusItem
                      label="ID Mercado Pago"
                      value={assinatura?.mercadopago_subscription_id || "-"}
                    />
                    <StatusItem
                      label="Cliente Mercado Pago"
                      value={assinatura?.mercado_pago_customer_id || "-"}
                    />
                    {!contaMaster && (
                      <div className="grid gap-3 border-t border-white/10 px-4 py-4 lg:grid-cols-[220px_minmax(0,1fr)_150px] lg:items-center">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-violet-200">
                            <Mail size={18} />
                          </span>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                              E-mail Mercado Pago
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              Pode ser diferente do login.
                            </p>
                          </div>
                        </div>

                        <input
                          type="email"
                          value={emailPagamento}
                          onChange={(event) => setEmailPagamento(event.target.value)}
                          placeholder="financeiro@suaempresa.com.br"
                          className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 text-sm font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/70"
                        />

                        <button
                          type="button"
                          onClick={salvarEmailPagamento}
                          className="h-11 rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 px-4 text-sm font-black text-white shadow-[0_14px_28px_rgba(139,53,255,0.18)] transition hover:-translate-y-0.5"
                        >
                          Salvar e-mail
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {!contaMaster && (
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-black text-white">Planos GIBA</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Escolha, renove ou altere seu plano sem interromper o acesso atual antes da aprovacao.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {planosComerciais.map((plano) => {
                  const selecionado = planoAtual === plano.id && assinatura?.status === "ativo";
                  const pendente = planoAtual === plano.id && assinatura?.status === "pendente";
                  const bloqueado = !!processandoPlano || selecionado || pendente;

                  return (
                    <article
                      key={plano.id}
                      className={`relative overflow-hidden rounded-[28px] border bg-white/[0.06] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:-translate-y-1 ${
                        plano.destaque
                          ? "border-sky-400/45 shadow-sky-500/10"
                          : "border-white/10"
                      }`}
                    >
                      {plano.destaque && (
                        <span className="mb-4 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-sky-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-white">
                          Mais escolhido
                        </span>
                      )}

                      {selecionado && (
                        <span className="mb-4 ml-2 inline-flex rounded-full border border-emerald-400/25 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-200">
                          Plano atual
                        </span>
                      )}

                      {pendente && (
                        <span className="mb-4 ml-2 inline-flex rounded-full border border-amber-400/25 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-amber-200">
                          Pendente
                        </span>
                      )}

                      <h3 className="text-2xl font-black text-white">{plano.nome}</h3>
                      <p className="mt-2 min-h-[54px] text-sm leading-6 text-slate-300">
                        {plano.descricao}
                      </p>

                      <div className="my-6 flex items-end gap-2">
                        <strong className="text-4xl font-black text-white">
                          {plano.preco}
                        </strong>
                        <span className="pb-1 text-sm font-bold text-slate-400">
                          /mes
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={bloqueado}
                        onClick={() => assinarPlano(plano.id)}
                        className="mb-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        <CreditCard size={18} />
                        {processandoPlano === plano.id
                          ? "Gerando checkout..."
                          : acaoPlano(plano)}
                      </button>

                      <ul className="grid gap-3">
                        {plano.recursos.map((recurso) => (
                          <li
                            key={recurso}
                            className="flex items-start gap-3 text-sm font-semibold leading-6 text-slate-200"
                          >
                            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-300">
                              <Check size={15} />
                            </span>
                            {recurso}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-7 rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-violet-500/15 to-sky-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-500/20 text-sky-200">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">
                  Pagamento seguro pelo Mercado Pago
                </h2>
                <p className="mt-2 max-w-4xl text-sm leading-7 text-slate-300">
                  O GIBA salva o plano como pendente, redireciona para o checkout e so atualiza o acesso quando o webhook confirmar a aprovacao. Assim, o teste gratis ou plano atual nao e removido antes da confirmacao.
                </p>
              </div>
            </div>
          </section>
        </main>
      </AppLayout>
    </ProtectedRoute>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 border-t border-white/10 px-4 py-4 first:border-t-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="break-words text-sm font-black leading-5 text-white sm:text-right">
        {value}
      </p>
    </div>
  );
}

function obterStatusInfo(status?: string, plano?: string) {
  if (plano === "teste") {
    return {
      label: "Teste gratis",
      classe: "border-sky-400/25 bg-sky-500/10 text-sky-200",
    };
  }

  if (status === "ativo") {
    return {
      label: "Ativo",
      classe: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    };
  }

  if (status === "pendente") {
    return {
      label: "Pendente",
      classe: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    };
  }

  if (status === "cancelado") {
    return {
      label: "Cancelado",
      classe: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    };
  }

  if (status === "vencido") {
    return {
      label: "Vencido",
      classe: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    };
  }

  return {
    label: status || "Sem status",
    classe: "border-white/10 bg-white/[0.07] text-slate-200",
  };
}

"use client";

import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../lib/supabase";

type Assinatura = {
  id: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_fim?: string | null;
  mercadopago_subscription_id?: string | null;
};

export default function AssinaturaPage() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processandoPlano, setProcessandoPlano] = useState<string | null>(null);

  useEffect(() => {
    carregarAssinatura();
  }, []);

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

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
      alert("Erro ao carregar assinatura.");
      setCarregando(false);
      return;
    }

    setAssinatura(data);
    setCarregando(false);
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  function corStatus(status?: string) {
    switch (status) {
      case "ativo":
        return "#22c55e";

      case "pendente":
        return "#f59e0b";

      case "cancelado":
        return "#ef4444";

      default:
        return "#94a3b8";
    }
  }

  function nomePlano(plano?: string) {
    if (!plano) return "Sem plano";

    if (plano === "teste") return "Teste";
    if (plano === "essencial") return "Essencial";
    if (plano === "profissional") return "Profissional";
    if (plano === "expertise") return "Expertise";
    if (plano === "owner") return "Acesso Master";

    return plano;
  }

  const contaMaster = assinatura?.plano === "owner";

  async function assinarPlano(plano: "essencial" | "profissional" | "expertise") {
    try {
      setProcessandoPlano(plano);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        alert("Sessão expirada. Faça login novamente.");
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
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        console.error("Erro ao criar assinatura:", dados);
        alert(dados?.error || "Erro ao criar assinatura.");
        return;
      }

      if (!dados?.init_point) {
        alert("Link de pagamento não retornado pelo Mercado Pago.");
        return;
      }

      window.location.href = dados.init_point;
    } catch (error) {
      console.error("Erro inesperado ao assinar plano:", error);
      alert("Erro inesperado ao iniciar assinatura.");
    } finally {
      setProcessandoPlano(null);
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "36px" }}>
            Minha Assinatura
          </h1>

          <p style={{ color: "#b8b8d8" }}>
            Gerencie seu plano e acompanhe sua assinatura.
          </p>

          {!contaMaster && (
          <section style={planosGridStyle}>
            <div style={planoCardStyle}>
              <h2>Plano Essencial</h2>

              <h1 style={precoStyle}>R$ 109,90/mês</h1>

              <p style={descricaoPlanoStyle}>
                Ideal para artistas que precisam organizar clientes, agenda,
                financeiro, contratos e configurações básicas.
              </p>

              <button
                type="button"
                onClick={() => assinarPlano("essencial")}
                disabled={!!processandoPlano}
                style={{
                  ...botaoPrincipal,
                  width: "100%",
                  opacity: processandoPlano ? 0.7 : 1,
                }}
              >
                {processandoPlano === "essencial"
                  ? "Gerando checkout..."
                  : "Assinar Essencial"}
              </button>
            </div>

            <div style={planoCardDestaqueStyle}>
              <h2>Plano Profissional</h2>

              <h1 style={precoStyle}>R$ 209,90/mês</h1>

              <p style={descricaoPlanoStyle}>
                Recomendado para bandas, produtores e equipes que precisam de
                recursos avançados, relatórios, colaboradores e calculadora de show.
              </p>

              <button
                type="button"
                onClick={() => assinarPlano("profissional")}
                disabled={!!processandoPlano}
                style={{
                  ...botaoPrincipal,
                  width: "100%",
                  opacity: processandoPlano ? 0.7 : 1,
                }}
              >
                {processandoPlano === "profissional"
                  ? "Gerando checkout..."
                  : "Assinar Profissional"}
              </button>
            </div>

            <div style={planoCardStyle}>
              <h2>Plano Expertise</h2>

              <h1 style={precoStyle}>R$ 359,90/mês</h1>

              <p style={descricaoPlanoStyle}>
                Todos os recursos do GIBA, incluindo módulos avançados,
                CRM, gestão de eventos e futuras funcionalidades exclusivas.
              </p>

              <button
                type="button"
                onClick={() => assinarPlano("expertise")}
                disabled={!!processandoPlano}
                style={{
                  ...botaoPrincipal,
                  width: "100%",
                  opacity: processandoPlano ? 0.7 : 1,
                }}
              >
                {processandoPlano === "expertise"
                  ? "Gerando checkout..."
                  : "Assinar Expertise"}
              </button>
            </div>
          </section>
          )}

          {contaMaster && (
            <section style={masterCardStyle}>
              <h2>Acesso Master liberado</h2>

              <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                Esta conta possui acesso interno completo ao GIBA e não precisa
                contratar planos pelo checkout.
              </p>
            </section>
          )}

          {carregando ? (
            <p>Carregando...</p>
          ) : !assinatura ? (
            <div style={cardStyle}>
              <h2>Nenhuma assinatura encontrada</h2>

              <p style={{ color: "#b8b8d8" }}>
                Sua conta ainda não possui uma assinatura ativa.
              </p>
            </div>
          ) : (
            <>
              <div style={cardStyle}>
                <h2>Plano Atual</h2>

                <h1
                  style={{
                    fontSize: "42px",
                    marginTop: "10px",
                    textTransform: "capitalize",
                  }}
                >
                  {nomePlano(assinatura.plano)}
                </h1>

                <span
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    background: corStatus(assinatura.status),
                    color: "#fff",
                    fontWeight: "bold",
                  }}
                >
                  {assinatura.status}
                </span>
              </div>

              <div style={gridStyle}>
                <div style={cardStyle}>
                  <h3>Data de Início</h3>

                  <p>{formatarData(assinatura.data_inicio)}</p>
                </div>

                <div style={cardStyle}>
                  <h3>Próximo Vencimento</h3>

                  <p>{formatarData(assinatura.data_fim)}</p>
                </div>
              </div>

              {!contaMaster ? (
                <div style={cardStyle}>
                  <h2>Gerenciamento</h2>

                  <div style={acoesStyle}>
                    <button
                      type="button"
                      onClick={() => assinarPlano("essencial")}
                      disabled={!!processandoPlano}
                      style={{
                        ...botaoPrincipal,
                        opacity: processandoPlano ? 0.7 : 1,
                      }}
                    >
                      Assinar Essencial
                    </button>

                    <button
                      type="button"
                      onClick={() => assinarPlano("profissional")}
                      disabled={!!processandoPlano}
                      style={{
                        ...botaoPrincipal,
                        opacity: processandoPlano ? 0.7 : 1,
                      }}
                    >
                      Assinar Profissional
                    </button>

                    <button
                      type="button"
                      onClick={() => assinarPlano("expertise")}
                      disabled={!!processandoPlano}
                      style={{
                        ...botaoPrincipal,
                        opacity: processandoPlano ? 0.7 : 1,
                      }}
                    >
                      Assinar Expertise
                    </button>

                    <button style={botaoSecundario}>
                      Cancelar Assinatura
                    </button>
                  </div>

                  <p
                    style={{
                      color: "#94a3b8",
                      marginTop: "20px",
                    }}
                  >
                    Os botões de assinatura já estão conectados ao Mercado Pago
                    em ambiente de teste.
                  </p>
                </div>
              ) : (
                <div style={cardStyle}>
                  <h2>Gerenciamento</h2>

                  <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                    Esta conta é uma conta master interna. O plano não pode ser
                    alterado por checkout e possui acesso completo permanente.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

const masterCardStyle: React.CSSProperties = {
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.35)",
  borderRadius: "24px",
  padding: "24px",
  margin: "28px 0",
  boxShadow: "0 0 35px rgba(34,197,94,0.12)",
};

const planosGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  margin: "28px 0",
};

const planoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
};

const planoCardDestaqueStyle: React.CSSProperties = {
  ...planoCardStyle,
  border: "1px solid rgba(56,189,248,0.55)",
  boxShadow: "0 0 35px rgba(0,170,255,0.18)",
};

const precoStyle: React.CSSProperties = {
  fontSize: "34px",
  margin: "12px 0",
};

const descricaoPlanoStyle: React.CSSProperties = {
  color: "#b8b8d8",
  lineHeight: 1.6,
  minHeight: "82px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
};

const acoesStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const botaoPrincipal: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundario: React.CSSProperties = {
  ...botaoPrincipal,
  background: "#ef4444",
};
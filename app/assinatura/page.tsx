"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
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

type PlanoId = "essencial" | "profissional" | "expertise";

type PlanoComercial = {
  id: PlanoId;
  nome: string;
  preco: string;
  subtitulo: string;
  descricao: string;
  destaque?: boolean;
  recursos: string[];
};

const planosComerciais: PlanoComercial[] = [
  {
    id: "essencial",
    nome: "Essencial",
    preco: "R$ 109,90",
    subtitulo: "Para organizar o básico com profissionalismo.",
    descricao:
      "Ideal para artistas solo e pequenos projetos que precisam controlar agenda, clientes, financeiro e contratos.",
    recursos: [
      "Dashboard",
      "Clientes",
      "Agenda",
      "Financeiro",
      "Formatos",
      "Contratos",
      "Modelos de contrato",
      "Configurações",
      "Assinatura",
    ],
  },
  {
    id: "profissional",
    nome: "Profissional",
    preco: "R$ 209,90",
    subtitulo: "O plano mais indicado para bandas e equipes.",
    descricao:
      "Recomendado para artistas, bandas e produtores que precisam de relatórios, colaboradores e cálculo de show.",
    destaque: true,
    recursos: [
      "Tudo do Essencial",
      "Relatórios",
      "Calculadora de Show",
      "Colaboradores",
      "Agenda do Colaborador",
      "Mais controle para equipe",
    ],
  },
  {
    id: "expertise",
    nome: "Expertise",
    preco: "R$ 359,90",
    subtitulo: "Para operações maiores e gestão avançada.",
    descricao:
      "Pensado para artistas, produtoras e escritórios que desejam evoluir para CRM, eventos e gestão comercial.",
    recursos: [
      "Tudo do Profissional",
      "CRM de Prefeituras em breve",
      "Gestão de Eventos em breve",
      "Dashboard Comercial em breve",
      "Recursos premium futuros",
    ],
  },
];

const comparativo: Array<{
  recurso: string;
  essencial: boolean | "breve";
  profissional: boolean | "breve";
  expertise: boolean | "breve";
}> = [
  { recurso: "Dashboard", essencial: true, profissional: true, expertise: true },
  { recurso: "Clientes", essencial: true, profissional: true, expertise: true },
  { recurso: "Agenda", essencial: true, profissional: true, expertise: true },
  { recurso: "Financeiro", essencial: true, profissional: true, expertise: true },
  { recurso: "Formatos", essencial: true, profissional: true, expertise: true },
  { recurso: "Contratos", essencial: true, profissional: true, expertise: true },
  {
    recurso: "Modelos de Contrato",
    essencial: true,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "Configurações",
    essencial: true,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "Relatórios",
    essencial: false,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "Calculadora de Show",
    essencial: false,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "Colaboradores",
    essencial: false,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "Agenda do Colaborador",
    essencial: false,
    profissional: true,
    expertise: true,
  },
  {
    recurso: "CRM de Prefeituras",
    essencial: false,
    profissional: false,
    expertise: "breve",
  },
  {
    recurso: "Gestão de Eventos",
    essencial: false,
    profissional: false,
    expertise: "breve",
  },
];

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
  const planoAtual = assinatura?.plano;

  async function assinarPlano(plano: PlanoId) {
    if (contaMaster) {
      alert("Conta master não pode contratar plano pelo checkout.");
      return;
    }

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
        <div style={pageStyle}>
          <section style={heroStyle}>
            <div>
              <span style={eyebrowStyle}>GIBA Assinaturas</span>

              <h1 style={tituloStyle}>Minha Assinatura</h1>

              <p style={subtituloStyle}>
                Gerencie seu plano, acompanhe o vencimento e escolha os recursos
                ideais para sua operação artística.
              </p>
            </div>
          </section>

          {carregando ? (
            <section style={cardStyle}>
              <p style={{ color: "#b8b8d8" }}>Carregando assinatura...</p>
            </section>
          ) : !assinatura ? (
            <section style={cardStyle}>
              <h2>Nenhuma assinatura encontrada</h2>

              <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                Sua conta ainda não possui uma assinatura ativa. Escolha um plano
                abaixo para iniciar o uso do GIBA.
              </p>
            </section>
          ) : (
            <>
              {contaMaster && (
                <section style={masterCardStyle}>
                  <div>
                    <span style={eyebrowVerdeStyle}>Conta proprietária</span>

                    <h2 style={{ marginTop: "8px" }}>
                      Acesso Master liberado
                    </h2>

                    <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                      Esta conta possui acesso interno completo ao GIBA, não
                      depende das permissões dos planos e não precisa contratar
                      pelo checkout.
                    </p>
                  </div>
                </section>
              )}

              <section style={infoGridStyle}>
                <div style={cardStyle}>
                  <span style={labelStyle}>Plano Atual</span>

                  <h2 style={planoAtualTituloStyle}>
                    {nomePlano(assinatura.plano)}
                  </h2>

                  <span
                    style={{
                      ...statusBadgeStyle,
                      background: corStatus(assinatura.status),
                    }}
                  >
                    {assinatura.status}
                  </span>
                </div>

                <div style={cardStyle}>
                  <span style={labelStyle}>Data de Início</span>

                  <h2 style={infoNumeroStyle}>
                    {formatarData(assinatura.data_inicio)}
                  </h2>
                </div>

                <div style={cardStyle}>
                  <span style={labelStyle}>Próximo Vencimento</span>

                  <h2 style={infoNumeroStyle}>
                    {formatarData(assinatura.data_fim)}
                  </h2>
                </div>
              </section>
            </>
          )}

          {!contaMaster && (
            <>
              <section style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Escolha seu plano</h2>

                  <p style={sectionDescriptionStyle}>
                    Compare as opções e selecione o plano ideal para sua fase
                    atual.
                  </p>
                </div>
              </section>

              <section style={planosGridStyle}>
                {planosComerciais.map((plano) => {
                  const planoSelecionado = planoAtual === plano.id;
                  const bloqueado = !!processandoPlano || planoSelecionado;

                  return (
                    <div
                      key={plano.id}
                      style={
                        plano.destaque
                          ? planoCardDestaqueStyle
                          : planoCardStyle
                      }
                    >
                      <div style={cardPlanoTopoStyle}>
                        {plano.destaque && (
                          <span style={tagDestaqueStyle}>Mais indicado</span>
                        )}

                        {planoSelecionado && (
                          <span style={tagAtualStyle}>Plano atual</span>
                        )}
                      </div>

                      <h2 style={nomePlanoStyle}>{plano.nome}</h2>

                      <p style={subtituloPlanoStyle}>{plano.subtitulo}</p>

                      <div style={precoLinhaStyle}>
                        <strong style={precoStyle}>{plano.preco}</strong>
                        <span style={{ color: "#b8b8d8" }}>/mês</span>
                      </div>

                      <p style={descricaoPlanoStyle}>{plano.descricao}</p>

                      <button
                        type="button"
                        onClick={() => assinarPlano(plano.id)}
                        disabled={bloqueado}
                        style={{
                          ...botaoPrincipal,
                          width: "100%",
                          opacity: bloqueado ? 0.7 : 1,
                          cursor: bloqueado ? "not-allowed" : "pointer",
                        }}
                      >
                        {planoSelecionado
                          ? "Plano atual"
                          : processandoPlano === plano.id
                          ? "Gerando checkout..."
                          : `Assinar ${plano.nome}`}
                      </button>

                      <ul style={listaRecursosStyle}>
                        {plano.recursos.map((recurso) => (
                          <li key={recurso} style={itemRecursoStyle}>
                            <span style={checkStyle}>✓</span>
                            <span>{recurso}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </section>
            </>
          )}

          <section style={comparativoCardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Comparativo dos planos</h2>

                <p style={sectionDescriptionStyle}>
                  Veja rapidamente quais módulos estão disponíveis em cada plano.
                </p>
              </div>
            </div>

            <div style={tabelaContainerStyle}>
              <table style={tabelaStyle}>
                <thead>
                  <tr>
                    <th style={thLeftStyle}>Funcionalidade</th>
                    <th style={thCenterStyle}>Essencial</th>
                    <th style={thCenterStyle}>Profissional</th>
                    <th style={thCenterStyle}>Expertise</th>
                  </tr>
                </thead>

                <tbody>
                  {comparativo.map((linha) => (
                    <tr key={linha.recurso}>
                      <td style={tdLeftStyle}>{linha.recurso}</td>
                      <td style={tdCenterStyle}>{renderDisponibilidade(linha.essencial)}</td>
                      <td style={tdCenterStyle}>
                        {renderDisponibilidade(linha.profissional)}
                      </td>
                      <td style={tdCenterStyle}>
                        {renderDisponibilidade(linha.expertise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section style={recomendacaoStyle}>
            <div>
              <span style={eyebrowAzulStyle}>Recomendação GIBA</span>

              <h2 style={{ marginTop: "8px" }}>Plano Profissional</h2>

              <p style={{ color: "#dbeafe", lineHeight: 1.7 }}>
                Para artistas e bandas que já trabalham com equipe, agenda
                recorrente, contratos e controle financeiro, o plano Profissional
                entrega o melhor equilíbrio entre recursos e investimento.
              </p>
            </div>
          </section>

          {assinatura && (
            <section style={cardStyle}>
              <h2>Gerenciamento</h2>

              {!contaMaster ? (
                <>
                  <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                    Os botões acima estão conectados ao Mercado Pago. Ao trocar
                    ou contratar um plano, o GIBA redireciona para o checkout
                    seguro de assinatura.
                  </p>

                  <div style={acoesStyle}>
                    <button
                      type="button"
                      onClick={() => assinarPlano("essencial")}
                      disabled={!!processandoPlano || planoAtual === "essencial"}
                      style={{
                        ...botaoPrincipal,
                        opacity:
                          processandoPlano || planoAtual === "essencial"
                            ? 0.7
                            : 1,
                      }}
                    >
                      Essencial
                    </button>

                    <button
                      type="button"
                      onClick={() => assinarPlano("profissional")}
                      disabled={
                        !!processandoPlano || planoAtual === "profissional"
                      }
                      style={{
                        ...botaoPrincipal,
                        opacity:
                          processandoPlano || planoAtual === "profissional"
                            ? 0.7
                            : 1,
                      }}
                    >
                      Profissional
                    </button>

                    <button
                      type="button"
                      onClick={() => assinarPlano("expertise")}
                      disabled={!!processandoPlano || planoAtual === "expertise"}
                      style={{
                        ...botaoPrincipal,
                        opacity:
                          processandoPlano || planoAtual === "expertise"
                            ? 0.7
                            : 1,
                      }}
                    >
                      Expertise
                    </button>

                    <button type="button" style={botaoSecundario}>
                      Cancelar Assinatura
                    </button>
                  </div>
                </>
              ) : (
                <p style={{ color: "#b8b8d8", lineHeight: 1.6 }}>
                  Esta conta é uma conta master interna. O plano não pode ser
                  alterado por checkout e possui acesso completo permanente.
                </p>
              )}
            </section>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function renderDisponibilidade(valor: boolean | "breve") {
  if (valor === true) {
    return <span style={checkTabelaStyle}>✓</span>;
  }

  if (valor === "breve") {
    return <span style={breveStyle}>Em breve</span>;
  }

  return <span style={indisponivelStyle}>—</span>;
}

const pageStyle: CSSProperties = {
  color: "#fff",
  paddingBottom: "40px",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "24px",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const eyebrowStyle: CSSProperties = {
  display: "inline-block",
  color: "#38bdf8",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "10px",
};

const eyebrowAzulStyle: CSSProperties = {
  ...eyebrowStyle,
  color: "#bfdbfe",
};

const eyebrowVerdeStyle: CSSProperties = {
  ...eyebrowStyle,
  color: "#86efac",
};

const tituloStyle: CSSProperties = {
  fontSize: "38px",
  lineHeight: 1.1,
  margin: 0,
};

const subtituloStyle: CSSProperties = {
  color: "#b8b8d8",
  maxWidth: "760px",
  lineHeight: 1.7,
  marginTop: "12px",
};


const labelStyle: CSSProperties = {
  display: "block",
  color: "#94a3b8",
  fontSize: "13px",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};


const statusBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  color: "#fff",
  fontWeight: "bold",
  textTransform: "capitalize",
  fontSize: "13px",
};

const masterCardStyle: CSSProperties = {
  background: "rgba(34,197,94,0.10)",
  border: "1px solid rgba(34,197,94,0.35)",
  borderRadius: "24px",
  padding: "24px",
  margin: "28px 0",
  boxShadow: "0 0 35px rgba(34,197,94,0.12)",
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const cardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
};

const planoAtualTituloStyle: CSSProperties = {
  fontSize: "32px",
  marginTop: "10px",
  marginBottom: "14px",
  textTransform: "capitalize",
};

const infoNumeroStyle: CSSProperties = {
  fontSize: "28px",
  marginTop: "12px",
  marginBottom: 0,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "16px",
  flexWrap: "wrap",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  fontSize: "28px",
  margin: 0,
};

const sectionDescriptionStyle: CSSProperties = {
  color: "#b8b8d8",
  marginTop: "8px",
  marginBottom: 0,
  lineHeight: 1.6,
};

const planosGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
  margin: "28px 0",
};

const planoCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  position: "relative",
  overflow: "hidden",
};

const planoCardDestaqueStyle: CSSProperties = {
  ...planoCardStyle,
  border: "1px solid rgba(56,189,248,0.65)",
  boxShadow: "0 0 40px rgba(0,170,255,0.20)",
  transform: "translateY(-4px)",
};

const cardPlanoTopoStyle: CSSProperties = {
  minHeight: "34px",
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  marginBottom: "8px",
};

const tagDestaqueStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "bold",
};

const tagAtualStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.16)",
  color: "#86efac",
  border: "1px solid rgba(34,197,94,0.32)",
  fontSize: "12px",
  fontWeight: "bold",
};

const nomePlanoStyle: CSSProperties = {
  fontSize: "26px",
  margin: "4px 0 8px",
};

const subtituloPlanoStyle: CSSProperties = {
  color: "#e2e8f0",
  minHeight: "44px",
  lineHeight: 1.5,
};

const precoLinhaStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: "8px",
  margin: "18px 0",
};

const precoStyle: CSSProperties = {
  fontSize: "34px",
  lineHeight: 1,
};

const descricaoPlanoStyle: CSSProperties = {
  color: "#b8b8d8",
  lineHeight: 1.6,
  minHeight: "104px",
};

const listaRecursosStyle: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: "22px 0 0",
  display: "grid",
  gap: "12px",
};

const itemRecursoStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  color: "#dbeafe",
  lineHeight: 1.5,
};

const checkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "22px",
  height: "22px",
  minWidth: "22px",
  borderRadius: "999px",
  background: "rgba(34,197,94,0.18)",
  color: "#86efac",
  fontWeight: "bold",
};

const comparativoCardStyle: CSSProperties = {
  ...cardStyle,
  overflow: "hidden",
};

const tabelaContainerStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tabelaStyle: CSSProperties = {
  width: "100%",
  minWidth: "720px",
  borderCollapse: "collapse",
};

const thLeftStyle: CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#e2e8f0",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const thCenterStyle: CSSProperties = {
  textAlign: "center",
  padding: "14px 12px",
  color: "#e2e8f0",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
};

const tdLeftStyle: CSSProperties = {
  padding: "14px 12px",
  color: "#cbd5e1",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const tdCenterStyle: CSSProperties = {
  padding: "14px 12px",
  textAlign: "center",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const checkTabelaStyle: CSSProperties = {
  color: "#86efac",
  fontWeight: "bold",
  fontSize: "18px",
};

const breveStyle: CSSProperties = {
  display: "inline-block",
  color: "#7dd3fc",
  background: "rgba(14,165,233,0.12)",
  border: "1px solid rgba(14,165,233,0.28)",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
};

const indisponivelStyle: CSSProperties = {
  color: "#64748b",
  fontWeight: "bold",
  fontSize: "18px",
};

const recomendacaoStyle: CSSProperties = {
  background:
    "linear-gradient(135deg, rgba(139,53,255,0.32), rgba(0,170,255,0.24))",
  border: "1px solid rgba(125,211,252,0.35)",
  borderRadius: "24px",
  padding: "26px",
  marginBottom: "24px",
  boxShadow: "0 0 35px rgba(0,170,255,0.12)",
};

const acoesStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "20px",
};

const botaoPrincipal: CSSProperties = {
  padding: "14px 20px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundario: CSSProperties = {
  ...botaoPrincipal,
  background: "#ef4444",
};

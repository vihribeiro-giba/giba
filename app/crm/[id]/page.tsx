"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppLayout from "../../../components/AppLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { supabase } from "../../../lib/supabase";

type Municipio = {
  id: string;
  user_id: string;
  nome: string;
  estado: string | null;
  habitantes: number | null;
  distancia_bh: number | null;
  prefeito: string | null;
  email_prefeito: string | null;
  secretario_cultura: string | null;
  email_cultura: string | null;
  telefone_whatsapp: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

type Oportunidade = {
  id: string;
  user_id: string;
  municipio_id: string;
  status: string;
  valor_proposto: number | null;
  data_contato: string | null;
  proximo_contato: string | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

type EventoMunicipal = {
  id: string;
  user_id: string;
  municipio_id: string;
  nome_evento: string;
  data_evento: string | null;
  modelo_contratacao: string | null;
  prioridade: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

type Interacao = {
  id: string;
  user_id: string;
  oportunidade_id: string;
  tipo: string;
  descricao: string | null;
  data_interacao: string;
  created_at: string;
};

const STATUS_OPTIONS = [
  { value: "novo_lead", label: "Novo Lead" },
  { value: "contato_realizado", label: "Contato Realizado" },
  { value: "email_enviado", label: "E-mail Enviado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "negociacao", label: "Negociação" },
  { value: "aguardando_retorno", label: "Aguardando Retorno" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const TIPOS_INTERACAO = [
  "Ligação",
  "WhatsApp",
  "E-mail",
  "Reunião",
  "Visita",
  "Observação",
];

export default function CrmDetalhesPage() {
  const params = useParams();
  const municipioId = String(params?.id || "");

  const [municipio, setMunicipio] = useState<Municipio | null>(null);
  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [eventos, setEventos] = useState<EventoMunicipal[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvandoInteracao, setSalvandoInteracao] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);

  const [tipoInteracao, setTipoInteracao] = useState("WhatsApp");
  const [descricaoInteracao, setDescricaoInteracao] = useState("");

  const [nomeEvento, setNomeEvento] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [modeloContratacao, setModeloContratacao] = useState("");
  const [prioridadeEvento, setPrioridadeEvento] = useState("");
  const [observacoesEvento, setObservacoesEvento] = useState("");

  useEffect(() => {
    if (municipioId) {
      carregarDetalhes();
    }
  }, [municipioId]);

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarDetalhes() {
    setCarregando(true);

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    const { data: municipioData, error: municipioError } = await supabase
      .from("municipios")
      .select("*")
      .eq("id", municipioId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (municipioError) {
      console.error("Erro ao carregar município:", municipioError);
      alert("Erro ao carregar município.");
      setCarregando(false);
      return;
    }

    if (!municipioData) {
      setMunicipio(null);
      setCarregando(false);
      return;
    }

    const { data: oportunidadeData, error: oportunidadeError } = await supabase
      .from("crm_oportunidades")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (oportunidadeError) {
      console.error("Erro ao carregar oportunidade:", oportunidadeError);
    }

    const { data: eventosData, error: eventosError } = await supabase
      .from("municipio_eventos")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("user_id", user.id)
      .order("data_evento", { ascending: true });

    if (eventosError) {
      console.error("Erro ao carregar eventos:", eventosError);
    }

    let interacoesData: Interacao[] = [];

    if (oportunidadeData?.id) {
      const { data, error } = await supabase
        .from("crm_interacoes")
        .select("*")
        .eq("oportunidade_id", oportunidadeData.id)
        .eq("user_id", user.id)
        .order("data_interacao", { ascending: false });

      if (error) {
        console.error("Erro ao carregar interações:", error);
      }

      interacoesData = (data || []) as Interacao[];
    }

    setMunicipio(municipioData as Municipio);
    setOportunidade((oportunidadeData || null) as Oportunidade | null);
    setEventos((eventosData || []) as EventoMunicipal[]);
    setInteracoes(interacoesData);
    setCarregando(false);
  }

  async function alterarStatus(status: string) {
    if (!oportunidade?.id) return;

    const { error } = await supabase
      .from("crm_oportunidades")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", oportunidade.id);

    if (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status.");
      return;
    }

    await carregarDetalhes();
  }

  async function salvarInteracao(event: React.FormEvent) {
    event.preventDefault();

    const user = await obterUsuarioLogado();

    if (!user || !oportunidade?.id) return;

    if (!descricaoInteracao.trim()) {
      alert("Descreva a interação realizada.");
      return;
    }

    try {
      setSalvandoInteracao(true);

      const { error } = await supabase.from("crm_interacoes").insert({
        user_id: user.id,
        oportunidade_id: oportunidade.id,
        tipo: tipoInteracao,
        descricao: descricaoInteracao.trim(),
        data_interacao: new Date().toISOString(),
      });

      if (error) {
        console.error("Erro ao salvar interação:", error);
        alert("Erro ao salvar interação.");
        return;
      }

      setDescricaoInteracao("");
      await carregarDetalhes();
    } finally {
      setSalvandoInteracao(false);
    }
  }

  async function salvarEvento(event: React.FormEvent) {
    event.preventDefault();

    const user = await obterUsuarioLogado();

    if (!user || !municipio?.id) return;

    if (!nomeEvento.trim()) {
      alert("Informe o nome do evento.");
      return;
    }

    try {
      setSalvandoEvento(true);

      const { error } = await supabase.from("municipio_eventos").insert({
        user_id: user.id,
        municipio_id: municipio.id,
        nome_evento: nomeEvento.trim(),
        data_evento: dataEvento || null,
        modelo_contratacao: modeloContratacao.trim() || null,
        prioridade: prioridadeEvento.trim() || null,
        observacoes: observacoesEvento.trim() || null,
      });

      if (error) {
        console.error("Erro ao salvar evento:", error);
        alert("Erro ao salvar evento.");
        return;
      }

      setNomeEvento("");
      setDataEvento("");
      setModeloContratacao("");
      setPrioridadeEvento("");
      setObservacoesEvento("");

      await carregarDetalhes();
    } finally {
      setSalvandoEvento(false);
    }
  }

  async function excluirEvento(id: string) {
    const confirmar = window.confirm("Deseja excluir este evento?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("municipio_eventos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir evento:", error);
      alert("Erro ao excluir evento.");
      return;
    }

    await carregarDetalhes();
  }

  function labelStatus(status?: string | null) {
    return (
      STATUS_OPTIONS.find((item) => item.value === status)?.label ||
      status ||
      "-"
    );
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";
    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  function formatarDataHora(data?: string | null) {
    if (!data) return "-";
    return new Date(data).toLocaleString("pt-BR");
  }

  function formatarMoeda(valor?: number | null) {
    if (!valor) return "R$ 0,00";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <div style={headerStyle}>
            <div>
              <Link href="/crm" style={voltarStyle}>
                ← Voltar para o CRM
              </Link>

              <p style={tagStyle}>DETALHES DO MUNICÍPIO</p>

              <h1 style={tituloStyle}>
                {carregando
                  ? "Carregando..."
                  : municipio
                  ? `${municipio.nome}${municipio.estado ? ` / ${municipio.estado}` : ""}`
                  : "Município não encontrado"}
              </h1>

              {municipio && (
                <p style={subtituloStyle}>
                  Histórico comercial, eventos, contatos e oportunidades.
                </p>
              )}
            </div>
          </div>

          {carregando ? (
            <p style={{ color: "#b8b8d8" }}>Carregando detalhes...</p>
          ) : !municipio ? (
            <section style={cardStyle}>
              <h2>Município não encontrado</h2>
              <p style={{ color: "#b8b8d8" }}>
                Esse cadastro não existe ou você não tem acesso a ele.
              </p>
            </section>
          ) : (
            <>
              <section style={resumoGridStyle}>
                <div style={cardStyle}>
                  <p style={cardLabelStyle}>Status</p>

                  <select
                    value={oportunidade?.status || "novo_lead"}
                    onChange={(e) => alterarStatus(e.target.value)}
                    style={inputStyle}
                    disabled={!oportunidade?.id}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={cardStyle}>
                  <p style={cardLabelStyle}>Valor proposto</p>
                  <h2 style={cardNumeroStyle}>
                    {formatarMoeda(oportunidade?.valor_proposto)}
                  </h2>
                </div>

                <div style={cardStyle}>
                  <p style={cardLabelStyle}>Próximo contato</p>
                  <h2 style={cardNumeroStyle}>
                    {formatarData(oportunidade?.proximo_contato)}
                  </h2>
                </div>
              </section>

              <section style={gridDuasColunasStyle}>
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0 }}>Dados da Prefeitura</h2>

                  <div style={infoGridStyle}>
                    <Info label="Prefeito" value={municipio.prefeito} />
                    <Info label="E-mail Prefeito" value={municipio.email_prefeito} />
                    <Info
                      label="Secretário de Cultura"
                      value={municipio.secretario_cultura}
                    />
                    <Info label="E-mail Cultura" value={municipio.email_cultura} />
                    <Info label="Telefone/WhatsApp" value={municipio.telefone_whatsapp} />
                    <Info label="Habitantes" value={municipio.habitantes} />
                    <Info label="Distância BH" value={municipio.distancia_bh ? `${municipio.distancia_bh} km` : "-"} />
                  </div>

                  {municipio.observacoes && (
                    <div style={{ marginTop: "18px" }}>
                      <p style={infoLabelStyle}>Observações</p>
                      <p style={textoLongoStyle}>{municipio.observacoes}</p>
                    </div>
                  )}
                </div>

                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0 }}>Registrar interação</h2>

                  <form onSubmit={salvarInteracao}>
                    <label style={labelStyle}>Tipo</label>
                    <select
                      value={tipoInteracao}
                      onChange={(e) => setTipoInteracao(e.target.value)}
                      style={inputStyle}
                    >
                      {TIPOS_INTERACAO.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>

                    <label style={{ ...labelStyle, marginTop: "14px" }}>
                      Descrição
                    </label>
                    <textarea
                      value={descricaoInteracao}
                      onChange={(e) => setDescricaoInteracao(e.target.value)}
                      style={{ ...inputStyle, minHeight: "120px" }}
                      placeholder="Ex: Enviei proposta por WhatsApp para o secretário..."
                    />

                    <button
                      type="submit"
                      disabled={salvandoInteracao || !oportunidade?.id}
                      style={{
                        ...botaoPrincipal,
                        width: "100%",
                        marginTop: "14px",
                        opacity:
                          salvandoInteracao || !oportunidade?.id ? 0.7 : 1,
                      }}
                    >
                      {salvandoInteracao ? "Salvando..." : "Adicionar interação"}
                    </button>
                  </form>
                </div>
              </section>

              <section style={gridDuasColunasStyle}>
                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0 }}>Eventos do Município</h2>

                  <form onSubmit={salvarEvento}>
                    <div style={formGridStyle}>
                      <div>
                        <label style={labelStyle}>Nome do evento *</label>
                        <input
                          value={nomeEvento}
                          onChange={(e) => setNomeEvento(e.target.value)}
                          style={inputStyle}
                          placeholder="Ex: Aniversário da Cidade"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Data</label>
                        <input
                          value={dataEvento}
                          onChange={(e) => setDataEvento(e.target.value)}
                          style={inputStyle}
                          type="date"
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Modelo de contratação</label>
                        <input
                          value={modeloContratacao}
                          onChange={(e) =>
                            setModeloContratacao(e.target.value)
                          }
                          style={inputStyle}
                          placeholder="Ex: Inexigibilidade, edital..."
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Prioridade</label>
                        <input
                          value={prioridadeEvento}
                          onChange={(e) => setPrioridadeEvento(e.target.value)}
                          style={inputStyle}
                          placeholder="Alta, Média ou Baixa"
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Observações</label>
                        <textarea
                          value={observacoesEvento}
                          onChange={(e) =>
                            setObservacoesEvento(e.target.value)
                          }
                          style={{ ...inputStyle, minHeight: "90px" }}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={salvandoEvento}
                      style={{
                        ...botaoPrincipal,
                        marginTop: "16px",
                        opacity: salvandoEvento ? 0.7 : 1,
                      }}
                    >
                      {salvandoEvento ? "Salvando..." : "Adicionar evento"}
                    </button>
                  </form>

                  <div style={listaStyle}>
                    {eventos.length === 0 ? (
                      <p style={{ color: "#b8b8d8" }}>
                        Nenhum evento cadastrado.
                      </p>
                    ) : (
                      eventos.map((evento) => (
                        <div key={evento.id} style={itemListaStyle}>
                          <div>
                            <h3 style={{ margin: 0 }}>{evento.nome_evento}</h3>
                            <p style={{ color: "#b8b8d8", marginBottom: 0 }}>
                              {formatarData(evento.data_evento)} ·{" "}
                              {evento.modelo_contratacao || "Modelo não informado"} ·{" "}
                              {evento.prioridade || "Sem prioridade"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => excluirEvento(evento.id)}
                            style={botaoPequenoVermelho}
                          >
                            Excluir
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div style={cardStyle}>
                  <h2 style={{ marginTop: 0 }}>Histórico de interações</h2>

                  {interacoes.length === 0 ? (
                    <p style={{ color: "#b8b8d8" }}>
                      Nenhuma interação registrada.
                    </p>
                  ) : (
                    <div style={listaStyle}>
                      {interacoes.map((interacao) => (
                        <div key={interacao.id} style={itemListaStyle}>
                          <div>
                            <p style={tagInteracaoStyle}>{interacao.tipo}</p>
                            <p style={textoLongoStyle}>
                              {interacao.descricao}
                            </p>
                            <p style={{ color: "#9fb4d9", margin: 0 }}>
                              {formatarDataHora(interacao.data_interacao)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p style={infoLabelStyle}>{label}</p>
      <p style={infoValueStyle}>
        {value === null || value === undefined || value === "" ? "-" : value}
      </p>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  marginBottom: "28px",
};

const voltarStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "18px",
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: "bold",
};

const tagStyle: React.CSSProperties = {
  margin: 0,
  color: "#38bdf8",
  fontWeight: "bold",
  letterSpacing: "2px",
  fontSize: "14px",
};

const tituloStyle: React.CSSProperties = {
  fontSize: "38px",
  margin: "10px 0",
};

const subtituloStyle: React.CSSProperties = {
  color: "#b8b8d8",
  fontSize: "18px",
  margin: 0,
  maxWidth: "850px",
  lineHeight: 1.5,
};

const resumoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const gridDuasColunasStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "20px",
  marginBottom: "24px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
};

const cardLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#9fb4d9",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontSize: "13px",
};

const cardNumeroStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: "28px",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
};

const infoLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#9fb4d9",
  fontSize: "13px",
  fontWeight: "bold",
};

const infoValueStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#fff",
  wordBreak: "break-word",
};

const textoLongoStyle: React.CSSProperties = {
  color: "#fff",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#dbeafe",
  fontSize: "14px",
  fontWeight: "bold",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.22)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const botaoPrincipal: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
};

const listaStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  marginTop: "18px",
};

const itemListaStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "18px",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
};

const botaoPequenoVermelho: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(239,68,68,0.28)",
  background: "rgba(239,68,68,0.18)",
  color: "#fecaca",
  fontWeight: "bold",
  cursor: "pointer",
};

const tagInteracaoStyle: React.CSSProperties = {
  display: "inline-block",
  margin: "0 0 8px",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "rgba(56,189,248,0.14)",
  color: "#bae6fd",
  fontWeight: "bold",
  fontSize: "12px",
};

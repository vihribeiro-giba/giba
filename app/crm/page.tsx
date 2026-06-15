"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../lib/supabase";

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
  modelo_contratacao: string | null;
  valor_proposto: number | null;
  data_contato: string | null;
  proximo_contato: string | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  municipios?: Municipio | null;
};

type FormMunicipio = {
  nome: string;
  estado: string;
  habitantes: string;
  distancia_bh: string;
  prefeito: string;
  email_prefeito: string;
  secretario_cultura: string;
  email_cultura: string;
  telefone_whatsapp: string;
  observacoes: string;
  status: string;
  modelo_contratacao: string;
  valor_proposto: string;
  data_contato: string;
  proximo_contato: string;
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

const MODELOS_CONTRATACAO = [
  "CIMVALPI",
  "LICITAR",
  "INEXIGIBILIDADE",
];

const formInicial: FormMunicipio = {
  nome: "",
  estado: "MG",
  habitantes: "",
  distancia_bh: "",
  prefeito: "",
  email_prefeito: "",
  secretario_cultura: "",
  email_cultura: "",
  telefone_whatsapp: "",
  observacoes: "",
  status: "novo_lead",
  modelo_contratacao: "CIMVALPI",
  valor_proposto: "",
  data_contato: "",
  proximo_contato: "",
};

export default function CrmPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroModelo, setFiltroModelo] = useState("todos");
  const [form, setForm] = useState<FormMunicipio>(formInicial);

  useEffect(() => {
    carregarDados();
  }, []);

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarDados() {
    setCarregando(true);

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    const { data: municipiosData, error: municipiosError } = await supabase
      .from("municipios")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (municipiosError) {
      console.error("Erro ao carregar municípios:", municipiosError);
      alert("Erro ao carregar municípios.");
      setCarregando(false);
      return;
    }

    const { data: oportunidadesData, error: oportunidadesError } =
      await supabase
        .from("crm_oportunidades")
        .select(
          `
          *,
          municipios (*)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (oportunidadesError) {
      console.error("Erro ao carregar oportunidades:", oportunidadesError);
      alert("Erro ao carregar oportunidades.");
      setCarregando(false);
      return;
    }

    setMunicipios((municipiosData || []) as Municipio[]);
    setOportunidades((oportunidadesData || []) as Oportunidade[]);
    setCarregando(false);
  }

  function atualizarCampo(campo: keyof FormMunicipio, valor: string) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(formInicial);
  }

  async function salvarMunicipioEOportunidade(event: React.FormEvent) {
    event.preventDefault();

    const user = await obterUsuarioLogado();

    if (!user) return;

    if (!form.nome.trim()) {
      alert("Informe o nome do município.");
      return;
    }

    try {
      setSalvando(true);

      const { data: municipioCriado, error: erroMunicipio } = await supabase
        .from("municipios")
        .insert({
          user_id: user.id,
          nome: form.nome.trim(),
          estado: form.estado.trim() || "MG",
          habitantes: form.habitantes ? Number(form.habitantes) : null,
          distancia_bh: form.distancia_bh ? Number(form.distancia_bh) : null,
          prefeito: form.prefeito.trim() || null,
          email_prefeito: form.email_prefeito.trim() || null,
          secretario_cultura: form.secretario_cultura.trim() || null,
          email_cultura: form.email_cultura.trim() || null,
          telefone_whatsapp: form.telefone_whatsapp.trim() || null,
          observacoes: form.observacoes.trim() || null,
        })
        .select("*")
        .single();

      if (erroMunicipio) {
        console.error("Erro ao cadastrar município:", erroMunicipio);
        alert("Erro ao cadastrar município.");
        return;
      }

      const { error: erroOportunidade } = await supabase
        .from("crm_oportunidades")
        .insert({
          user_id: user.id,
          municipio_id: municipioCriado.id,
          status: form.status,
          modelo_contratacao: form.modelo_contratacao,
          valor_proposto: form.valor_proposto
            ? Number(form.valor_proposto.replace(",", "."))
            : null,
          data_contato: form.data_contato || null,
          proximo_contato: form.proximo_contato || null,
          responsavel: null,
          observacoes: form.observacoes.trim() || null,
        });

      if (erroOportunidade) {
        console.error("Erro ao criar oportunidade:", erroOportunidade);
        alert("Município criado, mas houve erro ao criar oportunidade.");
        await carregarDados();
        return;
      }

      limparFormulario();
      setMostrarFormulario(false);
      await carregarDados();
    } catch (error) {
      console.error("Erro inesperado ao salvar CRM:", error);
      alert("Erro inesperado ao salvar cadastro.");
    } finally {
      setSalvando(false);
    }
  }

  async function alterarStatusOportunidade(id: string, status: string) {
    const { error } = await supabase
      .from("crm_oportunidades")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status.");
      return;
    }

    await carregarDados();
  }

  async function alterarModeloContratacao(id: string, modeloContratacao: string) {
    const { error } = await supabase
      .from("crm_oportunidades")
      .update({
        modelo_contratacao: modeloContratacao,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Erro ao alterar modelo de contratação:", error);
      alert("Erro ao alterar modelo de contratação.");
      return;
    }

    await carregarDados();
  }

  async function excluirOportunidade(oportunidade: Oportunidade) {
    const confirmar = window.confirm(
      `Deseja excluir a oportunidade de ${oportunidade.municipios?.nome || "município"}?`
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("crm_oportunidades")
      .delete()
      .eq("id", oportunidade.id);

    if (error) {
      console.error("Erro ao excluir oportunidade:", error);
      alert("Erro ao excluir oportunidade.");
      return;
    }

    await carregarDados();
  }

  const oportunidadesFiltradas = useMemo(() => {
    return oportunidades.filter((item) => {
      const municipio = item.municipios;
      const textoBusca = busca.toLowerCase();

      const combinaBusca =
        !textoBusca ||
        municipio?.nome?.toLowerCase().includes(textoBusca) ||
        municipio?.prefeito?.toLowerCase().includes(textoBusca) ||
        municipio?.secretario_cultura?.toLowerCase().includes(textoBusca) ||
        municipio?.telefone_whatsapp?.toLowerCase().includes(textoBusca);

      const combinaStatus =
        filtroStatus === "todos" || item.status === filtroStatus;

      const combinaModelo =
        filtroModelo === "todos" ||
        item.modelo_contratacao === filtroModelo;

      return combinaBusca && combinaStatus && combinaModelo;
    });
  }, [oportunidades, busca, filtroStatus, filtroModelo]);

  const totalValorNegociacao = oportunidades
    .filter((item) =>
      ["proposta_enviada", "negociacao", "aguardando_retorno"].includes(
        item.status
      )
    )
    .reduce((total, item) => total + Number(item.valor_proposto || 0), 0);

  const totalFechado = oportunidades
    .filter((item) => item.status === "fechado")
    .reduce((total, item) => total + Number(item.valor_proposto || 0), 0);

  const totalCimvalpi = oportunidades.filter(
    (item) => item.modelo_contratacao === "CIMVALPI"
  ).length;

  const totalLicitar = oportunidades.filter(
    (item) => item.modelo_contratacao === "LICITAR"
  ).length;

  const totalInexigibilidade = oportunidades.filter(
    (item) => item.modelo_contratacao === "INEXIGIBILIDADE"
  ).length;

  function labelStatus(status: string) {
    return (
      STATUS_OPTIONS.find((item) => item.value === status)?.label || status
    );
  }

  function formatarMoeda(valor?: number | null) {
    if (!valor) return "R$ 0,00";

    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <div style={headerStyle}>
            <div>
              <p style={tagStyle}>GIBA CRM</p>

              <h1 style={tituloStyle}>CRM de Prefeituras</h1>

              <p style={subtituloStyle}>
                Controle municípios, contatos, propostas, negociações e
                oportunidades comerciais.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarFormulario((atual) => !atual)}
              style={botaoPrincipal}
            >
              {mostrarFormulario ? "Fechar cadastro" : "Novo município"}
            </button>
          </div>

          <section style={resumoGridStyle}>
            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>Prefeituras</p>
              <h2 style={cardNumeroStyle}>{municipios.length}</h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>Oportunidades</p>
              <h2 style={cardNumeroStyle}>{oportunidades.length}</h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>Em negociação</p>
              <h2 style={cardNumeroStyle}>
                {formatarMoeda(totalValorNegociacao)}
              </h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>Fechado</p>
              <h2 style={cardNumeroStyle}>{formatarMoeda(totalFechado)}</h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>CIMVALPI</p>
              <h2 style={cardNumeroStyle}>{totalCimvalpi}</h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>LICITAR</p>
              <h2 style={cardNumeroStyle}>{totalLicitar}</h2>
            </div>

            <div style={cardResumoStyle}>
              <p style={cardLabelStyle}>INEXIGIBILIDADE</p>
              <h2 style={cardNumeroStyle}>{totalInexigibilidade}</h2>
            </div>
          </section>

          {mostrarFormulario && (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Cadastrar município</h2>

              <form onSubmit={salvarMunicipioEOportunidade}>
                <div style={formGridStyle}>
                  <div>
                    <label style={labelStyle}>Município *</label>
                    <input
                      value={form.nome}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: Rio Casca"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Estado</label>
                    <input
                      value={form.estado}
                      onChange={(e) =>
                        atualizarCampo("estado", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="MG"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Habitantes</label>
                    <input
                      value={form.habitantes}
                      onChange={(e) =>
                        atualizarCampo("habitantes", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Distância BH</label>
                    <input
                      value={form.distancia_bh}
                      onChange={(e) =>
                        atualizarCampo("distancia_bh", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="120"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Prefeito</label>
                    <input
                      value={form.prefeito}
                      onChange={(e) =>
                        atualizarCampo("prefeito", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>E-mail Prefeito</label>
                    <input
                      value={form.email_prefeito}
                      onChange={(e) =>
                        atualizarCampo("email_prefeito", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Secretário de Cultura</label>
                    <input
                      value={form.secretario_cultura}
                      onChange={(e) =>
                        atualizarCampo("secretario_cultura", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>E-mail Cultura</label>
                    <input
                      value={form.email_cultura}
                      onChange={(e) =>
                        atualizarCampo("email_cultura", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Telefone/WhatsApp</label>
                    <input
                      value={form.telefone_whatsapp}
                      onChange={(e) =>
                        atualizarCampo("telefone_whatsapp", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="(31) 99999-9999"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        atualizarCampo("status", e.target.value)
                      }
                      style={inputStyle}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Modelo de Contratação</label>
                    <select
                      value={form.modelo_contratacao}
                      onChange={(e) =>
                        atualizarCampo("modelo_contratacao", e.target.value)
                      }
                      style={inputStyle}
                    >
                      {MODELOS_CONTRATACAO.map((modelo) => (
                        <option key={modelo} value={modelo}>
                          {modelo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>Valor proposto</label>
                    <input
                      value={form.valor_proposto}
                      onChange={(e) =>
                        atualizarCampo("valor_proposto", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="15000"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Data de contato</label>
                    <input
                      value={form.data_contato}
                      onChange={(e) =>
                        atualizarCampo("data_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Próximo contato</label>
                    <input
                      value={form.proximo_contato}
                      onChange={(e) =>
                        atualizarCampo("proximo_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Observações</label>
                    <textarea
                      value={form.observacoes}
                      onChange={(e) =>
                        atualizarCampo("observacoes", e.target.value)
                      }
                      style={{ ...inputStyle, minHeight: "100px" }}
                      placeholder="Histórico, detalhes do contato, prioridades..."
                    />
                  </div>
                </div>

                <div style={formActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarFormulario(false);
                    }}
                    style={botaoSecundario}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={salvando}
                    style={{
                      ...botaoPrincipal,
                      opacity: salvando ? 0.7 : 1,
                    }}
                  >
                    {salvando ? "Salvando..." : "Salvar no CRM"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section style={cardStyle}>
            <div style={filtrosStyle}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label style={labelStyle}>Buscar</label>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={inputStyle}
                  placeholder="Município, prefeito, secretário ou telefone"
                />
              </div>

              <div style={{ minWidth: "220px" }}>
                <label style={labelStyle}>Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  style={inputStyle}
                >
                  <option value="todos">Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ minWidth: "220px" }}>
                <label style={labelStyle}>Modelo de Contratação</label>
                <select
                  value={filtroModelo}
                  onChange={(e) => setFiltroModelo(e.target.value)}
                  style={inputStyle}
                >
                  <option value="todos">Todos</option>
                  {MODELOS_CONTRATACAO.map((modelo) => (
                    <option key={modelo} value={modelo}>
                      {modelo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {carregando ? (
              <p style={{ color: "#b8b8d8" }}>Carregando CRM...</p>
            ) : oportunidadesFiltradas.length === 0 ? (
              <div style={emptyStyle}>
                <h3>Nenhuma oportunidade encontrada</h3>
                <p style={{ color: "#b8b8d8" }}>
                  Cadastre sua primeira prefeitura para iniciar o controle
                  comercial.
                </p>
              </div>
            ) : (
              <div style={listaStyle}>
                {oportunidadesFiltradas.map((oportunidade) => {
                  const municipio = oportunidade.municipios;

                  return (
                    <div key={oportunidade.id} style={oportunidadeCardStyle}>
                      <div style={cardTopoStyle}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: "22px" }}>
                            {municipio?.nome || "Município não informado"}
                            {municipio?.estado ? ` / ${municipio.estado}` : ""}
                          </h3>

                          <p style={{ color: "#b8b8d8", marginBottom: 0 }}>
                            Prefeito: {municipio?.prefeito || "-"} · Cultura:{" "}
                            {municipio?.secretario_cultura || "-"}
                          </p>
                        </div>

                        <div style={cardSelectsStyle}>
                          <select
                            value={oportunidade.status}
                            onChange={(e) =>
                              alterarStatusOportunidade(
                                oportunidade.id,
                                e.target.value
                              )
                            }
                            style={selectStatusStyle}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={oportunidade.modelo_contratacao || "CIMVALPI"}
                            onChange={(e) =>
                              alterarModeloContratacao(
                                oportunidade.id,
                                e.target.value
                              )
                            }
                            style={selectStatusStyle}
                          >
                            {MODELOS_CONTRATACAO.map((modelo) => (
                              <option key={modelo} value={modelo}>
                                {modelo}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={infoGridStyle}>
                        <div>
                          <p style={infoLabelStyle}>WhatsApp</p>
                          <p style={infoValueStyle}>
                            {municipio?.telefone_whatsapp || "-"}
                          </p>
                        </div>

                        <div>
                          <p style={infoLabelStyle}>E-mail Cultura</p>
                          <p style={infoValueStyle}>
                            {municipio?.email_cultura || "-"}
                          </p>
                        </div>

                        <div>
                          <p style={infoLabelStyle}>Modelo</p>
                          <p style={infoValueStyle}>
                            {oportunidade.modelo_contratacao || "-"}
                          </p>
                        </div>

                        <div>
                          <p style={infoLabelStyle}>Valor proposto</p>
                          <p style={infoValueStyle}>
                            {formatarMoeda(oportunidade.valor_proposto)}
                          </p>
                        </div>

                        <div>
                          <p style={infoLabelStyle}>Próximo contato</p>
                          <p style={infoValueStyle}>
                            {formatarData(oportunidade.proximo_contato)}
                          </p>
                        </div>
                      </div>

                      <div style={acoesCardStyle}>
                        <Link
                          href={`/crm/${municipio?.id}`}
                          style={botaoPequeno}
                        >
                          Ver detalhes
                        </Link>

                        <button
                          type="button"
                          onClick={() => excluirOportunidade(oportunidade)}
                          style={botaoPequenoVermelho}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  flexWrap: "wrap",
  marginBottom: "28px",
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
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const cardResumoStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "22px",
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
  fontSize: "30px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
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

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "20px",
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

const botaoSecundario: React.CSSProperties = {
  ...botaoPrincipal,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const filtrosStyle: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  alignItems: "flex-end",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const emptyStyle: React.CSSProperties = {
  padding: "28px",
  textAlign: "center",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.18)",
};

const listaStyle: React.CSSProperties = {
  display: "grid",
  gap: "16px",
};

const oportunidadeCardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "22px",
  padding: "20px",
};

const cardTopoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "flex-start",
};

const cardSelectsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const selectStatusStyle: React.CSSProperties = {
  ...inputStyle,
  width: "220px",
  background: "rgba(56,189,248,0.14)",
};

const infoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px",
  marginTop: "18px",
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

const acoesCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
  marginTop: "18px",
};

const botaoPequeno: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
};

const botaoPequenoVermelho: React.CSSProperties = {
  ...botaoPequeno,
  background: "rgba(239,68,68,0.18)",
  color: "#fecaca",
};

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  Eye,
  Filter,
  Landmark,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
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
  updated_at?: string | null;
  municipios?: Municipio | null;
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
  updated_at?: string | null;
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
  nome_evento: string;
  data_evento: string;
  prioridade: string;
};

const STATUS_OPTIONS = [
  { value: "novo_lead", label: "Novo Lead" },
  { value: "contato_realizado", label: "Contato Realizado" },
  { value: "email_enviado", label: "E-mail Enviado" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "negociacao", label: "Negociacao" },
  { value: "aguardando_retorno", label: "Aguardando Retorno" },
  { value: "fechado", label: "Fechado" },
  { value: "perdido", label: "Perdido" },
];

const MODELOS_CONTRATACAO = ["CIMVALPI", "LICITAR", "INEXIGIBILIDADE"];

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
  nome_evento: "",
  data_evento: "",
  prioridade: "",
};

export default function CrmPage() {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [eventos, setEventos] = useState<EventoMunicipal[]>([]);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("todos");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todos");
  const [form, setForm] = useState<FormMunicipio>(formInicial);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [mostrarNotificacoes, setMostrarNotificacoes] = useState(false);

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

    const [municipiosRes, oportunidadesRes, eventosRes, interacoesRes] =
      await Promise.all([
        supabase
          .from("municipios")
          .select("*")
          .eq("user_id", user.id)
          .order("nome", { ascending: true }),
        supabase
          .from("crm_oportunidades")
          .select("*, municipios (*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("municipio_eventos")
          .select("*")
          .eq("user_id", user.id)
          .order("data_evento", { ascending: true }),
        supabase
          .from("crm_interacoes")
          .select("*")
          .eq("user_id", user.id)
          .order("data_interacao", { ascending: false }),
      ]);

    if (municipiosRes.error) {
      console.error("Erro ao carregar municipios:", municipiosRes.error);
      alert("Erro ao carregar municipios.");
    }

    if (oportunidadesRes.error) {
      console.error("Erro ao carregar oportunidades:", oportunidadesRes.error);
      alert("Erro ao carregar oportunidades.");
    }

    if (eventosRes.error) {
      console.error("Erro ao carregar eventos municipais:", eventosRes.error);
    }

    if (interacoesRes.error) {
      console.error("Erro ao carregar interacoes:", interacoesRes.error);
    }

    setMunicipios((municipiosRes.data || []) as Municipio[]);
    setOportunidades((oportunidadesRes.data || []) as Oportunidade[]);
    setEventos((eventosRes.data || []) as EventoMunicipal[]);
    setInteracoes((interacoesRes.data || []) as Interacao[]);
    setCarregando(false);
  }

  function atualizarCampo(campo: keyof FormMunicipio, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFormulario() {
    setForm(formInicial);
  }

  async function salvarMunicipioEOportunidade(event: React.FormEvent) {
    event.preventDefault();
    const user = await obterUsuarioLogado();

    if (!user) return;

    if (!form.nome.trim()) {
      alert("Informe o nome do municipio.");
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
        console.error("Erro ao cadastrar municipio:", erroMunicipio);
        alert("Erro ao cadastrar municipio.");
        return;
      }

      const { data: oportunidadeCriada, error: erroOportunidade } =
        await supabase
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
          })
          .select("*")
          .single();

      if (erroOportunidade) {
        console.error("Erro ao criar oportunidade:", erroOportunidade);
        alert("Municipio criado, mas houve erro ao criar oportunidade.");
        await carregarDados();
        return;
      }

      if (form.nome_evento.trim() || form.prioridade.trim()) {
        const { error: erroEvento } = await supabase
          .from("municipio_eventos")
          .insert({
            user_id: user.id,
            municipio_id: municipioCriado.id,
            nome_evento: form.nome_evento.trim() || "Evento municipal",
            data_evento: form.data_evento || null,
            modelo_contratacao: form.modelo_contratacao,
            prioridade: form.prioridade.trim() || null,
            observacoes: form.observacoes.trim() || null,
          });

        if (erroEvento) {
          console.error("Erro ao criar evento municipal:", erroEvento);
        }
      }

      if (form.observacoes.trim() && oportunidadeCriada?.id) {
        await supabase.from("crm_interacoes").insert({
          user_id: user.id,
          oportunidade_id: oportunidadeCriada.id,
          tipo: "Observacao",
          descricao: form.observacoes.trim(),
          data_interacao: new Date().toISOString(),
        });
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
      .update({ status, updated_at: new Date().toISOString() })
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
      console.error("Erro ao alterar modelo de contratacao:", error);
      alert("Erro ao alterar modelo de contratacao.");
      return;
    }

    await carregarDados();
  }

  async function excluirOportunidade(oportunidade: Oportunidade) {
    const confirmar = window.confirm(
      `Deseja excluir a oportunidade de ${
        oportunidade.municipios?.nome || "municipio"
      }?`,
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

    if (selecionadaId === oportunidade.id) setSelecionadaId(null);
    await carregarDados();
  }

  const linhasCrm = useMemo(() => {
    return oportunidades.map((oportunidade) => {
      const municipio = oportunidade.municipios || null;
      const eventosMunicipio = eventos.filter(
        (evento) => evento.municipio_id === oportunidade.municipio_id,
      );
      const interacoesOportunidade = interacoes.filter(
        (interacao) => interacao.oportunidade_id === oportunidade.id,
      );
      const eventoPrincipal = escolherEventoPrincipal(eventosMunicipio);

      return {
        oportunidade,
        municipio,
        eventos: eventosMunicipio,
        interacoes: interacoesOportunidade,
        eventoPrincipal,
        prioridade: eventoPrincipal?.prioridade || "",
        ultimaAtualizacao: calcularUltimaAtualizacao(
          municipio,
          oportunidade,
          eventosMunicipio,
          interacoesOportunidade,
        ),
      };
    });
  }, [oportunidades, eventos, interacoes]);

  const prioridadesDisponiveis = useMemo(() => {
    const valores = new Set<string>();
    linhasCrm.forEach((linha) => {
      if (linha.prioridade) valores.add(linha.prioridade);
    });
    return Array.from(valores).sort((a, b) => a.localeCompare(b));
  }, [linhasCrm]);

  const linhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return linhasCrm.filter((linha) => {
      const municipio = linha.municipio;
      const oportunidade = linha.oportunidade;
      const evento = linha.eventoPrincipal;

      const combinaBusca =
        !termo ||
        municipio?.nome?.toLowerCase().includes(termo) ||
        municipio?.prefeito?.toLowerCase().includes(termo) ||
        municipio?.secretario_cultura?.toLowerCase().includes(termo) ||
        municipio?.telefone_whatsapp?.toLowerCase().includes(termo) ||
        oportunidade.modelo_contratacao?.toLowerCase().includes(termo) ||
        evento?.prioridade?.toLowerCase().includes(termo);

      const combinaModelo =
        filtroModelo === "todos" ||
        oportunidade.modelo_contratacao === filtroModelo;

      const combinaPrioridade =
        filtroPrioridade === "todos" || linha.prioridade === filtroPrioridade;

      return combinaBusca && combinaModelo && combinaPrioridade;
    });
  }, [linhasCrm, busca, filtroModelo, filtroPrioridade]);

  const notificacoesCrm = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);

    return linhasCrm
      .filter((linha) => linha.oportunidade.proximo_contato)
      .map((linha) => {
        const data = new Date(`${linha.oportunidade.proximo_contato}T00:00:00`);
        const dias = Math.ceil(
          (data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          linha,
          data,
          dias,
          status:
            dias < 0 ? "vencido" : dias === 0 ? "hoje" : "proximo",
        };
      })
      .filter((item) => item.data <= limite)
      .sort((a, b) => a.data.getTime() - b.data.getTime());
  }, [linhasCrm]);

  const linhaSelecionada =
    linhasCrm.find((linha) => linha.oportunidade.id === selecionadaId) || null;

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={pageStyle}>
          <header style={headerStyle}>
            <div style={headerIdentityStyle}>
              <div style={headerIconStyle}>
                <Landmark size={34} />
              </div>
              <div>
                <h1 style={tituloStyle}>CRM de Prefeituras</h1>
                <p style={subtituloStyle}>
                  Controle municipios, contatos, prioridades e oportunidades no
                  padrao GIBA V2.
                </p>
              </div>
            </div>

            <div style={headerActionsStyle}>
              <button
                type="button"
                onClick={() => setMostrarNotificacoes(true)}
                style={notificationButtonStyle}
                aria-label="Notificacoes CRM"
              >
                <Bell size={20} />
                {notificacoesCrm.length > 0 && (
                  <span style={notificationBadgeStyle}>
                    {notificacoesCrm.length}
                  </span>
                )}
              </button>
              <Link href="/crm/importar" style={botaoSecundario}>
                <Upload size={18} />
                Importar planilha
              </Link>
              <button
                type="button"
                onClick={() => setMostrarFormulario(true)}
                style={botaoPrincipal}
              >
                <Plus size={18} />
                Nova prefeitura
              </button>
            </div>
          </header>

          {mostrarNotificacoes && (
            <NotificacoesModal
              notificacoes={notificacoesCrm}
              onClose={() => setMostrarNotificacoes(false)}
              onOpen={(id) => {
                setMostrarNotificacoes(false);
                setSelecionadaId(id);
              }}
            />
          )}

          {mostrarFormulario && (
            <div
              style={modalOverlayStyle}
              onMouseDown={() => setMostrarFormulario(false)}
            >
              <form
                onSubmit={salvarMunicipioEOportunidade}
                style={modalCardStyle}
                onMouseDown={(event) => event.stopPropagation()}
              >
                <div style={modalHeaderStyle}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={modalIconStyle}>
                      <Plus size={24} />
                    </div>
                    <div>
                      <h2 style={modalTitleStyle}>Cadastrar prefeitura</h2>
                      <p style={sectionSubtitleStyle}>
                        Crie o registro principal e, se desejar, ja informe
                        evento e prioridade.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarFormulario(false)}
                    style={iconButtonStyle}
                  >
                    <X size={22} />
                  </button>
                </div>

                <div style={{ ...formGridStyle, marginTop: 12 }}>
                  <Campo label="Municipio *">
                    <input
                      value={form.nome}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: Rio Casca"
                    />
                  </Campo>
                  <Campo label="Estado">
                    <input
                      value={form.estado}
                      onChange={(e) => atualizarCampo("estado", e.target.value)}
                      style={inputStyle}
                      placeholder="MG"
                    />
                  </Campo>
                  <Campo label="Distancia da capital">
                    <input
                      value={form.distancia_bh}
                      onChange={(e) =>
                        atualizarCampo("distancia_bh", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="187"
                    />
                  </Campo>
                  <Campo label="Habitantes">
                    <input
                      value={form.habitantes}
                      onChange={(e) =>
                        atualizarCampo("habitantes", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="12851"
                    />
                  </Campo>
                  <Campo label="Modelo de contratacao">
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
                  </Campo>
                  <Campo label="Prioridade">
                    <input
                      value={form.prioridade}
                      onChange={(e) =>
                        atualizarCampo("prioridade", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Urgencia total, maxima..."
                    />
                  </Campo>
                  <Campo label="Evento">
                    <input
                      value={form.nome_evento}
                      onChange={(e) =>
                        atualizarCampo("nome_evento", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Aniversario, festa da cidade..."
                    />
                  </Campo>
                  <Campo label="Data do evento">
                    <input
                      value={form.data_evento}
                      onChange={(e) =>
                        atualizarCampo("data_evento", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Prefeito">
                    <input
                      value={form.prefeito}
                      onChange={(e) =>
                        atualizarCampo("prefeito", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail prefeito">
                    <input
                      value={form.email_prefeito}
                      onChange={(e) =>
                        atualizarCampo("email_prefeito", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Secretario de cultura">
                    <input
                      value={form.secretario_cultura}
                      onChange={(e) =>
                        atualizarCampo("secretario_cultura", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail cultura">
                    <input
                      value={form.email_cultura}
                      onChange={(e) =>
                        atualizarCampo("email_cultura", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Telefone/WhatsApp">
                    <input
                      value={form.telefone_whatsapp}
                      onChange={(e) =>
                        atualizarCampo("telefone_whatsapp", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="(31) 99999-9999"
                    />
                  </Campo>
                  <Campo label="Valor proposto">
                    <input
                      value={form.valor_proposto}
                      onChange={(e) =>
                        atualizarCampo("valor_proposto", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="15000"
                    />
                  </Campo>
                  <Campo label="Data de contato">
                    <input
                      value={form.data_contato}
                      onChange={(e) =>
                        atualizarCampo("data_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Proximo contato">
                    <input
                      value={form.proximo_contato}
                      onChange={(e) =>
                        atualizarCampo("proximo_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Campo label="Observacoes">
                      <textarea
                        value={form.observacoes}
                        onChange={(e) =>
                          atualizarCampo("observacoes", e.target.value)
                        }
                        style={{ ...inputStyle, minHeight: 104, paddingTop: 14 }}
                        placeholder="Historico, detalhes de contato, pendencias..."
                      />
                    </Campo>
                  </div>
                </div>

                <div style={formActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarFormulario(false);
                    }}
                    style={botaoNeutro}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    style={{ ...botaoPrincipal, opacity: salvando ? 0.7 : 1 }}
                  >
                    {salvando ? "Salvando..." : "Salvar no CRM"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {false && mostrarFormulario && (
            <section style={cardStyle}>
              <div style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Cadastrar prefeitura</h2>
                  <p style={sectionSubtitleStyle}>
                    Crie o registro principal e, se desejar, ja informe evento e
                    prioridade.
                  </p>
                </div>
              </div>

              <form onSubmit={salvarMunicipioEOportunidade}>
                <div style={formGridStyle}>
                  <Campo label="Municipio *">
                    <input
                      value={form.nome}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      style={inputStyle}
                      placeholder="Ex: Rio Casca"
                    />
                  </Campo>
                  <Campo label="Estado">
                    <input
                      value={form.estado}
                      onChange={(e) => atualizarCampo("estado", e.target.value)}
                      style={inputStyle}
                      placeholder="MG"
                    />
                  </Campo>
                  <Campo label="Distancia da capital">
                    <input
                      value={form.distancia_bh}
                      onChange={(e) =>
                        atualizarCampo("distancia_bh", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="187"
                    />
                  </Campo>
                  <Campo label="Habitantes">
                    <input
                      value={form.habitantes}
                      onChange={(e) =>
                        atualizarCampo("habitantes", e.target.value)
                      }
                      style={inputStyle}
                      type="number"
                      placeholder="12851"
                    />
                  </Campo>
                  <Campo label="Modelo de contratacao">
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
                  </Campo>
                  <Campo label="Prioridade">
                    <input
                      value={form.prioridade}
                      onChange={(e) =>
                        atualizarCampo("prioridade", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Urgencia total, maxima..."
                    />
                  </Campo>
                  <Campo label="Evento">
                    <input
                      value={form.nome_evento}
                      onChange={(e) =>
                        atualizarCampo("nome_evento", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Aniversario, festa da cidade..."
                    />
                  </Campo>
                  <Campo label="Data do evento">
                    <input
                      value={form.data_evento}
                      onChange={(e) =>
                        atualizarCampo("data_evento", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Prefeito">
                    <input
                      value={form.prefeito}
                      onChange={(e) =>
                        atualizarCampo("prefeito", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail prefeito">
                    <input
                      value={form.email_prefeito}
                      onChange={(e) =>
                        atualizarCampo("email_prefeito", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Secretario de cultura">
                    <input
                      value={form.secretario_cultura}
                      onChange={(e) =>
                        atualizarCampo("secretario_cultura", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail cultura">
                    <input
                      value={form.email_cultura}
                      onChange={(e) =>
                        atualizarCampo("email_cultura", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Telefone/WhatsApp">
                    <input
                      value={form.telefone_whatsapp}
                      onChange={(e) =>
                        atualizarCampo("telefone_whatsapp", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="(31) 99999-9999"
                    />
                  </Campo>
                  <Campo label="Valor proposto">
                    <input
                      value={form.valor_proposto}
                      onChange={(e) =>
                        atualizarCampo("valor_proposto", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="15000"
                    />
                  </Campo>
                  <Campo label="Data de contato">
                    <input
                      value={form.data_contato}
                      onChange={(e) =>
                        atualizarCampo("data_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Proximo contato">
                    <input
                      value={form.proximo_contato}
                      onChange={(e) =>
                        atualizarCampo("proximo_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Campo label="Observacoes">
                      <textarea
                        value={form.observacoes}
                        onChange={(e) =>
                          atualizarCampo("observacoes", e.target.value)
                        }
                        style={{ ...inputStyle, minHeight: 104 }}
                        placeholder="Historico, detalhes de contato, pendencias..."
                      />
                    </Campo>
                  </div>
                </div>

                <div style={formActionsStyle}>
                  <button
                    type="button"
                    onClick={() => {
                      limparFormulario();
                      setMostrarFormulario(false);
                    }}
                    style={botaoNeutro}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    style={{ ...botaoPrincipal, opacity: salvando ? 0.7 : 1 }}
                  >
                    {salvando ? "Salvando..." : "Salvar no CRM"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section style={cardStyle}>
            <div style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Lista de prefeituras</h2>
                <p style={sectionSubtitleStyle}>
                  Visao principal: municipio, distancia, contratacao,
                  prioridade, habitantes e ultima atualizacao.
                </p>
              </div>
              <span style={countBadgeStyle}>{linhasFiltradas.length}</span>
            </div>

            <div style={filtersStyle}>
              <div style={searchWrapStyle}>
                <Search size={18} color="#94A3B8" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={searchInputStyle}
                  placeholder="Buscar municipio, contato, modelo ou prioridade..."
                />
              </div>
              <SelectFilter
                icon={<Filter size={16} />}
                value={filtroModelo}
                onChange={setFiltroModelo}
                options={[
                  { value: "todos", label: "Todos os modelos" },
                  ...MODELOS_CONTRATACAO.map((modelo) => ({
                    value: modelo,
                    label: modelo,
                  })),
                ]}
              />
              <SelectFilter
                icon={<CalendarClock size={16} />}
                value={filtroPrioridade}
                onChange={setFiltroPrioridade}
                options={[
                  { value: "todos", label: "Todas prioridades" },
                  ...prioridadesDisponiveis.map((prioridade) => ({
                    value: prioridade,
                    label: prioridade,
                  })),
                ]}
              />
            </div>

            {carregando ? (
              <p style={mutedTextStyle}>Carregando CRM...</p>
            ) : linhasFiltradas.length === 0 ? (
              <div style={emptyStyle}>
                <Landmark size={34} />
                <h3 style={{ margin: "12px 0 6px" }}>
                  Nenhuma prefeitura encontrada
                </h3>
                <p style={mutedTextStyle}>
                  Cadastre ou importe sua planilha para iniciar o controle.
                </p>
              </div>
            ) : (
              <div style={tableWrapStyle}>
                <div style={tableHeaderStyle}>
                  <span>Municipio</span>
                  <span>Distancia da Capital</span>
                  <span>Modelo de contratacao</span>
                  <span>Prioridade</span>
                  <span>Habitantes</span>
                  <span>Ultima atualizacao</span>
                  <span />
                </div>

                <div style={tableBodyStyle}>
                  {linhasFiltradas.map((linha) => {
                    const municipio = linha.municipio;
                    const oportunidade = linha.oportunidade;

                    return (
                      <button
                        key={oportunidade.id}
                        type="button"
                        onClick={() => setSelecionadaId(oportunidade.id)}
                        style={tableRowStyle}
                      >
                        <span style={municipioCellStyle}>
                          <strong>
                            {municipio?.nome || "Municipio nao informado"}
                          </strong>
                          <small>{municipio?.estado || "MG"}</small>
                        </span>
                        <span>{formatarDistancia(municipio?.distancia_bh)}</span>
                        <span>
                          <Badge value={oportunidade.modelo_contratacao || "-"} />
                        </span>
                        <span>
                          <PrioridadeBadge value={linha.prioridade || "-"} />
                        </span>
                        <span>{formatarNumero(municipio?.habitantes)}</span>
                        <span>{formatarDataHoraCurta(linha.ultimaAtualizacao)}</span>
                        <span style={rowActionCellStyle}>
                          <Eye size={18} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {linhaSelecionada && (
            <CrmModal
              linha={linhaSelecionada}
              onClose={() => setSelecionadaId(null)}
              onStatusChange={alterarStatusOportunidade}
              onModeloChange={alterarModeloContratacao}
              onDelete={excluirOportunidade}
              onSaved={carregarDados}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CrmModal({
  linha,
  onClose,
  onStatusChange,
  onModeloChange,
  onDelete,
  onSaved,
}: {
  linha: {
    oportunidade: Oportunidade;
    municipio: Municipio | null;
    eventos: EventoMunicipal[];
    interacoes: Interacao[];
    eventoPrincipal: EventoMunicipal | null;
    prioridade: string;
    ultimaAtualizacao: string | null;
  };
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onModeloChange: (id: string, modelo: string) => void;
  onDelete: (oportunidade: Oportunidade) => void;
  onSaved: () => Promise<void>;
}) {
  const { oportunidade, municipio, eventos, interacoes, eventoPrincipal } =
    linha;
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [eventosModal, setEventosModal] = useState(eventos);
  const [novoEvento, setNovoEvento] = useState({
    nome: "",
    data: "",
    modelo: oportunidade.modelo_contratacao || "CIMVALPI",
    mesesAntes: "3",
    observacoes: "",
  });
  const [edit, setEdit] = useState({
    municipio: municipio?.nome || "",
    estado: municipio?.estado || "MG",
    distancia_bh: municipio?.distancia_bh?.toString() || "",
    habitantes: municipio?.habitantes?.toString() || "",
    prefeito: municipio?.prefeito || "",
    email_prefeito: municipio?.email_prefeito || "",
    secretario_cultura: municipio?.secretario_cultura || "",
    email_cultura: municipio?.email_cultura || "",
    telefone_whatsapp: municipio?.telefone_whatsapp || "",
    observacoes: municipio?.observacoes || oportunidade.observacoes || "",
    status: oportunidade.status || "novo_lead",
    modelo_contratacao: oportunidade.modelo_contratacao || "CIMVALPI",
    valor_proposto: oportunidade.valor_proposto?.toString() || "",
    data_contato: oportunidade.data_contato || "",
    proximo_contato: oportunidade.proximo_contato || "",
    nome_evento: eventoPrincipal?.nome_evento || "",
    data_evento: eventoPrincipal?.data_evento || "",
    prioridade: eventoPrincipal?.prioridade || "",
    observacoes_evento: eventoPrincipal?.observacoes || "",
  });

  function atualizarEdit(campo: keyof typeof edit, valor: string) {
    setEdit((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarNovoEvento(campo: keyof typeof novoEvento, valor: string) {
    setNovoEvento((atual) => ({ ...atual, [campo]: valor }));
  }

  async function cadastrarEventoMapeado(event: React.FormEvent) {
    event.preventDefault();
    if (!municipio?.id) return;

      if (!novoEvento.nome.trim()) {
        alert("Informe o nome do evento.");
        return;
      }

    try {
      setSalvandoEvento(true);

      const proximoContato = calcularDataContatoEvento(
        novoEvento.data,
        Number(novoEvento.mesesAntes || 0),
      );
      const prioridadeAutomatica = calcularPrioridadeEvento(novoEvento.data);

      const { data: eventoCriado, error: eventoError } = await supabase
        .from("municipio_eventos")
        .insert({
          user_id: oportunidade.user_id,
          municipio_id: municipio.id,
          nome_evento: novoEvento.nome.trim(),
          data_evento: novoEvento.data || null,
          modelo_contratacao: novoEvento.modelo || null,
          prioridade: prioridadeAutomatica,
          observacoes: novoEvento.observacoes.trim() || null,
        })
        .select("*")
        .single();

      if (eventoError) {
        console.error("Erro ao cadastrar evento mapeado:", eventoError);
        alert("Erro ao cadastrar evento.");
        return;
      }

      if (proximoContato) {
        const { error: oportunidadeError } = await supabase
          .from("crm_oportunidades")
          .update({
            proximo_contato: proximoContato,
            updated_at: new Date().toISOString(),
          })
          .eq("id", oportunidade.id);

        if (oportunidadeError) {
          console.error("Erro ao atualizar lembrete:", oportunidadeError);
          alert("Evento salvo, mas houve erro ao atualizar o lembrete.");
        } else {
          setEdit((atual) => ({ ...atual, proximo_contato: proximoContato }));
        }
      }

      setEventosModal((atual) => [...atual, eventoCriado as EventoMunicipal]);
      setNovoEvento({
        nome: "",
        data: "",
        modelo: edit.modelo_contratacao,
        mesesAntes: "3",
        observacoes: "",
      });
      await onSaved();
    } finally {
      setSalvandoEvento(false);
    }
  }

  async function salvarAlteracoes() {
    if (!municipio?.id) return;

    try {
      setSalvandoAlteracoes(true);

      const { error: municipioError } = await supabase
        .from("municipios")
        .update({
          nome: edit.municipio.trim(),
          estado: edit.estado.trim() || "MG",
          distancia_bh: edit.distancia_bh ? Number(edit.distancia_bh) : null,
          habitantes: edit.habitantes ? Number(edit.habitantes) : null,
          prefeito: edit.prefeito.trim() || null,
          email_prefeito: edit.email_prefeito.trim() || null,
          secretario_cultura: edit.secretario_cultura.trim() || null,
          email_cultura: edit.email_cultura.trim() || null,
          telefone_whatsapp: edit.telefone_whatsapp.trim() || null,
          observacoes: edit.observacoes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", municipio.id);

      if (municipioError) {
        console.error("Erro ao atualizar municipio:", municipioError);
        alert("Erro ao salvar dados da prefeitura.");
        return;
      }

      const { error: oportunidadeError } = await supabase
        .from("crm_oportunidades")
        .update({
          status: edit.status,
          modelo_contratacao: edit.modelo_contratacao,
          valor_proposto: edit.valor_proposto
            ? Number(edit.valor_proposto.replace(",", "."))
            : null,
          data_contato: edit.data_contato || null,
          proximo_contato: edit.proximo_contato || null,
          observacoes: edit.observacoes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", oportunidade.id);

      if (oportunidadeError) {
        console.error("Erro ao atualizar oportunidade:", oportunidadeError);
        alert("Erro ao salvar oportunidade.");
        return;
      }

      if (eventoPrincipal?.id) {
        const { error: eventoError } = await supabase
          .from("municipio_eventos")
          .update({
            nome_evento: edit.nome_evento.trim() || "Evento municipal",
            data_evento: edit.data_evento || null,
            modelo_contratacao: edit.modelo_contratacao,
            prioridade: edit.prioridade.trim() || null,
            observacoes: edit.observacoes_evento.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", eventoPrincipal.id);

        if (eventoError) {
          console.error("Erro ao atualizar evento municipal:", eventoError);
          alert("Erro ao salvar evento municipal.");
          return;
        }
      } else if (edit.nome_evento.trim() || edit.prioridade.trim()) {
        const { error: eventoError } = await supabase
          .from("municipio_eventos")
          .insert({
            user_id: oportunidade.user_id,
            municipio_id: municipio.id,
            nome_evento: edit.nome_evento.trim() || "Evento municipal",
            data_evento: edit.data_evento || null,
            modelo_contratacao: edit.modelo_contratacao,
            prioridade: edit.prioridade.trim() || null,
            observacoes: edit.observacoes_evento.trim() || null,
          });

        if (eventoError) {
          console.error("Erro ao criar evento municipal:", eventoError);
          alert("Erro ao salvar evento municipal.");
          return;
        }
      }

      await onSaved();
      onClose();
    } finally {
      setSalvandoAlteracoes(false);
    }
  }

  return (
    <div style={modalOverlayStyle} onMouseDown={onClose}>
      <div style={modalCardStyle} onMouseDown={(event) => event.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={modalIconStyle}>
              <Landmark size={24} />
            </div>
            <div>
              <h2 style={modalTitleStyle}>
                {municipio?.nome || "Municipio nao informado"}
                {municipio?.estado ? ` / ${municipio.estado}` : ""}
              </h2>
              <p style={sectionSubtitleStyle}>
                Dossie completo da prefeitura e oportunidade comercial.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={iconButtonStyle}>
            <X size={22} />
          </button>
        </div>

        <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Dados da prefeitura</h3>
            <div style={formGridStyle}>
              <Campo label="Municipio">
                <input
                  value={edit.municipio}
                  onChange={(event) => atualizarEdit("municipio", event.target.value)}
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Estado">
                <input
                  value={edit.estado}
                  onChange={(event) => atualizarEdit("estado", event.target.value)}
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Distancia da capital">
                <input
                  value={edit.distancia_bh}
                  onChange={(event) =>
                    atualizarEdit("distancia_bh", event.target.value)
                  }
                  style={inputStyle}
                  type="number"
                />
              </Campo>
              <Campo label="Habitantes">
                <input
                  value={edit.habitantes}
                  onChange={(event) => atualizarEdit("habitantes", event.target.value)}
                  style={inputStyle}
                  type="number"
                />
              </Campo>
              <Campo label="Prefeito">
                <input
                  value={edit.prefeito}
                  onChange={(event) => atualizarEdit("prefeito", event.target.value)}
                  style={inputStyle}
                />
              </Campo>
              <Campo label="E-mail prefeito">
                <input
                  value={edit.email_prefeito}
                  onChange={(event) =>
                    atualizarEdit("email_prefeito", event.target.value)
                  }
                  style={inputStyle}
                  type="email"
                />
              </Campo>
              <Campo label="Secretario de cultura">
                <input
                  value={edit.secretario_cultura}
                  onChange={(event) =>
                    atualizarEdit("secretario_cultura", event.target.value)
                  }
                  style={inputStyle}
                />
              </Campo>
              <Campo label="E-mail cultura">
                <input
                  value={edit.email_cultura}
                  onChange={(event) =>
                    atualizarEdit("email_cultura", event.target.value)
                  }
                  style={inputStyle}
                  type="email"
                />
              </Campo>
              <div style={{ gridColumn: "1 / -1" }}>
                <Campo label="Telefone/WhatsApp">
                  <input
                    value={edit.telefone_whatsapp}
                    onChange={(event) =>
                      atualizarEdit("telefone_whatsapp", event.target.value)
                    }
                    style={inputStyle}
                  />
                </Campo>
              </div>
            </div>
          </section>
        </div>

        <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Eventos</h3>

            <form onSubmit={cadastrarEventoMapeado} style={eventFormStyle}>
              <Campo label="Evento mapeado">
                <input
                  value={novoEvento.nome}
                  onChange={(event) =>
                    atualizarNovoEvento("nome", event.target.value)
                  }
                  style={inputStyle}
                  placeholder="Ex: Aniversario da cidade"
                />
              </Campo>
              <Campo label="Data do evento">
                <input
                  value={novoEvento.data}
                  onChange={(event) =>
                    atualizarNovoEvento("data", event.target.value)
                  }
                  style={inputStyle}
                  type="date"
                />
              </Campo>
              <Campo label="Modelo">
                <select
                  value={novoEvento.modelo}
                  onChange={(event) =>
                    atualizarNovoEvento("modelo", event.target.value)
                  }
                  style={inputStyle}
                >
                  {MODELOS_CONTRATACAO.map((modelo) => (
                    <option key={modelo} value={modelo}>
                      {modelo}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Lembrar antes">
                <select
                  value={novoEvento.mesesAntes}
                  onChange={(event) =>
                    atualizarNovoEvento("mesesAntes", event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="3">3 meses antes</option>
                  <option value="4">4 meses antes</option>
                  <option value="5">5 meses antes</option>
                  <option value="6">6 meses antes</option>
                </select>
              </Campo>
              <div>
                <span style={labelStyle}>Prioridade automatica</span>
                <div style={autoPriorityBoxStyle}>
                  <PrioridadeBadge
                    value={calcularPrioridadeEvento(novoEvento.data) || "-"}
                  />
                  <small>
                    {novoEvento.data
                      ? "Calculada pela distancia ate a data do evento."
                      : "Informe a data para calcular."}
                  </small>
                </div>
              </div>
              <button
                type="submit"
                disabled={salvandoEvento}
                style={{
                  ...botaoSecundario,
                  width: "fit-content",
                  opacity: salvandoEvento ? 0.7 : 1,
                }}
              >
                <Plus size={17} />
                {salvandoEvento ? "Salvando..." : "Adicionar evento"}
              </button>
            </form>

            {eventosModal.length === 0 ? (
              <p style={mutedTextStyle}>Nenhum evento cadastrado.</p>
            ) : (
              <div style={miniListStyle}>
                {eventosModal.map((evento) => (
                  <div key={evento.id} style={miniListItemStyle}>
                    <strong>{evento.nome_evento}</strong>
                    <span>
                      {formatarData(evento.data_evento)} •{" "}
                      {evento.modelo_contratacao || "-"} •{" "}
                      {evento.prioridade || "Sem prioridade"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Resumo da oportunidade</h3>
            <div style={formGridStyle}>
              <Campo label="Status">
                <select
                  value={edit.status}
                  onChange={(event) => atualizarEdit("status", event.target.value)}
                  style={inputStyle}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Modelo">
                <select
                  value={edit.modelo_contratacao}
                  onChange={(event) =>
                    atualizarEdit("modelo_contratacao", event.target.value)
                  }
                  style={inputStyle}
                >
                  {MODELOS_CONTRATACAO.map((modelo) => (
                    <option key={modelo} value={modelo}>
                      {modelo}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Prioridade">
                <input
                  value={edit.prioridade}
                  onChange={(event) => atualizarEdit("prioridade", event.target.value)}
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Valor proposto">
                <input
                  value={edit.valor_proposto}
                  onChange={(event) =>
                    atualizarEdit("valor_proposto", event.target.value)
                  }
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Evento">
                <input
                  value={edit.nome_evento}
                  onChange={(event) => atualizarEdit("nome_evento", event.target.value)}
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Data do evento">
                <input
                  value={edit.data_evento}
                  onChange={(event) => atualizarEdit("data_evento", event.target.value)}
                  style={inputStyle}
                  type="date"
                />
              </Campo>
              <Campo label="Data de contato">
                <input
                  value={edit.data_contato}
                  onChange={(event) => atualizarEdit("data_contato", event.target.value)}
                  style={inputStyle}
                  type="date"
                />
              </Campo>
              <Campo label="Proximo contato">
                <input
                  value={edit.proximo_contato}
                  onChange={(event) =>
                    atualizarEdit("proximo_contato", event.target.value)
                  }
                  style={inputStyle}
                  type="date"
                />
              </Campo>
            </div>

            <p style={{ ...mutedTextStyle, marginTop: 12 }}>
              Ultima atualizacao: {formatarDataHoraCurta(linha.ultimaAtualizacao)}
            </p>
          </section>
        </div>

        <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Historico e observacoes</h3>
            <Campo label="Observacoes gerais">
              <textarea
                value={edit.observacoes}
                onChange={(event) => atualizarEdit("observacoes", event.target.value)}
                style={{ ...inputStyle, minHeight: 108, paddingTop: 14 }}
              />
            </Campo>
            <Campo label="Observacoes do evento">
              <textarea
                value={edit.observacoes_evento}
                onChange={(event) =>
                  atualizarEdit("observacoes_evento", event.target.value)
                }
                style={{ ...inputStyle, minHeight: 90, paddingTop: 14 }}
              />
            </Campo>
            {interacoes.length === 0 ? (
              <p style={mutedTextStyle}>Nenhuma interacao registrada.</p>
            ) : (
              <div style={miniListStyle}>
                {interacoes.slice(0, 5).map((interacao) => (
                  <div key={interacao.id} style={miniListItemStyle}>
                    <strong>{interacao.tipo}</strong>
                    <span>{interacao.descricao || "-"}</span>
                    <small>{formatarDataHoraCurta(interacao.data_interacao)}</small>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <div style={modalFooterStyle}>
          <button
            type="button"
            onClick={salvarAlteracoes}
            disabled={salvandoAlteracoes}
            style={{ ...botaoPrincipal, opacity: salvandoAlteracoes ? 0.7 : 1 }}
          >
            <Check size={17} />
            {salvandoAlteracoes ? "Salvando..." : "Salvar Alteracoes"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(oportunidade)}
            style={botaoPerigo}
          >
            <Trash2 size={17} />
            Excluir oportunidade
          </button>
        </div>
      </div>
    </div>
  );
}

function NotificacoesModal({
  notificacoes,
  onClose,
  onOpen,
}: {
  notificacoes: Array<{
    linha: {
      oportunidade: Oportunidade;
      municipio: Municipio | null;
      eventoPrincipal: EventoMunicipal | null;
    };
    data: Date;
    dias: number;
    status: string;
  }>;
  onClose: () => void;
  onOpen: (oportunidadeId: string) => void;
}) {
  const [ativando, setAtivando] = useState(false);

  async function ativarNotificacoesNavegador() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Este navegador nao suporta notificacoes.");
      return;
    }

    try {
      setAtivando(true);
      const permissao =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      if (permissao !== "granted") {
        alert("Permissao de notificacao nao ativada.");
        return;
      }

      const primeira = notificacoes[0];
      new Notification("GIBA CRM", {
        body: primeira
          ? `${primeira.linha.municipio?.nome || "Prefeitura"}: contato em ${formatarData(
              primeira.linha.oportunidade.proximo_contato,
            )}`
          : "Notificacoes ativadas para lembretes do CRM.",
      });
    } finally {
      setAtivando(false);
    }
  }

  return (
    <div style={modalOverlayStyle} onMouseDown={onClose}>
      <div
        style={{ ...modalCardStyle, width: "min(720px, calc(100vw - 32px))" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div style={modalHeaderStyle}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={modalIconStyle}>
              <Bell size={23} />
            </div>
            <div>
              <h2 style={modalTitleStyle}>Notificacoes CRM</h2>
              <p style={sectionSubtitleStyle}>
                Contatos vencidos, para hoje e proximos lembretes de prefeituras.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={iconButtonStyle}>
            <X size={22} />
          </button>
        </div>

        <button
          type="button"
          onClick={ativarNotificacoesNavegador}
          disabled={ativando}
          style={{
            ...botaoSecundario,
            width: "100%",
            marginBottom: 16,
            opacity: ativando ? 0.7 : 1,
          }}
        >
          <Bell size={17} />
          {ativando ? "Ativando..." : "Ativar notificacoes do navegador"}
        </button>

        {notificacoes.length === 0 ? (
          <div style={emptyStyle}>
            <Bell size={34} />
            <h3 style={{ margin: "12px 0 6px" }}>Tudo em dia</h3>
            <p style={mutedTextStyle}>
              Nenhum contato pendente para os proximos 30 dias.
            </p>
          </div>
        ) : (
          <div style={notificationListStyle}>
            {notificacoes.map((item) => (
              <button
                key={item.linha.oportunidade.id}
                type="button"
                onClick={() => onOpen(item.linha.oportunidade.id)}
                style={notificationItemStyle}
              >
                <span>
                  <strong>{item.linha.municipio?.nome || "Prefeitura"}</strong>
                  <small>
                    {item.linha.eventoPrincipal?.nome_evento ||
                      "Oportunidade comercial"}
                  </small>
                </span>
                <span style={notificationDateStyle}>
                  {formatarData(item.linha.oportunidade.proximo_contato)}
                </span>
                <PrioridadeBadge
                  value={
                    item.status === "vencido"
                      ? "Vencido"
                      : item.status === "hoje"
                        ? "Hoje"
                        : `${item.dias} dias`
                  }
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function SelectFilter({
  icon,
  value,
  onChange,
  options,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div style={filterSelectContainerStyle}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        style={filterSelectWrapStyle}
      >
        {icon}
        <span style={filterSelectedTextStyle}>{selected?.label || "Filtro"}</span>
        <ChevronDown size={16} color="#94A3B8" />
      </button>

      {open && (
        <div style={filterMenuStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={{
                ...filterMenuItemStyle,
                ...(option.value === value ? filterMenuItemActiveStyle : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div style={detailItemStyle}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

function ContactItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  return (
    <div style={contactItemStyle}>
      <span style={contactIconStyle}>{icon}</span>
      <span>
        <small>{label}</small>
        <strong>{value || "-"}</strong>
      </span>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return <span style={badgeStyle}>{value}</span>;
}

function PrioridadeBadge({ value }: { value: string }) {
  const texto = value.toLowerCase();
  const color = texto.includes("urg")
    ? "#FF5B8A"
    : texto.includes("max")
      ? "#FFB454"
      : texto.includes("boa")
        ? "#37E884"
        : "#00AAFF";

  return (
    <span
      style={{
        ...badgeStyle,
        color,
        borderColor: `${color}66`,
        background: `${color}18`,
      }}
    >
      {value}
    </span>
  );
}

function escolherEventoPrincipal(eventos: EventoMunicipal[]) {
  if (eventos.length === 0) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeMs = hoje.getTime();

  const comData = eventos
    .map((evento) => ({
      evento,
      data: evento.data_evento
        ? new Date(`${evento.data_evento}T00:00:00`).getTime()
        : null,
    }))
    .filter((item): item is { evento: EventoMunicipal; data: number } =>
      Number.isFinite(item.data),
    );

  const futuro = comData
    .filter((item) => item.data >= hojeMs)
    .sort((a, b) => a.data - b.data)[0];

  if (futuro) return futuro.evento;

  return (
    comData.sort((a, b) => b.data - a.data)[0]?.evento ||
    eventos.find((evento) => evento.prioridade) ||
    eventos[0]
  );
}

function calcularUltimaAtualizacao(
  municipio: Municipio | null,
  oportunidade: Oportunidade,
  eventos: EventoMunicipal[],
  interacoes: Interacao[],
) {
  const datas = [
    municipio?.updated_at,
    municipio?.created_at,
    oportunidade.updated_at,
    oportunidade.created_at,
    ...eventos.flatMap((evento) => [evento.updated_at, evento.created_at]),
    ...interacoes.flatMap((interacao) => [
      interacao.data_interacao,
      interacao.created_at,
    ]),
  ]
    .filter(Boolean)
    .map((valor) => new Date(String(valor)).getTime())
    .filter((valor) => Number.isFinite(valor));

  if (datas.length === 0) return null;
  return new Date(Math.max(...datas)).toISOString();
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

function formatarDataHoraCurta(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function formatarNumero(valor?: number | null) {
  if (!valor && valor !== 0) return "-";
  return valor.toLocaleString("pt-BR");
}

function formatarDistancia(valor?: number | null) {
  if (!valor && valor !== 0) return "-";
  return `${valor.toLocaleString("pt-BR")} km`;
}

function calcularDataContatoEvento(dataEvento: string, mesesAntes: number) {
  if (!dataEvento || !mesesAntes) return "";
  const data = new Date(`${dataEvento}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "";

  data.setMonth(data.getMonth() - mesesAntes);
  return data.toISOString().slice(0, 10);
}

function calcularPrioridadeEvento(dataEvento: string) {
  if (!dataEvento) return "";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const data = new Date(`${dataEvento}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "";

  const mesesAteEvento =
    (data.getFullYear() - hoje.getFullYear()) * 12 +
    (data.getMonth() - hoje.getMonth()) +
    (data.getDate() - hoje.getDate()) / 30;

  if (mesesAteEvento > 3) return "Boa Oportunidade";
  if (mesesAteEvento > 2) return "Urgencia";
  return "Maxima";
}

const pageStyle: React.CSSProperties = {
  maxWidth: 1480,
  margin: "0 auto",
  color: "#fff",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 22,
  flexWrap: "wrap",
  marginBottom: 24,
};

const headerIdentityStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 16,
};

const headerIconStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#8B35FF,#00AAFF)",
  boxShadow: "0 18px 44px rgba(139,53,255,0.35)",
  flex: "0 0 auto",
};

const tituloStyle: React.CSSProperties = {
  fontSize: "clamp(34px, 4vw, 42px)",
  lineHeight: 1,
  margin: "2px 0 8px",
  letterSpacing: 0,
};

const subtituloStyle: React.CSSProperties = {
  color: "#B7C7E6",
  fontSize: 17,
  margin: 0,
  lineHeight: 1.45,
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  paddingTop: 2,
};

const botaoPrincipal: React.CSSProperties = {
  minHeight: 52,
  padding: "0 20px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(90deg,#8B35FF,#00AAFF)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
};

const botaoSecundario: React.CSSProperties = {
  ...botaoPrincipal,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const botaoNeutro: React.CSSProperties = {
  ...botaoSecundario,
  minHeight: 46,
};

const botaoPerigo: React.CSSProperties = {
  ...botaoNeutro,
  color: "#FDA4AF",
  border: "1px solid rgba(255,91,138,0.35)",
  background: "rgba(255,91,138,0.12)",
};

const cardStyle: React.CSSProperties = {
  background:
    "linear-gradient(135deg,rgba(255,255,255,0.065),rgba(0,170,255,0.08))",
  border: "1px solid rgba(255,255,255,0.11)",
  borderRadius: 24,
  padding: 26,
  marginBottom: 24,
  boxShadow: "0 18px 50px rgba(0,0,0,0.18)",
};

const notificationButtonStyle: React.CSSProperties = {
  position: "relative",
  width: 52,
  height: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.08)",
  color: "#DDEBFF",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const notificationBadgeStyle: React.CSSProperties = {
  position: "absolute",
  top: -7,
  right: -7,
  minWidth: 22,
  height: 22,
  padding: "0 6px",
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "#FF5B8A",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
  border: "2px solid #071426",
};

const notificationListStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

const notificationItemStyle: React.CSSProperties = {
  minHeight: 82,
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(5,10,24,0.48)",
  color: "#fff",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  alignItems: "center",
  textAlign: "left",
  cursor: "pointer",
};

const notificationDateStyle: React.CSSProperties = {
  color: "#7DD3FC",
  fontWeight: 900,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 20,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.1,
};

const sectionSubtitleStyle: React.CSSProperties = {
  color: "#9FB2D0",
  margin: "8px 0 0",
  lineHeight: 1.4,
};

const countBadgeStyle: React.CSSProperties = {
  minWidth: 54,
  height: 38,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  color: "#D9CCFF",
  fontWeight: 900,
  border: "1px solid rgba(139,53,255,0.45)",
  background: "rgba(139,53,255,0.18)",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16,
};

const fieldStyle: React.CSSProperties = {
  display: "block",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#CBD5E1",
  fontSize: 14,
  fontWeight: 900,
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  padding: "0 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(5,10,24,0.66)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const formActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 20,
};

const filtersStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(260px, 1fr) repeat(2, minmax(190px, 240px))",
  gap: 12,
  marginBottom: 18,
};

const searchWrapStyle: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(5,10,24,0.58)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 14px",
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#fff",
  fontSize: 15,
};

const filterSelectContainerStyle: React.CSSProperties = {
  position: "relative",
  minWidth: 0,
};

const filterSelectWrapStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(5,10,24,0.58)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  color: "#fff",
  cursor: "pointer",
};

const filterSelectedTextStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontWeight: 800,
  textAlign: "left",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const filterMenuStyle: React.CSSProperties = {
  position: "absolute",
  zIndex: 50,
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  maxHeight: 230,
  overflowY: "auto",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#081323",
  boxShadow: "0 18px 45px rgba(0,0,0,0.38)",
  padding: 6,
};

const filterMenuItemStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 42,
  border: "none",
  borderRadius: 12,
  background: "transparent",
  color: "#CBD5E1",
  padding: "0 12px",
  textAlign: "left",
  fontWeight: 800,
  cursor: "pointer",
};

const filterMenuItemActiveStyle: React.CSSProperties = {
  background: "linear-gradient(90deg,rgba(139,53,255,0.34),rgba(0,170,255,0.24))",
  color: "#fff",
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableHeaderStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr .8fr 1fr 44px",
  gap: 12,
  padding: "0 16px 12px",
  color: "#89A2C7",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 1,
  minWidth: 980,
};

const tableBodyStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  minWidth: 980,
};

const tableRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr 1fr 1fr .8fr 1fr 44px",
  gap: 12,
  alignItems: "center",
  width: "100%",
  minHeight: 76,
  padding: "12px 16px",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(5,10,24,0.48)",
  color: "#E5EDF9",
  textAlign: "left",
  cursor: "pointer",
};

const municipioCellStyle: React.CSSProperties = {
  display: "grid",
  gap: 4,
};

const rowActionCellStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  color: "#7DD3FC",
  background: "rgba(0,170,255,0.12)",
};

const badgeStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 30,
  maxWidth: "100%",
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,170,255,0.35)",
  background: "rgba(0,170,255,0.12)",
  color: "#BAE6FD",
  fontSize: 13,
  fontWeight: 900,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const emptyStyle: React.CSSProperties = {
  minHeight: 220,
  borderRadius: 20,
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  border: "1px dashed rgba(255,255,255,0.16)",
  color: "#CBD5E1",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#9FB2D0",
  margin: 0,
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(2,6,18,0.76)",
  backdropFilter: "blur(12px)",
  display: "grid",
  placeItems: "center",
  padding: 20,
};

const modalCardStyle: React.CSSProperties = {
  width: "min(1080px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(135deg,#101224,#08263A)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.48)",
  padding: 26,
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 22,
};

const modalIconStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#8B35FF,#00AAFF)",
};

const modalTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.1,
};

const iconButtonStyle: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.07)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const modalGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 16,
  marginBottom: 16,
};

const modalSectionStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(5,10,24,0.48)",
  padding: 20,
};

const modalSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: 22,
};

const detailGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const detailItemStyle: React.CSSProperties = {
  minHeight: 82,
  borderRadius: 16,
  padding: 14,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(0,0,0,0.18)",
  display: "grid",
  gap: 6,
};

const modalActionsLineStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
  marginTop: 14,
};

const contactListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const contactItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  minHeight: 58,
  borderRadius: 16,
  padding: "10px 12px",
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(0,0,0,0.16)",
};

const contactIconStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  color: "#7DD3FC",
  background: "rgba(0,170,255,0.12)",
};

const miniListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
};

const eventFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const autoPriorityBoxStyle: React.CSSProperties = {
  minHeight: 50,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(5,10,24,0.46)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 12px",
  color: "#9FB2D0",
};

const miniListItemStyle: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(0,0,0,0.16)",
  padding: 14,
  display: "grid",
  gap: 6,
};

const noteBoxStyle: React.CSSProperties = {
  margin: "0 0 10px",
  borderRadius: 16,
  padding: 14,
  background: "rgba(139,53,255,0.12)",
  border: "1px solid rgba(139,53,255,0.24)",
  color: "#E5EDF9",
  lineHeight: 1.5,
};

const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 18,
};

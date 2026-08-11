"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Landmark,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import GibaSelect from "../../components/GibaSelect";
import ProtectedRoute from "../../components/ProtectedRoute";
import CrmEventTable from "../../components/crm/CrmEventTable";
import CrmFilters from "../../components/crm/CrmFilters";
import CrmHeader from "../../components/crm/CrmHeader";
import CrmHistory from "../../components/crm/CrmHistory";
import CrmModalTabs, {
  type CrmModalTab,
} from "../../components/crm/CrmModalTabs";
import CrmSummaryCards from "../../components/crm/CrmSummaryCards";
import CrmTable from "../../components/crm/CrmTable";
import WhatsAppMessageModal from "../../components/whatsapp/WhatsAppMessageModal";
import { supabase } from "../../lib/supabase";
import { getAccountAuthUser } from "../../lib/access-session";
import ImportarCrmModal from "./ImportarCrmModal";

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

const MODELOS_CONTRATACAO = ["Credenciamento", "Inexigibilidade"];
const MODELOS_EVENTO = ["Credenciamento", "Inexigibilidade"];
const PRIORIDADES_CRM = ["Boa Oportunidade", "Urgência", "Máxima"];

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
  modelo_contratacao: "Credenciamento",
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
  const [filtroMesContato, setFiltroMesContato] = useState("todos");
  const [form, setForm] = useState<FormMunicipio>(formInicial);
  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [mostrarImportacao, setMostrarImportacao] = useState(false);
  const [excluindoCrm, setExcluindoCrm] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function obterUsuarioLogado() {
    const { data, error } = await getAccountAuthUser();

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
      console.error("Erro ao carregar municípios:", municipiosRes.error);
      alert("Erro ao carregar municípios.");
    }

    if (oportunidadesRes.error) {
      console.error("Erro ao carregar oportunidades:", oportunidadesRes.error);
      alert("Erro ao carregar oportunidades.");
    }

    if (eventosRes.error) {
      console.error("Erro ao carregar eventos municipais:", eventosRes.error);
    }

    if (interacoesRes.error) {
      console.error("Erro ao carregar interações:", interacoesRes.error);
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
        alert("Município criado, mas houve erro ao criar oportunidade.");
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
      console.error("Erro ao alterar modelo de contratação:", error);
      alert("Erro ao alterar modelo de contratação.");
      return;
    }

    await carregarDados();
  }

  async function excluirOportunidade(oportunidade: Oportunidade) {
    const confirmar = window.confirm(
      `Deseja excluir a oportunidade de ${
        oportunidade.municipios?.nome || "município"
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

  async function excluirTodosDadosCrm() {
    const user = await obterUsuarioLogado();
    if (!user) return;

    const confirmar = window.confirm(
      "Isso vai apagar TODAS as prefeituras, oportunidades, eventos e históricos do CRM. Deseja continuar?",
    );

    if (!confirmar) return;

    const texto = window.prompt(
      "Para confirmar a exclusão total do CRM, digite EXCLUIR.",
    );

    if (texto !== "EXCLUIR") return;

    try {
      setExcluindoCrm(true);

      const exclusoes = [
        await supabase.from("crm_interacoes").delete().eq("user_id", user.id),
        await supabase.from("municipio_eventos").delete().eq("user_id", user.id),
        await supabase.from("crm_oportunidades").delete().eq("user_id", user.id),
        await supabase.from("municipios").delete().eq("user_id", user.id),
      ];

      const erro = exclusoes.find((resultado) => resultado.error)?.error;

      if (erro) {
        console.error("Erro ao excluir dados do CRM:", erro);
        alert("Não foi possível excluir todos os dados do CRM.");
        return;
      }

      setSelecionadaId(null);
      setMunicipios([]);
      setOportunidades([]);
      setEventos([]);
      setInteracoes([]);
      await carregarDados();
    } finally {
      setExcluindoCrm(false);
    }
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
      const modeloContratacao = normalizarModeloEvento(
        eventoPrincipal?.modelo_contratacao ||
          oportunidade.modelo_contratacao ||
          "",
      );
      const prioridade = normalizarPrioridadeCrm(
        eventoPrincipal?.prioridade || "",
      );
      const proximoContato = obterProximoContatoCrm(
        oportunidade,
        eventoPrincipal,
      );

      return {
        oportunidade,
        municipio,
        eventos: eventosMunicipio,
        interacoes: interacoesOportunidade,
        eventoPrincipal,
        modeloContratacao,
        prioridade,
        proximoContato,
        ultimaAtualizacao: calcularUltimaAtualizacao(
          municipio,
          oportunidade,
          eventosMunicipio,
          interacoesOportunidade,
        ),
      };
    });
  }, [oportunidades, eventos, interacoes]);

  const linhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return linhasCrm
      .filter((linha) => {
      const municipio = linha.municipio;

      const combinaBusca =
        !termo ||
        municipio?.nome?.toLowerCase().includes(termo) ||
        municipio?.prefeito?.toLowerCase().includes(termo) ||
        municipio?.secretario_cultura?.toLowerCase().includes(termo) ||
        municipio?.telefone_whatsapp?.toLowerCase().includes(termo) ||
        linha.modeloContratacao.toLowerCase().includes(termo) ||
        linha.prioridade.toLowerCase().includes(termo) ||
        formatarMelhorMesContato(linha.proximoContato)
          .toLowerCase()
          .includes(termo);

      const combinaModelo =
        filtroModelo === "todos" ||
        linha.modeloContratacao === filtroModelo;

      const combinaPrioridade =
        filtroPrioridade === "todos" ||
        obterChaveFiltro(linha.prioridade) === obterChaveFiltro(filtroPrioridade);

      const combinaMesContato =
        filtroMesContato === "todos" ||
        linha.eventos.some((evento) => {
          const dataContato = calcularDataContatoEvento(
            evento.data_evento || "",
            obterMesesAntesEvento(evento.observacoes),
          );

          if (!dataContato) return false;

          const data = new Date(`${dataContato}T00:00:00`);
          return data.getMonth() === Number(filtroMesContato);
        });

      return (
        combinaBusca &&
        combinaModelo &&
        combinaPrioridade &&
        combinaMesContato
      );
    })
    .sort((a, b) => {
      const dataA = obterPesoOrdenacaoContato(a.proximoContato);
      const dataB = obterPesoOrdenacaoContato(b.proximoContato);

      if (dataA !== dataB) return dataA - dataB;

      return (a.municipio?.nome || "").localeCompare(b.municipio?.nome || "");
    });
  }, [linhasCrm, busca, filtroModelo, filtroPrioridade, filtroMesContato]);

  const notificacoesCrm = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 30);

    return linhasCrm
      .filter((linha) => linha.proximoContato)
      .map((linha) => {
        const data = new Date(`${linha.proximoContato}T00:00:00`);
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

  const resumoCrm = useMemo(() => {
    const ativas = linhasCrm.filter(
      (linha) =>
        linha.oportunidade.status !== "fechado" &&
        linha.oportunidade.status !== "perdido",
    ).length;

    return {
      total: linhasCrm.length,
      ativas,
      vencidos: notificacoesCrm.filter((item) => item.status === "vencido")
        .length,
      hoje: notificacoesCrm.filter((item) => item.status === "hoje").length,
      proximos: notificacoesCrm.filter((item) => item.status === "proximo")
        .length,
    };
  }, [linhasCrm, notificacoesCrm]);

  const linhaSelecionada =
    linhasCrm.find((linha) => linha.oportunidade.id === selecionadaId) || null;

  return (
    <ProtectedRoute modulo="crm">
      <AppLayout>
        <div style={pageStyle}>
          <CrmHeader
            deleting={excluindoCrm}
            onCreate={() => setMostrarFormulario(true)}
            onImport={() => setMostrarImportacao(true)}
            onDeleteAll={excluirTodosDadosCrm}
          />

          <CrmSummaryCards
            total={resumoCrm.total}
            active={resumoCrm.ativas}
            overdue={resumoCrm.vencidos}
            today={resumoCrm.hoje}
            upcoming={resumoCrm.proximos}
          />

          {mostrarImportacao && (
            <ImportarCrmModal
              onClose={() => setMostrarImportacao(false)}
              onImported={carregarDados}
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
                      <h2 style={modalTitleStyle}>Cadastrar Prefeitura</h2>
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
                  <Campo label="Município *">
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
                  <Campo label="Distância da Capital">
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
                  <Campo label="Modelo de Contratação">
                    <GibaSelect
                      value={form.modelo_contratacao}
                      onChange={(value) =>
                        atualizarCampo("modelo_contratacao", value)
                      }
                      options={MODELOS_CONTRATACAO.map((modelo) => ({ value: modelo, label: modelo }))}
                      triggerStyle={inputStyle}
                    />
                  </Campo>
                  <Campo label="Prioridade">
                    <GibaSelect
                      value={form.prioridade}
                      onChange={(value) => atualizarCampo("prioridade", value)}
                      options={[
                        { value: "", label: "Sem prioridade" },
                        ...PRIORIDADES_CRM.map((prioridade) => ({ value: prioridade, label: prioridade })),
                      ]}
                      placeholder="Selecione a prioridade"
                      triggerStyle={inputStyle}
                    />
                  </Campo>
                  <Campo label="Evento">
                    <input
                      value={form.nome_evento}
                      onChange={(e) =>
                        atualizarCampo("nome_evento", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Aniversário, festa da cidade..."
                    />
                  </Campo>
                  <Campo label="Data do Evento">
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
                  <Campo label="E-mail do Prefeito">
                    <input
                      value={form.email_prefeito}
                      onChange={(e) =>
                        atualizarCampo("email_prefeito", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Secretário de Cultura">
                    <input
                      value={form.secretario_cultura}
                      onChange={(e) =>
                        atualizarCampo("secretario_cultura", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail da Cultura">
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
                  <Campo label="Valor Proposto">
                    <input
                      value={form.valor_proposto}
                      onChange={(e) =>
                        atualizarCampo("valor_proposto", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="15000"
                    />
                  </Campo>
                  <Campo label="Data de Contato">
                    <input
                      value={form.data_contato}
                      onChange={(e) =>
                        atualizarCampo("data_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Próximo Contato">
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
                    <Campo label="Observações">
                      <textarea
                        value={form.observacoes}
                        onChange={(e) =>
                          atualizarCampo("observacoes", e.target.value)
                        }
                        style={{ ...inputStyle, minHeight: 104, paddingTop: 14 }}
                        placeholder="Histórico, detalhes de contato, pendências..."
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
                  <h2 style={sectionTitleStyle}>Cadastrar Prefeitura</h2>
                  <p style={sectionSubtitleStyle}>
                    Crie o registro principal e, se desejar, ja informe evento e
                    prioridade.
                  </p>
                </div>
              </div>

              <form onSubmit={salvarMunicipioEOportunidade}>
                <div style={formGridStyle}>
                  <Campo label="Município *">
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
                  <Campo label="Distância da Capital">
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
                  <Campo label="Modelo de Contratação">
                    <GibaSelect
                      value={form.modelo_contratacao}
                      onChange={(value) => atualizarCampo("modelo_contratacao", value)}
                      options={MODELOS_CONTRATACAO.map((modelo) => ({ value: modelo, label: modelo }))}
                      triggerStyle={inputStyle}
                    />
                  </Campo>
                  <Campo label="Prioridade">
                    <GibaSelect
                      value={form.prioridade}
                      onChange={(value) => atualizarCampo("prioridade", value)}
                      options={[
                        { value: "", label: "Sem prioridade" },
                        ...PRIORIDADES_CRM.map((prioridade) => ({ value: prioridade, label: prioridade })),
                      ]}
                      placeholder="Selecione a prioridade"
                      triggerStyle={inputStyle}
                    />
                  </Campo>
                  <Campo label="Evento">
                    <input
                      value={form.nome_evento}
                      onChange={(e) =>
                        atualizarCampo("nome_evento", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="Aniversário, festa da cidade..."
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
                  <Campo label="E-mail do Prefeito">
                    <input
                      value={form.email_prefeito}
                      onChange={(e) =>
                        atualizarCampo("email_prefeito", e.target.value)
                      }
                      style={inputStyle}
                      type="email"
                    />
                  </Campo>
                  <Campo label="Secretário de Cultura">
                    <input
                      value={form.secretario_cultura}
                      onChange={(e) =>
                        atualizarCampo("secretario_cultura", e.target.value)
                      }
                      style={inputStyle}
                    />
                  </Campo>
                  <Campo label="E-mail da Cultura">
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
                  <Campo label="Valor Proposto">
                    <input
                      value={form.valor_proposto}
                      onChange={(e) =>
                        atualizarCampo("valor_proposto", e.target.value)
                      }
                      style={inputStyle}
                      placeholder="15000"
                    />
                  </Campo>
                  <Campo label="Data de Contato">
                    <input
                      value={form.data_contato}
                      onChange={(e) =>
                        atualizarCampo("data_contato", e.target.value)
                      }
                      style={inputStyle}
                      type="date"
                    />
                  </Campo>
                  <Campo label="Próximo Contato">
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
                    <Campo label="Observações">
                      <textarea
                        value={form.observacoes}
                        onChange={(e) =>
                          atualizarCampo("observacoes", e.target.value)
                        }
                        style={{ ...inputStyle, minHeight: 104 }}
                        placeholder="Histórico, detalhes de contato, pendências..."
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

          <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.045] p-3 shadow-[0_24px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:mt-6 sm:p-5">
            <div className="mb-4 flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">Carteira comercial</span>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-white">Prefeituras e oportunidades</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-400 sm:text-right">
                Follow-ups mais urgentes aparecem primeiro. Abra um registro para acessar o dossiê completo.
              </p>
            </div>

            <CrmFilters
              search={busca}
              model={filtroModelo}
              priority={filtroPrioridade}
              contactMonth={filtroMesContato}
              resultCount={linhasFiltradas.length}
              onSearchChange={setBusca}
              onModelChange={setFiltroModelo}
              onPriorityChange={setFiltroPrioridade}
              onContactMonthChange={setFiltroMesContato}
              modelOptions={[
                { value: "todos", label: "Todos os modelos" },
                ...MODELOS_EVENTO.map((modelo) => ({ value: modelo, label: modelo })),
              ]}
              priorityOptions={[
                { value: "todos", label: "Todas as prioridades" },
                ...PRIORIDADES_CRM.map((prioridade) => ({ value: prioridade, label: prioridade })),
              ]}
            />

            <div className="mt-4">
              <CrmTable
                rows={linhasFiltradas}
                loading={carregando}
                onOpen={setSelecionadaId}
              />
            </div>
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
  const telefonesIniciais = separarTelefones(municipio?.telefone_whatsapp || "");
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<CrmModalTab>("dados");
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [eventosModal, setEventosModal] = useState(eventos);
  const [interacoesModal, setInteracoesModal] = useState(interacoes);
  const [novaObservacao, setNovaObservacao] = useState("");
  const [salvandoObservacao, setSalvandoObservacao] = useState(false);
  const [whatsappAberto, setWhatsappAberto] = useState(false);

  function abrirNovaObservacao() {
    setAbaAtiva("historico");
    window.setTimeout(() => {
      document.getElementById("crm-nova-observacao")?.focus();
    }, 0);
  }
  const [novoEvento, setNovoEvento] = useState({
    nome: "",
    data: "",
    modelo: "Credenciamento",
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
    telefone_1: telefonesIniciais[0],
    telefone_2: telefonesIniciais[1],
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

      const dataEventoBanco = normalizarDataEventoParaBanco(novoEvento.data);
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
          data_evento: dataEventoBanco,
          modelo_contratacao: novoEvento.modelo || null,
          prioridade: prioridadeAutomatica,
          observacoes: criarObservacaoEvento(novoEvento.mesesAntes),
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
        modelo: "Credenciamento",
        mesesAntes: "3",
        observacoes: "",
      });
      await onSaved();
    } finally {
      setSalvandoEvento(false);
    }
  }

  async function excluirEventoMapeado(evento: EventoMunicipal) {
    const confirmar = window.confirm(
      `Deseja excluir o evento "${evento.nome_evento}"?`,
    );

    if (!confirmar) return;

    const { error } = await supabase
      .from("municipio_eventos")
      .delete()
      .eq("id", evento.id);

    if (error) {
      console.error("Erro ao excluir evento mapeado:", error);
      alert("Não foi possível excluir o evento.");
      return;
    }

    setEventosModal((atual) => atual.filter((item) => item.id !== evento.id));
    await onSaved();
  }

  async function adicionarObservacaoHistorico(event: React.FormEvent) {
    event.preventDefault();

    if (!novaObservacao.trim()) {
      alert("Informe a observação.");
      return;
    }

    try {
      setSalvandoObservacao(true);

      const { data, error } = await supabase
        .from("crm_interacoes")
        .insert({
          user_id: oportunidade.user_id,
          oportunidade_id: oportunidade.id,
          tipo: "Observacao",
          descricao: novaObservacao.trim(),
          data_interacao: new Date().toISOString(),
        })
        .select("*")
        .single();

      if (error) {
        console.error("Erro ao adicionar observação:", error);
        alert("Não foi possível adicionar a observação.");
        return;
      }

      setInteracoesModal((atual) => [data as Interacao, ...atual]);
      setNovaObservacao("");
      await onSaved();
    } finally {
      setSalvandoObservacao(false);
    }
  }

  async function excluirObservacaoHistorico(interacao: Interacao) {
    const confirmar = window.confirm("Deseja excluir esta observação?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("crm_interacoes")
      .delete()
      .eq("id", interacao.id);

    if (error) {
      console.error("Erro ao excluir observação:", error);
      alert("Não foi possível excluir a observação.");
      return;
    }

    setInteracoesModal((atual) =>
      atual.filter((item) => item.id !== interacao.id),
    );
    await onSaved();
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
          telefone_whatsapp: combinarTelefones(edit.telefone_1, edit.telefone_2),
          observacoes: edit.observacoes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", municipio.id);

      if (municipioError) {
        console.error("Erro ao atualizar município:", municipioError);
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
                {municipio?.nome || "Município não informado"}
                {municipio?.estado ? ` / ${municipio.estado}` : ""}
              </h2>
              <p style={sectionSubtitleStyle}>
                Informações da prefeitura e oportunidade comercial.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={iconButtonStyle}>
            <X size={22} />
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(edit.telefone_1 || edit.telefone_2) ? (
            <button
              type="button"
              onClick={() => setWhatsappAberto(true)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 text-xs font-black text-emerald-200 transition hover:bg-emerald-400/20"
            >
              <Phone size={16} /> WhatsApp
            </button>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-slate-600">
              <Phone size={16} /> Sem WhatsApp
            </span>
          )}
          {edit.email_prefeito && (
            <a href={`mailto:${edit.email_prefeito}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 text-xs font-black text-blue-200 transition hover:bg-blue-500/20">
              <Mail size={16} /> E-mail prefeito
            </a>
          )}
          {edit.email_cultura && (
            <a href={`mailto:${edit.email_cultura}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/20">
              <Send size={16} /> E-mail cultura
            </a>
          )}
          <button type="button" onClick={abrirNovaObservacao} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 text-xs font-black text-violet-200 transition hover:bg-violet-500/20">
            <MessageSquare size={16} /> Adicionar observação
          </button>
        </div>

        <div className="mb-5">
          <CrmModalTabs active={abaAtiva} eventCount={eventosModal.length} historyCount={interacoesModal.length} onChange={setAbaAtiva} />
        </div>

        {abaAtiva === "dados" && <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Dados da Prefeitura</h3>
            <div style={formGridStyle}>
              <Campo label="Município">
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
              <Campo label="Distância da capital">
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
              <Campo label="E-mail do Prefeito">
                <input
                  value={edit.email_prefeito}
                  onChange={(event) =>
                    atualizarEdit("email_prefeito", event.target.value)
                  }
                  style={inputStyle}
                  type="email"
                />
              </Campo>
              <Campo label="Secretário de Cultura">
                <input
                  value={edit.secretario_cultura}
                  onChange={(event) =>
                    atualizarEdit("secretario_cultura", event.target.value)
                  }
                  style={inputStyle}
                />
              </Campo>
              <Campo label="E-mail da Cultura">
                <input
                  value={edit.email_cultura}
                  onChange={(event) =>
                    atualizarEdit("email_cultura", event.target.value)
                  }
                  style={inputStyle}
                  type="email"
                />
              </Campo>
              <div className="col-span-full min-w-0">
                <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Campo label="Telefone 1">
                    <input
                      value={edit.telefone_1}
                      onChange={(event) =>
                        atualizarEdit(
                          "telefone_1",
                          formatarTelefoneDigitado(event.target.value)
                        )
                      }
                      style={inputStyle}
                      placeholder="Telefone principal"
                    />
                  </Campo>
                  <Campo label="Telefone 2">
                    <input
                      value={edit.telefone_2}
                      onChange={(event) =>
                        atualizarEdit(
                          "telefone_2",
                          formatarTelefoneDigitado(event.target.value)
                        )
                      }
                      style={inputStyle}
                      placeholder="Telefone alternativo"
                    />
                  </Campo>
                  <div className="min-w-0 md:col-span-2">
                    <Campo label="Observações">
                      <input
                        value={edit.observacoes}
                        onChange={(event) =>
                          atualizarEdit("observacoes", event.target.value)
                        }
                        style={inputStyle}
                        placeholder="Histórico, detalhes de contato, pendências..."
                      />
                    </Campo>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>}

        {abaAtiva === "eventos" && <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Eventos</h3>

            <form onSubmit={cadastrarEventoMapeado} style={eventFormStyle}>
              <Campo label="Evento Mapeado">
                <input
                  value={novoEvento.nome}
                  onChange={(event) =>
                    atualizarNovoEvento("nome", event.target.value)
                  }
                  style={inputStyle}
                  placeholder="Ex.: Aniversário da Cidade"
                />
              </Campo>
              <Campo label="Data do Evento">
                <input
                  value={novoEvento.data}
                  onChange={(event) =>
                    atualizarNovoEvento(
                      "data",
                      formatarDiaMesDigitado(event.target.value),
                    )
                  }
                  style={inputStyle}
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="dd/mm"
                />
              </Campo>
              <Campo label="Modelo">
                <GibaSelect
                  value={novoEvento.modelo}
                  onChange={(value) => atualizarNovoEvento("modelo", value)}
                  options={MODELOS_EVENTO.map((modelo) => ({ value: modelo, label: modelo }))}
                  triggerStyle={inputStyle}
                />
              </Campo>
              <Campo label="Lembrar Antes">
                <GibaSelect
                  value={novoEvento.mesesAntes}
                  onChange={(value) => atualizarNovoEvento("mesesAntes", value)}
                  options={[3, 4, 5, 6].map((months) => ({ value: String(months), label: `${months} Meses Antes` }))}
                  triggerStyle={inputStyle}
                />
              </Campo>
              <div className="col-span-full grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(220px,1fr)] xl:items-end">
                <div className="min-w-0">
                  <span style={labelStyle}>Melhor Mês para Contato</span>
                  <div style={calculatedMonthBoxStyle}>
                    {formatarMelhorMesContato(
                      calcularDataContatoEvento(
                        novoEvento.data,
                        Number(novoEvento.mesesAntes || 0),
                      ),
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <span style={labelStyle}>Prioridade Automática</span>
                  <div style={autoPriorityBoxStyle}>
                    <PrioridadeBadge
                      value={calcularPrioridadeEvento(novoEvento.data) || "-"}
                    />
                    <small>
                      {novoEvento.data
                        ? "Calculada pela distância até a data do evento."
                        : "Informe a data para calcular."}
                    </small>
                  </div>
                </div>
                <button
                  className="md:col-span-2 xl:col-span-1"
                  type="submit"
                  disabled={salvandoEvento}
                  style={{
                    ...eventSubmitButtonStyle,
                    opacity: salvandoEvento ? 0.7 : 1,
                  }}
                >
                  <Plus size={17} />
                  {salvandoEvento ? "Salvando..." : "Adicionar evento"}
                </button>
              </div>
            </form>

            <CrmEventTable
              events={eventosModal}
              onDelete={(evento) => excluirEventoMapeado(evento as EventoMunicipal)}
              formatDate={formatarDataEventoCurta}
              normalizeModel={normalizarModeloEvento}
              formatBestContactMonth={formatarMelhorMesContato}
              calculateContactDate={calcularDataContatoEvento}
              getReminderMonths={obterMesesAntesEvento}
            />
          </section>
        </div>}

        {abaAtiva === "oportunidade" && <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Resumo da Oportunidade</h3>
            <div style={formGridStyle}>
              <Campo label="Status">
                <GibaSelect
                  value={edit.status}
                  onChange={(value) => {
                    atualizarEdit("status", value);
                    onStatusChange(oportunidade.id, value);
                  }}
                  options={STATUS_OPTIONS}
                  triggerStyle={inputStyle}
                />
              </Campo>
              <Campo label="Modelo de Contratação">
                <GibaSelect
                  value={edit.modelo_contratacao}
                  onChange={(value) => {
                    atualizarEdit("modelo_contratacao", value);
                    onModeloChange(oportunidade.id, value);
                  }}
                  options={MODELOS_CONTRATACAO.map((modelo) => ({ value: modelo, label: modelo }))}
                  triggerStyle={inputStyle}
                />
              </Campo>
              <Campo label="Prioridade">
                <GibaSelect
                  value={normalizarPrioridadeCrm(edit.prioridade)}
                  onChange={(value) => atualizarEdit("prioridade", value)}
                  options={[
                    { value: "", label: "Sem prioridade" },
                    ...PRIORIDADES_CRM.map((prioridade) => ({ value: prioridade, label: prioridade })),
                  ]}
                  placeholder="Selecione a prioridade"
                  triggerStyle={inputStyle}
                />
              </Campo>
              <Campo label="Valor Proposto">
                <input
                  value={edit.valor_proposto}
                  onChange={(event) =>
                    atualizarEdit("valor_proposto", event.target.value)
                  }
                  style={inputStyle}
                />
              </Campo>
              <Campo label="Data de Contato">
                <input
                  value={edit.data_contato}
                  onChange={(event) => atualizarEdit("data_contato", event.target.value)}
                  style={inputStyle}
                  type="date"
                />
              </Campo>
              <Campo label="Próximo Contato">
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
              Última atualização: {formatarDataHoraCurta(linha.ultimaAtualizacao)}
            </p>
          </section>
        </div>}

        {abaAtiva === "historico" && <div style={modalGridStyle}>
          <section style={modalSectionStyle}>
            <h3 style={modalSectionTitleStyle}>Histórico e observações</h3>
            <CrmHistory
              items={interacoesModal}
              note={novaObservacao}
              eventNotes={edit.observacoes_evento}
              saving={salvandoObservacao}
              onNoteChange={setNovaObservacao}
              onEventNotesChange={(value) =>
                atualizarEdit("observacoes_evento", value)
              }
              onSubmit={adicionarObservacaoHistorico}
              onDelete={(interacao) =>
                excluirObservacaoHistorico(interacao as Interacao)
              }
              formatDateTime={formatarDataHoraCurta}
            />
          </section>
        </div>}
        <div className="mt-[18px] grid gap-3 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={salvarAlteracoes}
            disabled={salvandoAlteracoes}
            style={{ ...botaoPrincipal, opacity: salvandoAlteracoes ? 0.7 : 1 }}
            className="w-full sm:w-auto"
          >
            <Check size={17} />
            {salvandoAlteracoes ? "Salvando..." : "Salvar alterações"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(oportunidade)}
            style={{ ...botaoPerigo, minHeight: 52 }}
            className="w-full sm:w-auto"
          >
            <Trash2 size={17} />
            Excluir oportunidade
          </button>
        </div>
        <WhatsAppMessageModal
          open={whatsappAberto}
          onOpenChange={setWhatsappAberto}
          contextType="crm"
          messageType="apresentacao_comercial"
          recipient={{
            id: municipio?.id,
            name: edit.prefeito || edit.secretario_cultura || edit.municipio,
            phone: edit.telefone_1 || edit.telefone_2,
            email: edit.email_prefeito || edit.email_cultura,
          }}
          extraVariables={{
            municipio: edit.municipio,
            estado: edit.estado,
            prefeito: edit.prefeito,
            secretario_cultura: edit.secretario_cultura,
            modelo_contratacao: edit.modelo_contratacao,
          }}
        />
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

function PrioridadeBadge({ value }: { value: string }) {
  const texto = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
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

function formatarData(data?: string | null) {
  if (!data) return "-";
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatarDataEventoCurta(data?: string | null) {
  if (!data) return "-";

  if (/^\d{2}\/\d{2}$/.test(data)) return data;

  const dataNormalizada = data.includes("/")
    ? normalizarDataEventoParaBanco(data)
    : data;

  if (!dataNormalizada) return "-";

  const [, mes, dia] = dataNormalizada.split("-");
  return `${dia}/${mes}`;
}

function separarTelefones(valor: string): [string, string] {
  if (!valor.trim()) return ["", ""];

  const partes = valor
    .split(/\s*(?:\||;|\n| \/ )\s*/)
    .map((parte) => parte.trim())
    .filter(Boolean);

  return [partes[0] || valor.trim(), partes.slice(1).join(" | ")];
}

function combinarTelefones(telefone1: string, telefone2: string) {
  const telefones = [telefone1.trim(), telefone2.trim()].filter(Boolean);
  return telefones.length ? telefones.join(" | ") : null;
}

function formatarTelefoneDigitado(valor: string) {
  const texto = valor.trimStart();

  if (/[A-Za-zÀ-ÿ]/.test(texto) || texto.includes("|") || texto.includes(";")) {
    return valor;
  }

  const digitos = texto.replace(/\D/g, "").slice(0, 11);

  if (!digitos || digitos.startsWith("0800")) return valor;
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 3) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 7) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(3)}`;
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 3)} ${digitos.slice(
    3,
    7
  )}-${digitos.slice(7)}`;
}

function formatarDiaMesDigitado(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 4);

  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

function normalizarDataEventoParaBanco(valor: string) {
  if (!valor) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;

  const match = valor.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return null;

  const dia = Number(match[1]);
  const mes = Number(match[2]);

  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const anoAtual = hoje.getFullYear();
  let data = new Date(anoAtual, mes - 1, dia);

  if (
    data.getDate() !== dia ||
    data.getMonth() !== mes - 1 ||
    Number.isNaN(data.getTime())
  ) {
    return null;
  }

  if (data < hoje) {
    data = new Date(anoAtual + 1, mes - 1, dia);
  }

  const ano = data.getFullYear();
  const mesTexto = String(data.getMonth() + 1).padStart(2, "0");
  const diaTexto = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mesTexto}-${diaTexto}`;
}

function criarObservacaoEvento(mesesAntes: string) {
  return `lembrar_antes:${mesesAntes || "3"}`;
}

function obterMesesAntesEvento(observacoes?: string | null) {
  const match = observacoes?.match(/lembrar_antes:(\d+)/);
  return match ? Number(match[1]) : 3;
}

function formatarMelhorMesContato(dataContato: string) {
  if (!dataContato) return "-";

  const data = new Date(`${dataContato}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "-";

  const mes = data.toLocaleDateString("pt-BR", { month: "long" });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

function normalizarModeloEvento(modelo?: string | null) {
  const texto = (modelo || "").toUpperCase();

  if (texto.includes("INEXIG")) return "Inexigibilidade";
  if (texto.includes("LICITAR") || texto.includes("CIMVALPI")) {
    return "Credenciamento";
  }

  return modelo || "-";
}

function normalizarPrioridadeCrm(prioridade?: string | null) {
  const texto = obterChaveFiltro(prioridade || "");

  if (texto.includes("max")) return "Máxima";
  if (texto.includes("urg")) return "Urgência";
  if (texto.includes("boa")) return "Boa Oportunidade";

  return prioridade || "";
}

function obterChaveFiltro(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obterProximoContatoCrm(
  oportunidade: Oportunidade,
  eventoPrincipal?: EventoMunicipal | null,
) {
  if (oportunidade.proximo_contato) return oportunidade.proximo_contato;

  if (!eventoPrincipal?.data_evento) return "";

  return calcularDataContatoEvento(
    eventoPrincipal.data_evento,
    obterMesesAntesEvento(eventoPrincipal.observacoes),
  );
}

function obterPesoOrdenacaoContato(data?: string | null) {
  if (!data) return Number.MAX_SAFE_INTEGER;

  const timestamp = new Date(`${data}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function formatarDataHoraCurta(data?: string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function calcularDataContatoEvento(dataEvento: string, mesesAntes: number) {
  if (!dataEvento || !mesesAntes) return "";
  const dataNormalizada = normalizarDataEventoParaBanco(dataEvento);
  if (!dataNormalizada) return "";

  const data = new Date(`${dataNormalizada}T00:00:00`);
  if (Number.isNaN(data.getTime())) return "";

  data.setMonth(data.getMonth() - mesesAntes);
  return data.toISOString().slice(0, 10);
}

function calcularPrioridadeEvento(dataEvento: string) {
  if (!dataEvento) return "";
  const dataNormalizada = normalizarDataEventoParaBanco(dataEvento);
  if (!dataNormalizada) return "";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const data = new Date(`${dataNormalizada}T00:00:00`);
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
  padding: 8,
};

const modalCardStyle: React.CSSProperties = {
  width: "min(1080px, calc(100vw - 16px))",
  maxHeight: "calc(100dvh - 16px)",
  overflowY: "auto",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(135deg,#101224,#08263A)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.48)",
  padding: "clamp(16px, 3vw, 26px)",
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
  fontSize: "clamp(22px, 5vw, 30px)",
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
  padding: "clamp(14px, 3vw, 20px)",
};

const modalSectionTitleStyle: React.CSSProperties = {
  margin: "0 0 14px",
  fontSize: 22,
};

const eventFormStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 16,
  paddingBottom: 16,
  borderBottom: "1px solid rgba(255,255,255,0.10)",
};

const eventSubmitButtonStyle: React.CSSProperties = {
  ...botaoSecundario,
  width: "100%",
  minHeight: 50,
  alignSelf: "end",
  justifyContent: "center",
};

const calculatedMonthBoxStyle: React.CSSProperties = {
  ...inputStyle,
  display: "flex",
  alignItems: "center",
  color: "#E2E8F0",
  fontWeight: 900,
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

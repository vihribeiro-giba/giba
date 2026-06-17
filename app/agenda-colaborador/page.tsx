"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { supabase } from "../../lib/supabase";
import { getEventStatus } from "../../lib/eventStatus";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Music,
  Users,
  X,
  Eye,
  Navigation,
  Bell,
  Sparkles,
  CalendarClock,
  DollarSign,
  UserCheck,
} from "lucide-react";

/* ============================================================
   TIPOS
   ============================================================ */
type Evento = {
  id: string;
  user_id?: string;
  event_type: string;
  show_format: string;
  client_name: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  notes: string;
};

type Colaborador = {
  id: string;
  user_id?: string;
  nome: string;
  funcao: string;
  status: string;
  email?: string;
};

type Vinculo = {
  event_id: string;
  collaborator_id: string;
};

type Financeiro = {
  id: string;
  user_id?: string;
  type: string | null;
  amount: number | null;
  category: string | null;
  event_id: string | null;
  client_name?: string | null;
  description?: string | null;
  payment_date?: string | null;
  status?: string | null;
};

type ColaboradorSession = {
  id: string;
  nome: string;
  email: string;
  funcao?: string;
  user_id: string;
  tipo: string;
};

/* ============================================================
   UTILITÁRIOS
   ============================================================ */
const mesesCurtos = [
  "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
  "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];

const diasSemana = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function diaSemanaBR(data: string) {
  const p = partesData(data);
  if (!p) return "Dia não informado";
  const dataObj = new Date(p.ano, p.mes - 1, p.dia);
  return diasSemana[dataObj.getDay()];
}

function partesData(data: string) {
  if (!data) return null;
  const apenasData = data.split("T")[0];
  const partes = apenasData.split("-");
  if (partes.length !== 3) return null;
  const [ano, mes, dia] = partes.map(Number);
  if (Number.isNaN(ano) || Number.isNaN(mes) || Number.isNaN(dia)) return null;
  return { ano, mes, dia };
}

function formatarDataBR(data: string) {
  const p = partesData(data);
  if (!p) return data || "Não informado";
  return `${String(p.dia).padStart(2, "0")}/${String(p.mes).padStart(2, "0")}/${p.ano}`;
}

function diasAte(data: string) {
  const p = partesData(data);
  if (!p) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(p.ano, p.mes - 1, p.dia);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

function iniciais(nome: string) {
  const partes = (nome || "").trim().split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const avatarPalette = ["#8B35FF", "#00AAFF", "#38BDF8", "#37E884", "#FF5B8A", "#F59E0B"];

function corAvatar(nome: string) {
  const texto = nome || "?";
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma += texto.charCodeAt(i);
  return avatarPalette[soma % avatarPalette.length];
}

type Aba = "proximos" | "realizados";

export default function AgendaColaboradorPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");
  const [colaboradorAtual, setColaboradorAtual] = useState<Colaborador | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [aba, setAba] = useState<Aba>("proximos");
  const [eventoDetalhe, setEventoDetalhe] = useState<Evento | null>(null);

  /* Confirmação de presença (estado visual local).
     ------------------------------------------------------------------
     Para persistir no banco no futuro, criar a tabela:

     create table event_collaborator_confirmations (
       id uuid primary key default gen_random_uuid(),
       event_id uuid not null,
       collaborator_id uuid not null,
       confirmed boolean default false,
       confirmed_at timestamptz,
       created_at timestamptz default now()
     );

     Depois, substituir o estado local abaixo por uma consulta/insert
     usando supabase.from("event_collaborator_confirmations").
     ------------------------------------------------------------------ */
  const [presencasConfirmadas, setPresencasConfirmadas] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const verificarTela = () => setIsMobile(window.innerWidth <= 980);
    verificarTela();
    window.addEventListener("resize", verificarTela);
    return () => window.removeEventListener("resize", verificarTela);
  }, []);

  /* ============================================================
     SESSÃO / ACESSO DO COLABORADOR  (mantido do original)
     ============================================================ */
  function obterSessaoColaboradorLocal(): ColaboradorSession | null {
    if (typeof window === "undefined") return null;

    const sessao = localStorage.getItem("giba_colaborador_session");
    if (!sessao) return null;

    try {
      const colaborador = JSON.parse(sessao) as ColaboradorSession;

      if (!colaborador?.id || !colaborador?.user_id || colaborador?.tipo !== "colaborador") {
        localStorage.removeItem("giba_colaborador_session");
        return null;
      }

      return colaborador;
    } catch (error) {
      console.error("Erro ao ler sessão do colaborador:", error);
      localStorage.removeItem("giba_colaborador_session");
      return null;
    }
  }

  async function obterColaboradorLogado() {
    const sessaoLocal = obterSessaoColaboradorLocal();

    if (sessaoLocal) {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .eq("id", sessaoLocal.id)
        .eq("user_id", sessaoLocal.user_id)
        .eq("status", "Ativo")
        .maybeSingle();

      if (error) {
        console.error("Erro ao validar colaborador:", error);
        alert("Erro ao validar acesso do colaborador.");
        window.location.href = "/login";
        return null;
      }

      if (!data) {
        localStorage.removeItem("giba_colaborador_session");
        alert("Acesso do colaborador não encontrado ou inativo.");
        window.location.href = "/login";
        return null;
      }

      return data as Colaborador;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      window.location.href = "/login";
      return null;
    }

    const { data: colaborador, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("email", user.email)
      .eq("status", "Ativo")
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar colaborador autenticado:", error);
      alert("Erro ao validar acesso do colaborador.");
      window.location.href = "/login";
      return null;
    }

    if (!colaborador?.id || !colaborador?.user_id) {
      alert("Este usuário não está cadastrado como colaborador ativo.");
      window.location.href = "/dashboard";
      return null;
    }

    localStorage.setItem(
      "giba_colaborador_session",
      JSON.stringify({
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        funcao: colaborador.funcao,
        user_id: colaborador.user_id,
        tipo: "colaborador",
      })
    );

    return colaborador as Colaborador;
  }

  /* ============================================================
     CARREGAMENTO DE DADOS  (mantido do original)
     ============================================================ */
  async function carregarDados() {
    setCarregando(true);

    const colaborador = await obterColaboradorLogado();

    if (!colaborador?.id || !colaborador?.user_id) {
      setEventos([]);
      setColaboradores([]);
      setVinculos([]);
      setFinanceiro([]);
      setColaboradorSelecionado("");
      setColaboradorAtual(null);
      setCarregando(false);
      return;
    }

    setColaboradorAtual(colaborador);

    const { data: vinculosColaborador, error: erroVinculosColaborador } = await supabase
      .from("event_collaborators")
      .select("*")
      .eq("collaborator_id", colaborador.id);

    if (erroVinculosColaborador) {
      console.error("Erro ao carregar vínculos do colaborador:", erroVinculosColaborador);
      alert("Erro ao carregar agenda do colaborador.");
      setCarregando(false);
      return;
    }

    const idsEventos = vinculosColaborador?.map((item) => item.event_id) || [];

    if (idsEventos.length === 0) {
      setEventos([]);
      setColaboradores([colaborador]);
      setVinculos([]);
      setFinanceiro([]);
      setColaboradorSelecionado(colaborador.id);
      setCarregando(false);
      return;
    }

    const { data: eventosRes, error: erroEventos } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", colaborador.user_id)
      .in("id", idsEventos)
      .order("event_date", { ascending: true });

    if (erroEventos) {
      console.error("Erro ao carregar eventos do colaborador:", erroEventos);
      alert("Erro ao carregar eventos do colaborador.");
      setCarregando(false);
      return;
    }

    const idsEventosPermitidos = (eventosRes || []).map((evento) => evento.id);

    if (idsEventosPermitidos.length === 0) {
      setEventos([]);
      setColaboradores([colaborador]);
      setVinculos([]);
      setFinanceiro([]);
      setColaboradorSelecionado(colaborador.id);
      setCarregando(false);
      return;
    }

    const { data: todosVinculos, error: erroTodosVinculos } = await supabase
      .from("event_collaborators")
      .select("*")
      .in("event_id", idsEventosPermitidos);

    if (erroTodosVinculos) {
      console.error("Erro ao carregar equipe dos eventos:", erroTodosVinculos);
      alert("Erro ao carregar equipe dos eventos.");
      setCarregando(false);
      return;
    }

    const { data: financeiroRes, error: erroFinanceiro } = await supabase
      .from("finance")
      .select("id,user_id,type,amount,category,event_id,client_name,description,payment_date,status")
      .eq("user_id", colaborador.user_id)
      .eq("type", "Saída")
      .eq("category", "Colaboradores")
      .in("event_id", idsEventosPermitidos);

    if (erroFinanceiro) {
  setFinanceiro([]);
} else {
  setFinanceiro((financeiroRes || []) as Financeiro[]);
}

    const idsColaboradoresEquipe = Array.from(
      new Set((todosVinculos || []).map((item) => item.collaborator_id))
    );

    let colaboradoresEquipe: Colaborador[] = [colaborador];

    if (idsColaboradoresEquipe.length > 0) {
      const { data: colaboradoresRes, error: erroColaboradores } = await supabase
        .from("collaborators")
        .select("*")
        .eq("user_id", colaborador.user_id)
        .eq("status", "Ativo")
        .in("id", idsColaboradoresEquipe)
        .order("nome", { ascending: true });

      if (erroColaboradores) {
        console.error("Erro ao carregar colaboradores da equipe:", erroColaboradores);
        alert("Erro ao carregar equipe escalada.");
        setCarregando(false);
        return;
      }

      colaboradoresEquipe = (colaboradoresRes || []) as Colaborador[];
    }

    setEventos((eventosRes || []) as Evento[]);
    setColaboradores(colaboradoresEquipe);
    setVinculos((todosVinculos || []) as Vinculo[]);
    setColaboradorSelecionado(colaborador.id);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  /* ============================================================
     DADOS DERIVADOS
     ============================================================ */
  const eventosDoColaborador = useMemo(() => {
    if (!colaboradorSelecionado) return [];

    const eventosIds = vinculos
      .filter((item) => item.collaborator_id === colaboradorSelecionado)
      .map((item) => item.event_id);

    return eventos
      .filter((evento) => eventosIds.includes(evento.id))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [eventos, vinculos, colaboradorSelecionado]);

  const eventosProximos = useMemo(
    () =>
      eventosDoColaborador.filter(
        (evento) => getEventStatus(evento.event_date) !== "realizado"
      ),
    [eventosDoColaborador]
  );

  const eventosRealizados = useMemo(
    () =>
      eventosDoColaborador
        .filter((evento) => getEventStatus(evento.event_date) === "realizado")
        .sort((a, b) => b.event_date.localeCompare(a.event_date)),
    [eventosDoColaborador]
  );

  const eventosEsteMes = useMemo(() => {
    const hoje = new Date();
    return eventosDoColaborador.filter((evento) => {
      const p = partesData(evento.event_date);
      if (!p) return false;
      return p.mes - 1 === hoje.getMonth() && p.ano === hoje.getFullYear();
    }).length;
  }, [eventosDoColaborador]);

  const totalCachesLancados = useMemo(() => {
    if (!colaboradorAtual?.nome) return 0;

    const idsEventosColaborador = new Set(eventosDoColaborador.map((evento) => evento.id));
    const nomeColaboradorAtual = colaboradorAtual.nome.trim().toLowerCase();

    return financeiro
      .filter((item) => {
        const eventoPertenceAoColaborador = item.event_id
          ? idsEventosColaborador.has(item.event_id)
          : false;

        const favorecido = String(item.client_name || "").trim().toLowerCase();
        const descricao = String(item.description || "").trim().toLowerCase();

        const lancamentoEhDoColaborador =
          favorecido === nomeColaboradorAtual ||
          descricao.includes(nomeColaboradorAtual);

        return eventoPertenceAoColaborador && lancamentoEhDoColaborador;
      })
      .reduce((total, item) => total + Number(item.amount || 0), 0);
  }, [financeiro, eventosDoColaborador, colaboradorAtual]);

  const proximoEvento = useMemo(() => eventosProximos[0] || null, [eventosProximos]);

  const eventosExibidos = aba === "proximos" ? eventosProximos : eventosRealizados;

  function equipeDoEvento(eventId: string) {
    const ids = vinculos
      .filter((item) => item.event_id === eventId)
      .map((item) => item.collaborator_id);

    return colaboradores.filter((colaborador) => ids.includes(colaborador.id));
  }

  function abrirLocalizacao(endereco: string) {
    if (!endereco || !endereco.trim()) {
      alert("Endereço não informado para este evento.");
      return;
    }
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
    window.open(url, "_blank");
  }

  function confirmarPresenca(eventId: string) {
    setPresencasConfirmadas((atual) => ({
      ...atual,
      [eventId]: !atual[eventId],
    }));
  }

  /* Avisos dinâmicos */
  const avisos = useMemo(() => {
    const lista: { id: string; texto: string }[] = [];

    if (proximoEvento) {
      const dias = diasAte(proximoEvento.event_date);
      if (dias === 0) {
        lista.push({ id: "hoje", texto: "Você tem um show hoje! Boa apresentação." });
      } else if (dias !== null && dias > 0) {
        lista.push({
          id: "proximo",
          texto: `Seu próximo show é em ${dias} ${dias === 1 ? "dia" : "dias"}.`,
        });
      }
    }

    if (eventosEsteMes > 0) {
      lista.push({
        id: "mes",
        texto: `Você possui ${eventosEsteMes} ${eventosEsteMes === 1 ? "evento" : "eventos"} este mês.`,
      });
    }

    if (eventosProximos.length > 0) {
      lista.push({
        id: "confirme",
        texto: "Confirme sua presença nos próximos eventos pelo botão de detalhes.",
      });
    }

    if (lista.length === 0) {
      lista.push({ id: "vazio", texto: "Você está em dia. Nenhum aviso no momento." });
    }

    return lista;
  }, [proximoEvento, eventosEsteMes, eventosProximos]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <ProtectedRoute>
      <PlanProtectedRoute modulo="agenda-colaborador">
        <AppLayout>
      <style>{`
        .agc-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
        .agc-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        @keyframes agcFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={pageStyle}>
        {/* HEADER */}
        <header style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={headerIconBoxStyle}>
              <CalendarCheck size={26} />
            </div>
            <div>
              <h1 style={titleStyle}>Agenda do Colaborador</h1>
              <p style={subtitleStyle}>
                Acompanhe seus shows, horários, equipe e informações operacionais.
              </p>
            </div>
          </div>

          <div style={headerBadgeStyle}>
            <Music size={16} />
            {colaboradorAtual?.nome || "Colaborador"}
          </div>
        </header>

        {/* CARDS DE RESUMO */}
        <section style={metricsGridStyle}>
          <ResumoCard
            icon={<CalendarClock size={22} />}
            color="#00AAFF"
            label="Este mês"
            value={eventosEsteMes}
            detail="Eventos no mês atual"
          />
          <ResumoCard
            icon={<CheckCircle2 size={22} />}
            color="#37E884"
            label="Realizados"
            value={eventosRealizados.length}
            detail="Histórico de shows"
          />
          <ResumoCard
            icon={<DollarSign size={22} />}
            color="#F59E0B"
            label="Financeiro"
            value={formatarMoeda(totalCachesLancados)}
            detail="Cachês recebidos"
            small
          />
          <ResumoCard
            icon={<Sparkles size={22} />}
            color="#8B35FF"
            label="Próximo Evento"
            value={proximoEvento ? formatarDataBR(proximoEvento.event_date) : "—"}
            detail={proximoEvento?.location?.split(",")[0] || "Sem agendamento"}
            small
          />
        </section>

        {/* GRID PRINCIPAL */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
            gap: 22,
            alignItems: "start",
          }}
        >
          {/* COLUNA PRINCIPAL */}
          <div style={panelStyle}>
            {/* ABAS */}
            <div style={tabsStyle}>
              <button
                style={aba === "proximos" ? tabAtivoStyle : tabInativoStyle}
                onClick={() => setAba("proximos")}
              >
                Próximos
                <span style={tabCountStyle}>{eventosProximos.length}</span>
              </button>
              <button
                style={aba === "realizados" ? tabAtivoStyle : tabInativoStyle}
                onClick={() => setAba("realizados")}
              >
                Realizados
                <span style={tabCountStyle}>{eventosRealizados.length}</span>
              </button>
            </div>

            {/* TIMELINE */}
            <div style={{ marginTop: 20 }}>
              {carregando && (
                <EstadoVazio
                  icon={<Clock size={28} />}
                  titulo="Carregando sua agenda..."
                  texto="Buscando seus eventos escalados."
                />
              )}

              {!carregando && !colaboradorSelecionado && (
                <EstadoVazio
                  icon={<Users size={28} />}
                  titulo="Colaborador não identificado"
                  texto="Não foi possível identificar o colaborador logado."
                />
              )}

              {!carregando && colaboradorSelecionado && eventosExibidos.length === 0 && (
                <EstadoVazio
                  icon={<CalendarDays size={28} />}
                  titulo={
                    aba === "proximos"
                      ? "Nenhum evento escalado no momento."
                      : "Nenhum evento realizado ainda."
                  }
                  texto={
                    aba === "proximos"
                      ? "Quando você for escalado para um show, ele aparecerá aqui."
                      : "Seu histórico de apresentações aparecerá aqui."
                  }
                />
              )}

              {!carregando && eventosExibidos.length > 0 && (
                <div style={timelineStyle}>
                  {eventosExibidos.map((evento, index) => {
                    const p = partesData(evento.event_date);
                    const status = getEventStatus(evento.event_date);
                    const confirmado = presencasConfirmadas[evento.id];

                    return (
                      <div
                        key={evento.id}
                        style={{
                          ...timelineItemStyle,
                          animation: `agcFade 0.3s ease ${index * 0.04}s both`,
                        }}
                      >
                        {/* DATA */}
                        <div style={dateBoxStyle}>
                          <span style={dateDayStyle}>
                            {p ? String(p.dia).padStart(2, "0") : "--"}
                          </span>
                          <span style={dateMonthStyle}>
                            {p ? mesesCurtos[p.mes - 1] : ""}
                          </span>
                        </div>

                        {/* CONTEÚDO */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={timelineHeaderStyle}>
                            <h3 style={eventTitleStyle}>
                              {evento.event_type}
                              {evento.show_format ? ` — ${evento.show_format}` : ""}
                            </h3>
                            <StatusBadge status={status} />
                          </div>

                          <div style={metaRowStyle}>
                            <span style={metaItemStyle}>
                              <Clock size={14} />
                              {evento.event_time || "A confirmar"}
                            </span>
                            <span style={metaItemStyle}>
                              <CalendarDays size={14} />
                              {diaSemanaBR(evento.event_date)}
                            </span>
                            <span style={metaItemStyle}>
                              <MapPin size={14} />
                              {evento.location?.split(",")[0] || "Local não informado"}
                            </span>
                            {confirmado && (
                              <span style={{ ...metaItemStyle, color: "#37E884" }}>
                                <UserCheck size={14} />
                                Presença confirmada
                              </span>
                            )}
                          </div>

                          <div style={actionsRowStyle}>
                            <button
                              style={primaryBtnStyle}
                              onClick={() => setEventoDetalhe(evento)}
                            >
                              <Eye size={15} />
                              Ver detalhes
                            </button>
                            <button
                              style={ghostBtnStyle}
                              onClick={() => abrirLocalizacao(evento.location)}
                            >
                              <Navigation size={15} />
                              Localização
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* PAINEL DE AVISOS */}
          <aside style={{ ...panelStyle, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={avisosIconStyle}>
                <Bell size={18} />
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Avisos</h2>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {avisos.map((aviso) => (
                <div key={aviso.id} style={avisoCardStyle}>
                  <Sparkles size={16} style={{ color: "#8B35FF", flexShrink: 0, marginTop: 2 }} />
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "#CBD5E1" }}>
                    {aviso.texto}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </div>

      {/* MODAL DE DETALHES */}
      {eventoDetalhe && (
        <div style={modalOverlayStyle} onClick={() => setEventoDetalhe(null)}>
          <div
            style={modalStyle}
            className="agc-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={modalHeaderStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={modalIconStyle}>
                  <Music size={20} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                    {eventoDetalhe.event_type}
                    {eventoDetalhe.show_format ? ` — ${eventoDetalhe.show_format}` : ""}
                  </h2>
                  <div style={{ marginTop: 6 }}>
                    <StatusBadge status={getEventStatus(eventoDetalhe.event_date)} />
                  </div>
                </div>
              </div>

              <button
                style={modalCloseStyle}
                onClick={() => setEventoDetalhe(null)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div style={detalhesGridStyle}>
              <DetalheItem label="Contratante" valor={eventoDetalhe.client_name || "Não informado"} />
              <DetalheItem label="Data" valor={`${formatarDataBR(eventoDetalhe.event_date)} • ${diaSemanaBR(eventoDetalhe.event_date)}`} />
              <DetalheItem label="Horário" valor={eventoDetalhe.event_time || "Não informado"} />
              <DetalheItem label="Duração" valor={eventoDetalhe.show_duration || "Não informado"} />
              <DetalheItem
                label="Endereço"
                valor={eventoDetalhe.location || "Não informado"}
                full
              />
              <DetalheItem label="Observações" valor={eventoDetalhe.notes || "-"} full />
            </div>

            {/* EQUIPE ESCALADA */}
            <div style={{ marginTop: 20 }}>
              <h3 style={modalSubtituloStyle}>
                <Users size={16} />
                Equipe escalada
              </h3>

              {equipeDoEvento(eventoDetalhe.id).length === 0 ? (
                <p style={{ color: "#94A3B8", fontSize: 14, margin: "8px 0 0" }}>
                  Nenhuma equipe informada.
                </p>
              ) : (
                <div style={equipeGridStyle}>
                  {equipeDoEvento(eventoDetalhe.id).map((colaborador) => (
                    <div key={colaborador.id} style={equipeCardStyle}>
                      <div
                        style={{
                          ...equipeAvatarStyle,
                          background: corAvatar(colaborador.nome),
                        }}
                      >
                        {iniciais(colaborador.nome)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={equipeNomeStyle}>{colaborador.nome}</p>
                        <p style={equipeFuncaoStyle}>
                          {colaborador.funcao || "Função não informada"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AÇÕES DO MODAL */}
            <div style={modalActionsStyle}>
              <button
                style={{
                  ...confirmBtnStyle,
                  ...(presencasConfirmadas[eventoDetalhe.id]
                    ? confirmBtnAtivoStyle
                    : {}),
                }}
                onClick={() => confirmarPresenca(eventoDetalhe.id)}
              >
                <CheckCircle2 size={17} />
                {presencasConfirmadas[eventoDetalhe.id]
                  ? "Presença confirmada"
                  : "Confirmar presença"}
              </button>

              <button
                style={mapBtnStyle}
                onClick={() => abrirLocalizacao(eventoDetalhe.location)}
              >
                <Navigation size={17} />
                Abrir no Google Maps
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

/* ============================================================
   COMPONENTES AUXILIARES
   ============================================================ */
function ResumoCard({
  icon,
  color,
  label,
  value,
  detail,
  small,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: React.ReactNode;
  detail: string;
  small?: boolean;
}) {
  return (
    <div style={resumoCardStyle}>
      <div
        style={{
          ...resumoIconStyle,
          background: `${color}26`,
          color,
          boxShadow: `0 12px 26px ${color}22`,
        }}
      >
        {icon}
      </div>
      <p style={resumoLabelStyle}>{label}</p>
      <p style={{ ...resumoValueStyle, fontSize: small ? 18 : 26 }}>{value}</p>
      <p style={resumoDetailStyle}>{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof getEventStatus> }) {
  const map = {
    realizado: { label: "Realizado", color: "#37E884", bg: "rgba(55,232,132,0.16)" },
    hoje: { label: "Hoje", color: "#F59E0B", bg: "rgba(245,158,11,0.18)" },
    proximo: { label: "Próximo", color: "#00AAFF", bg: "rgba(0,170,255,0.16)" },
  } as const;
  const cfg = map[status] || map.proximo;

  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}

function EstadoVazio({
  icon,
  titulo,
  texto,
}: {
  icon: React.ReactNode;
  titulo: string;
  texto: string;
}) {
  return (
    <div style={estadoVazioStyle}>
      <div style={estadoVazioIconStyle}>{icon}</div>
      <h3 style={{ margin: "16px 0 6px", fontSize: 17, fontWeight: 800 }}>{titulo}</h3>
      <p style={{ margin: 0, color: "#94A3B8", fontSize: 14, maxWidth: 360 }}>{texto}</p>
    </div>
  );
}

function DetalheItem({
  label,
  valor,
  full,
}: {
  label: string;
  valor: string;
  full?: boolean;
}) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <p style={detalheLabelStyle}>{label}</p>
      <p style={detalheValorStyle}>{valor}</p>
    </div>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */
const pageStyle: React.CSSProperties = {
  color: "#FFFFFF",
  width: "100%",
  maxWidth: 1440,
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 24,
  flexWrap: "wrap",
};

const headerIconBoxStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  minWidth: 56,
  borderRadius: 18,
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  boxShadow: "0 18px 38px rgba(139,53,255,0.32)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#94A3B8",
  fontSize: 15,
  maxWidth: 520,
};

const headerBadgeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontSize: 14,
  fontWeight: 700,
  color: "#E2E8F0",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 18,
  marginBottom: 24,
};

const resumoCardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 22,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 22px 45px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const resumoIconStyle: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 14,
};

const resumoLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: 13,
  fontWeight: 600,
};

const resumoValueStyle: React.CSSProperties = {
  margin: "6px 0 4px",
  fontWeight: 900,
  letterSpacing: "-0.02em",
  color: "#FFFFFF",
};

const resumoDetailStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748B",
  fontSize: 12.5,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 22px 50px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const tabsStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 6,
  padding: 6,
  borderRadius: 16,
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const tabBaseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 18px",
  borderRadius: 12,
  fontSize: 14,
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  transition: "0.2s ease",
};

const tabAtivoStyle: React.CSSProperties = {
  ...tabBaseStyle,
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#FFFFFF",
  boxShadow: "0 12px 26px rgba(139,53,255,0.28)",
};

const tabInativoStyle: React.CSSProperties = {
  ...tabBaseStyle,
  background: "transparent",
  color: "#94A3B8",
};

const tabCountStyle: React.CSSProperties = {
  padding: "1px 8px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.18)",
  fontSize: 12,
  fontWeight: 800,
};

const timelineStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const timelineItemStyle: React.CSSProperties = {
  display: "flex",
  gap: 16,
  padding: 18,
  borderRadius: 18,
  background: "rgba(0,0,0,0.24)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const dateBoxStyle: React.CSSProperties = {
  width: 64,
  minWidth: 64,
  height: 70,
  borderRadius: 16,
  background: "linear-gradient(135deg, rgba(139,53,255,0.22), rgba(0,170,255,0.18))",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const dateDayStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  lineHeight: 1,
  color: "#FFFFFF",
};

const dateMonthStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.08em",
  color: "#00C6FF",
  marginTop: 4,
};

const timelineHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const eventTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16.5,
  fontWeight: 800,
  color: "#FFFFFF",
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  margin: "12px 0 0",
};

const metaItemStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13.5,
  color: "#94A3B8",
  fontWeight: 600,
};

const actionsRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
};

const primaryBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 16px",
  borderRadius: 12,
  border: "none",
  cursor: "pointer",
  fontSize: 13.5,
  fontWeight: 700,
  color: "#FFFFFF",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  boxShadow: "0 10px 22px rgba(139,53,255,0.26)",
};

const ghostBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "9px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  cursor: "pointer",
  fontSize: 13.5,
  fontWeight: 700,
  color: "#E2E8F0",
  background: "rgba(255,255,255,0.05)",
};

const avisosIconStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 12,
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
};

const avisoCardStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  padding: 14,
  borderRadius: 14,
  background: "rgba(0,0,0,0.24)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const estadoVazioStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "48px 20px",
  borderRadius: 18,
  background: "rgba(0,0,0,0.2)",
  border: "1px dashed rgba(255,255,255,0.14)",
};

const estadoVazioIconStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 20,
  background: "rgba(139,53,255,0.16)",
  color: "#8B35FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

/* MODAL */
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(3,5,12,0.72)",
  backdropFilter: "blur(6px)",
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: 24,
  padding: 26,
  background: "linear-gradient(160deg, #0B1020, #0A1428)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
  animation: "agcFade 0.25s ease",
};

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 22,
};

const modalIconStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  minWidth: 44,
  borderRadius: 14,
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
};

const modalCloseStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  minWidth: 38,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const detalhesGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  padding: 18,
  borderRadius: 16,
  background: "rgba(0,0,0,0.26)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const detalheLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748B",
};

const detalheValorStyle: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: 14.5,
  fontWeight: 600,
  color: "#E2E8F0",
  lineHeight: 1.5,
};

const modalSubtituloStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  margin: 0,
  fontSize: 15,
  fontWeight: 800,
  color: "#FFFFFF",
};

const equipeGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 10,
  marginTop: 12,
};

const equipeCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 11,
  padding: 11,
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const equipeAvatarStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 14,
};

const equipeNomeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 700,
  color: "#FFFFFF",
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const equipeFuncaoStyle: React.CSSProperties = {
  margin: "2px 0 0",
  fontSize: 12.5,
  color: "#94A3B8",
};

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 24,
};

const confirmBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "13px 18px",
  borderRadius: 14,
  border: "1px solid rgba(55,232,132,0.4)",
  cursor: "pointer",
  fontSize: 14.5,
  fontWeight: 800,
  color: "#37E884",
  background: "rgba(55,232,132,0.12)",
};

const confirmBtnAtivoStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #22C55E, #37E884)",
  color: "#04210F",
  border: "1px solid transparent",
  boxShadow: "0 12px 26px rgba(55,232,132,0.3)",
};

const mapBtnStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 200,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "13px 18px",
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
  fontSize: 14.5,
  fontWeight: 800,
  color: "#FFFFFF",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  boxShadow: "0 12px 26px rgba(139,53,255,0.28)",
};

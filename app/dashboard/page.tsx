"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  CalendarDays,
  DollarSign,
  TrendingDown,
  Trophy,
  Users,
  UserPlus,
  Repeat,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Bell,
  Calendar,
} from "lucide-react";

import MetricCard from "../../components/dashboard/MetricCard";
import QuickActions from "../../components/dashboard/QuickActions";
import UpcomingShows from "../../components/dashboard/UpcomingShows";
import RevenueChart from "../../components/dashboard/RevenueChart";
import GibaInsights from "../../components/dashboard/GibaInsights";
import InfoListCard from "../../components/dashboard/InfoListCard";
import { getEventStatus } from "../../lib/eventStatus";

type Evento = {
  id: string;
  title: string;
  event_type: string;
  client_name: string;
  location: string;
  event_date: string;
  event_time: string;
  status: string;
  fee: number;
};

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  created_at?: string;
};

type Financeiro = {
  id: string;
  type: string;
  amount: number;
  created_at?: string;
};

type EmpresaResumo = {
  nome_artistico?: string | null;
  razao_social?: string | null;
  responsavel?: string | null;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function saudacao() {
  const hora = new Date().getHours();

  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

function normalizarStatusContrato(texto: string) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function statusContratoDashboard(evento: Evento) {
  const status = normalizarStatusContrato(evento.status || "");

  if (status.includes("cancel")) return "cancelado";
  if (status.includes("venc")) return "vencido";
  if (status.includes("assin")) return "assinado";
  if (status.includes("envi")) return "enviado";
  if (status.includes("ger")) return "gerado";

  return "pendente";
}

export default function DashboardPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [nomeUsuario, setNomeUsuario] = useState("Usuário GIBA");

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarDados() {
    const user = await obterUsuarioLogado();
    if (!user) return;

    const eventosRes = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    const clientesRes = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const financeiroRes = await supabase
      .from("finance")
      .select("*")
      .eq("user_id", user.id);

    const empresaRes = await supabase
      .from("company_settings")
      .select("nome_artistico,razao_social,responsavel")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (eventosRes.error) {
      console.error("Erro ao carregar eventos do dashboard:", eventosRes.error);
      alert("Erro ao carregar eventos do dashboard.");
      return;
    }

    if (clientesRes.error) {
      console.error("Erro ao carregar clientes do dashboard:", clientesRes.error);
      alert("Erro ao carregar clientes do dashboard.");
      return;
    }

    if (financeiroRes.error) {
      console.error("Erro ao carregar financeiro do dashboard:", financeiroRes.error);
      alert("Erro ao carregar financeiro do dashboard.");
      return;
    }

    if (empresaRes.error) {
      console.error("Erro ao carregar dados da empresa no dashboard:", empresaRes.error);
    }

    const empresa = empresaRes.data as EmpresaResumo | null;

    setNomeUsuario(
      empresa?.nome_artistico?.trim() ||
        empresa?.razao_social?.trim() ||
        empresa?.responsavel?.trim() ||
        user.email ||
        "Usuário GIBA"
    );

    setEventos(eventosRes.data || []);
    setClientes(clientesRes.data || []);
    setFinanceiro(financeiroRes.data || []);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const resumo = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    financeiro.forEach((item) => {
      if (item.type === "Entrada") entradas += Number(item.amount || 0);
      if (item.type === "Saída") saidas += Number(item.amount || 0);
    });

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
    };
  }, [financeiro]);

  const proximosEventos = useMemo(() => {
    return eventos.filter(
      (evento) => getEventStatus(evento.event_date) !== "realizado"
    );
  }, [eventos]);

  const eventosEstaSemana = useMemo(() => {
    const hoje = new Date();
    const daquiSeteDias = new Date();
    daquiSeteDias.setDate(hoje.getDate() + 7);

    return proximosEventos.filter((evento) => {
      const dataEvento = new Date(`${evento.event_date}T00:00:00`);
      return dataEvento >= hoje && dataEvento <= daquiSeteDias;
    }).length;
  }, [proximosEventos]);

  const clientesNovosMes = useMemo(() => {
    const hoje = new Date();

    return clientes.filter((cliente) => {
      if (!cliente.created_at) return false;
      const data = new Date(cliente.created_at);
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length;
  }, [clientes]);

  const ticketMedio = eventos.length > 0 ? resumo.entradas / eventos.length : 0;
  const contratosResumo = useMemo(() => {
    return eventos.reduce(
      (acc, evento) => {
        const status = statusContratoDashboard(evento);

        if (status === "assinado") acc.assinados += 1;
        else if (status === "cancelado" || status === "vencido") acc.vencidos += 1;
        else acc.pendentes += 1;

        return acc;
      },
      { pendentes: 0, assinados: 0, vencidos: 0 }
    );
  }, [eventos]);

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="dashboard">
        <AppLayout>
          <div style={pageStyle}>
            <header style={headerStyle}>
              <div>
                <h1 style={titleStyle}>{saudacao()}, {nomeUsuario}! 👋</h1>
                <p style={subtitleStyle}>Aqui está o resumo da sua operação hoje.</p>
              </div>

              <div style={headerActionsStyle}>
                <button style={iconButtonStyle} aria-label="Buscar">
                  <Search size={18} />
                </button>
                <button style={iconButtonStyle} aria-label="Notificações">
                  <Bell size={18} />
                </button>
                <button style={dateButtonStyle}>
                  <Calendar size={16} />
                  {new Date().toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </button>
              </div>
            </header>

            <QuickActions />

            <section style={metricsGridStyle}>
              <MetricCard
                icon={<CalendarDays size={24} />}
                title="Próximos Shows"
                value={proximosEventos.length}
                detail={`${eventosEstaSemana} esta semana`}
                color="#8B35FF"
              />

              <MetricCard
                icon={<DollarSign size={24} />}
                title="Receita Confirmada"
                value={formatarMoeda(resumo.entradas)}
                detail="Financeiro real"
                color="#37E884"
              />

              <MetricCard
                icon={<TrendingDown size={24} />}
                title="Despesas"
                value={formatarMoeda(resumo.saidas)}
                detail="Saídas registradas"
                color="#FF5B8A"
                positive={false}
              />

              <MetricCard
                icon={<Trophy size={24} />}
                title="Lucro Atual"
                value={formatarMoeda(resumo.saldo)}
                detail="Entradas - Saídas"
                color={resumo.saldo >= 0 ? "#00AAFF" : "#FF5B8A"}
                positive={resumo.saldo >= 0}
              />
            </section>

            <section style={mainGridStyle}>
              <UpcomingShows eventos={eventos} />
              <RevenueChart financeiro={financeiro} />
            </section>

            <section style={bottomGridStyle}>
              <InfoListCard
                title="Clientes"
                actionHref="/clientes"
                rows={[
                  {
                    label: "Total de clientes",
                    value: clientes.length,
                    icon: <Users size={20} />,
                    color: "#8B35FF",
                  },
                  {
                    label: "Novos este mês",
                    value: clientesNovosMes,
                    icon: <UserPlus size={20} />,
                    color: "#00AAFF",
                  },
                  {
                    label: "Clientes recorrentes",
                    value: Math.max(0, clientes.length - clientesNovosMes),
                    icon: <Repeat size={20} />,
                    color: "#38BDF8",
                  },
                ]}
              />

              <InfoListCard
                title="Contratos"
                actionHref="/contratos"
                rows={[
                  {
                    label: "Pendentes",
                    value: contratosResumo.pendentes,
                    icon: <Clock size={20} />,
                    color: "#F59E0B",
                  },
                  {
                    label: "Assinados",
                    value: contratosResumo.assinados,
                    icon: <CheckCircle2 size={20} />,
                    color: "#37E884",
                  },
                  {
                    label: "Cancelados / vencidos",
                    value: contratosResumo.vencidos,
                    icon: <XCircle size={20} />,
                    color: "#FF5B8A",
                  },
                ]}
              />

              <GibaInsights
                ticketMedio={ticketMedio}
                totalClientes={clientes.length}
                totalEventos={eventos.length}
                saldo={resumo.saldo}
              />
            </section>
          </div>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

const pageStyle: React.CSSProperties = {
  color: "#FFFFFF",
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#94A3B8",
  fontSize: "15px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const iconButtonStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const dateButtonStyle: React.CSSProperties = {
  minHeight: "42px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "0 14px",
  textTransform: "capitalize",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "22px",
  marginBottom: "24px",
};

const bottomGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "22px",
};

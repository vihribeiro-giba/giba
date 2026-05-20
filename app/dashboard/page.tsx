"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  UserRound,
  MapPin,
  Clock,
} from "lucide-react";
import {
  getEventStatus,
  getEventStatusColor,
  getEventStatusLabel,
} from "../../lib/eventStatus";

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
};

export default function DashboardPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);

  async function carregarDados() {
    const eventosRes = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    const clientesRes = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    const financeiroRes = await supabase.from("finance").select("*");

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

  const percentualEntradas = useMemo(() => {
    const total = resumo.entradas + resumo.saidas;
    if (total === 0) return 0;
    return Math.round((resumo.entradas / total) * 100);
  }, [resumo]);

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "36px", marginBottom: "6px" }}>
            Dashboard GIBA
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
            Visão geral do sistema.
          </p>

          <div style={topCardsGrid}>
            <CardTop
              icon={<CalendarDays size={28} />}
              titulo="Eventos"
              valor={eventos.length}
              detalhe="Cadastrados"
              cor="#8b35ff"
            />

            <CardTop
              icon={<Users size={30} />}
              titulo="Clientes"
              valor={clientes.length}
              detalhe="Cadastrados"
              cor="#6d5cff"
            />

            <CardTop
              icon={<DollarSign size={30} />}
              titulo="Entradas"
              valor={`R$ ${resumo.entradas.toFixed(2)}`}
              detalhe="Financeiro real"
              cor="#37e884"
            />

            <CardTop
              icon={<TrendingUp size={30} />}
              titulo="Saldo"
              valor={`R$ ${resumo.saldo.toFixed(2)}`}
              detalhe="Entradas - Saídas"
              cor={resumo.saldo >= 0 ? "#38bdf8" : "#ff5b8a"}
            />
          </div>

          <div style={middleGrid}>
            <section style={panelStyle}>
              <div style={panelHeader}>
                <h2 style={panelTitle}>Próximos Eventos</h2>
              </div>

              <div style={{ marginTop: "20px" }}>
                {eventos
 .filter(
  (evento) =>
    getEventStatus(evento.event_date) !== "realizado"
)
 .sort(
    (a, b) =>
      new Date(a.event_date).getTime() -
      new Date(b.event_date).getTime()
  )
  .slice(0, 3)
  .map((evento) => (
                  <div key={evento.id} style={eventItemStyle}>
                    <div>
                      <strong>
                        {evento.event_type || "Evento"} -{" "}
                        {evento.client_name || "Contratante não informado"}
                      </strong>

                      <p style={mutedText}>
                        <Clock size={14} /> {evento.event_date}
                        {evento.event_time ? ` • ${evento.event_time}` : ""}
                      </p>

                      <p style={mutedText}>
                        <MapPin size={14} />{" "}
                        {evento.location || "Local não informado"}
                      </p>
                    </div>

                    {(() => {
  const status = getEventStatus(evento.event_date);

  return (
    <span
      style={{
        ...statusBadge(status),
        background: getEventStatusColor(status),
      }}
    >
      {getEventStatusLabel(status)}
    </span>
  );
})()}
                  </div>
                ))}

                {eventos.length === 0 && (
                  <p style={mutedText}>Nenhum evento cadastrado.</p>
                )}
              </div>
            </section>

            <section style={panelStyle}>
              <div style={panelHeader}>
                <h2 style={panelTitle}>Clientes Recentes</h2>
              </div>

              <div style={{ marginTop: "20px" }}>
                {clientes.slice(0, 4).map((cliente) => (
                  <div key={cliente.id} style={clientItemStyle}>
                    <div style={avatarStyle}>
                      <UserRound size={20} />
                    </div>

                    <div>
                      <strong>{cliente.nome}</strong>
                      <p style={mutedText}>
                        {cliente.cpf_cnpj || "Cpf/Cnpj não informado"}
                      </p>
                    </div>
                  </div>
                ))}

                {clientes.length === 0 && (
                  <p style={mutedText}>Nenhum cliente cadastrado.</p>
                )}
              </div>
            </section>
          </div>

          <section style={panelStyle}>
            <div style={panelHeader}>
              <h2 style={panelTitle}>Resumo Financeiro</h2>
            </div>

            <div style={financeGrid}>
              <ResumoItem
                titulo="Entradas"
                valor={resumo.entradas}
                cor="#37e884"
              />
              <ResumoItem
                titulo="Saídas"
                valor={resumo.saidas}
                cor="#ff5b8a"
              />
              <ResumoItem titulo="Saldo" valor={resumo.saldo} cor="#38bdf8" />

              <div style={chartWrapper}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background:
                      resumo.entradas + resumo.saidas === 0
                        ? "rgba(255,255,255,0.08)"
                        : `conic-gradient(#37e884 0 ${percentualEntradas}%, #ff5b8a ${percentualEntradas}% 100%)`,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: "26px",
                      borderRadius: "50%",
                      background: "#07101f",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CardTop({
  icon,
  titulo,
  valor,
  detalhe,
  cor,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string | number;
  detalhe: string;
  cor: string;
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "18px",
          background: `${cor}25`,
          color: cor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "18px",
        }}
      >
        {icon}
      </div>

      <p style={{ color: "#cbd5e1", margin: 0 }}>{titulo}</p>

      <h2 style={{ fontSize: "28px", margin: "8px 0", color: cor }}>
        {valor}
      </h2>

      <small style={{ color: "#94a3b8" }}>{detalhe}</small>
    </div>
  );
}

function ResumoItem({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div>
      <p style={{ color: "#cbd5e1" }}>{titulo}</p>
      <h2 style={{ color: cor, fontSize: "30px" }}>
        R$ {valor.toFixed(2)}
      </h2>
    </div>
  );
}

const topCardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "18px",
  marginBottom: "24px",
};

const middleGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  marginBottom: "24px",
};

const financeGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr 220px",
  gap: "24px",
  alignItems: "center",
  marginTop: "28px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "22px",
  padding: "24px",
  boxShadow: "0 0 30px rgba(0,0,0,0.25)",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
};

const panelHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "20px",
};

const eventItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "16px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "12px",
};

const clientItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "14px",
  padding: "15px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.08)",
  marginBottom: "12px",
};

const avatarStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #8b35ff, #00aaff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mutedText: React.CSSProperties = {
  color: "#94a3b8",
  margin: "6px 0 0",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const chartWrapper: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

function statusBadge(status: string): React.CSSProperties {
  const isConfirmado = status === "Confirmado";
  const isPendente = status === "Pendente";

  return {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "13px",
    whiteSpace: "nowrap",
    color: isConfirmado ? "#60a5fa" : isPendente ? "#ff7aa2" : "#c084fc",
    background: isConfirmado
      ? "rgba(59,130,246,0.18)"
      : isPendente
      ? "rgba(255,91,138,0.18)"
      : "rgba(139,53,255,0.18)",
  };
}
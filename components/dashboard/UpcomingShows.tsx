import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import {
  getEventStatus,
  getEventStatusColor,
  getEventStatusLabel,
} from "../../lib/eventStatus";

type Evento = {
  id: string;
  title?: string;
  event_type?: string;
  client_name?: string;
  location?: string;
  event_date: string;
  event_time?: string;
  status?: string;
  fee?: number;
};

type UpcomingShowsProps = {
  eventos: Evento[];
};

export default function UpcomingShows({ eventos }: UpcomingShowsProps) {
  const proximos = eventos
    .filter((evento) => getEventStatus(evento.event_date) !== "realizado")
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
    .slice(0, 3);

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>Próximos Shows</h2>
        <Link href="/agenda" style={buttonStyle}>
          Ver agenda →
        </Link>
      </div>

      <div style={timelineStyle}>
        <div style={lineStyle} />

        {proximos.map((evento) => {
          const data = new Date(`${evento.event_date}T00:00:00`);
          const dia = String(data.getDate()).padStart(2, "0");
          const mes = data
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", "")
            .toUpperCase();
          const status = getEventStatus(evento.event_date);

          return (
            <div key={evento.id} style={eventRowStyle}>
              <div style={dateBoxStyle}>
                <strong style={{ fontSize: "22px", lineHeight: 1 }}>{dia}</strong>
                <span style={{ fontSize: "11px", color: "#94A3B8" }}>{mes}</span>
              </div>

              <div style={dotStyle} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={eventHeaderStyle}>
                  <div style={{ minWidth: 0 }}>
                    <p style={timeStyle}>
                      <Clock size={13} />
                      {evento.event_time || "Horário não informado"}
                    </p>

                    <strong style={eventTitleStyle}>
                      {evento.event_type || "Show"} - {evento.client_name || evento.title || "Contratante não informado"}
                    </strong>

                    <p style={locationStyle}>
                      <MapPin size={13} />
                      {evento.location || "Local não informado"}
                    </p>
                  </div>

                  <span
                    style={{
                      ...badgeStyle,
                      background: getEventStatusColor(status),
                    }}
                  >
                    {getEventStatusLabel(status)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {proximos.length === 0 && (
          <p style={{ color: "#94A3B8", margin: "18px 0 0" }}>
            Nenhum próximo show cadastrado.
          </p>
        )}
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "24px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "20px",
};

const buttonStyle: React.CSSProperties = {
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "13px",
  padding: "8px 12px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
};

const timelineStyle: React.CSSProperties = {
  position: "relative",
  marginTop: "24px",
};

const lineStyle: React.CSSProperties = {
  position: "absolute",
  left: "73px",
  top: "12px",
  bottom: "12px",
  width: "1px",
  background: "rgba(139,53,255,0.55)",
};

const eventRowStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  gap: "16px",
  marginBottom: "24px",
};

const dateBoxStyle: React.CSSProperties = {
  width: "56px",
  minWidth: "56px",
  height: "64px",
  borderRadius: "16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(139,53,255,0.16)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#FFFFFF",
};

const dotStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 1,
  width: "12px",
  height: "12px",
  minWidth: "12px",
  marginTop: "20px",
  borderRadius: "999px",
  background: "#8B35FF",
  boxShadow: "0 0 0 6px rgba(139,53,255,0.18)",
};

const eventHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "flex-start",
  paddingBottom: "18px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const timeStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: "13px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const eventTitleStyle: React.CSSProperties = {
  display: "block",
  marginTop: "6px",
  color: "#FFFFFF",
  fontSize: "15px",
  lineHeight: 1.35,
};

const locationStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#94A3B8",
  fontSize: "13px",
  lineHeight: 1.45,
  display: "flex",
  alignItems: "flex-start",
  gap: "6px",
};

const badgeStyle: React.CSSProperties = {
  borderRadius: "999px",
  padding: "7px 10px",
  color: "#FFFFFF",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

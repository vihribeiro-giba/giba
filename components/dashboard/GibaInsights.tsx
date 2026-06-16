import { BarChart3, Users, DollarSign, ShieldCheck, Sparkles } from "lucide-react";

type GibaInsightsProps = {
  melhorMes?: string;
  ticketMedio: number;
  totalClientes: number;
  totalEventos: number;
  saldo: number;
};

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function GibaInsights({
  melhorMes = "este mês",
  ticketMedio,
  totalClientes,
  totalEventos,
  saldo,
}: GibaInsightsProps) {
  const insights = [
    {
      icon: <BarChart3 size={18} />,
      color: "#8B35FF",
      text: `${melhorMes} aparece como um dos períodos mais importantes da sua operação.`,
    },
    {
      icon: <Users size={18} />,
      color: "#00AAFF",
      text: `Você possui ${totalClientes} clientes cadastrados na base da GIBA.`,
    },
    {
      icon: <DollarSign size={18} />,
      color: "#37E884",
      text: `Seu ticket médio estimado por evento é de ${moeda(ticketMedio)}.`,
    },
    {
      icon: <ShieldCheck size={18} />,
      color: saldo >= 0 ? "#38BDF8" : "#FF5B8A",
      text:
        saldo >= 0
          ? `Sua operação está positiva com saldo atual de ${moeda(saldo)}. Continue assim!`
          : `Atenção: seu saldo atual está negativo em ${moeda(Math.abs(saldo))}.`,
    },
  ];

  return (
    <section style={cardStyle}>
      <div style={glowStyle} />

      <div style={headerStyle}>
        <Sparkles size={18} color="#38BDF8" />
        <h2 style={titleStyle}>Inteligência GIBA</h2>
        <span style={badgeStyle}>Beta</span>
      </div>

      <ul style={listStyle}>
        {insights.map((item, index) => (
          <li key={index} style={itemStyle}>
            <span
              style={{
                ...iconStyle,
                color: item.color,
                background: `${item.color}20`,
              }}
            >
              {item.icon}
            </span>
            <p style={textStyle}>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)",
};

const glowStyle: React.CSSProperties = {
  position: "absolute",
  right: "-60px",
  top: "-70px",
  width: "190px",
  height: "190px",
  borderRadius: "999px",
  background: "#8B35FF",
  opacity: 0.18,
  filter: "blur(45px)",
};

const headerStyle: React.CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: "9px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "18px",
};

const badgeStyle: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
  textTransform: "uppercase",
};

const listStyle: React.CSSProperties = {
  position: "relative",
  listStyle: "none",
  padding: 0,
  margin: "22px 0 0",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
};

const iconStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  minWidth: "38px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: "#CBD5E1",
  fontSize: "14px",
  lineHeight: 1.5,
};

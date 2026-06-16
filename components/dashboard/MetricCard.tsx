import React from "react";

type MetricCardProps = {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  detail: string;
  color: string;
  positive?: boolean;
};

export default function MetricCard({
  icon,
  title,
  value,
  detail,
  color,
  positive = true,
}: MetricCardProps) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          position: "absolute",
          right: "-45px",
          top: "-55px",
          width: "160px",
          height: "160px",
          borderRadius: "999px",
          background: color,
          opacity: 0.16,
          filter: "blur(35px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "18px",
          bottom: "10px",
          color,
          opacity: 0.08,
          transform: "scale(3.4)",
          pointerEvents: "none",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          width: "52px",
          height: "52px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${color}22`,
          color,
          marginBottom: "18px",
        }}
      >
        {icon}
      </div>

      <p style={labelStyle}>{title}</p>
      <h2 style={valueStyle}>{value}</h2>

      <p
        style={{
          ...detailStyle,
          color: positive ? "#37E884" : "#FF5B8A",
        }}
      >
        {positive ? "↗" : "↘"} {detail}
      </p>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  minHeight: "178px",
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)",
};

const labelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: "14px",
};

const valueStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#FFFFFF",
  fontSize: "30px",
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: "-0.03em",
};

const detailStyle: React.CSSProperties = {
  margin: "14px 0 0",
  fontSize: "13px",
  fontWeight: 700,
};

import type React from "react";

type ResumoCardProps = {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number | string;
  detail: string;
};

export default function ResumoCard({
  icon,
  color,
  label,
  value,
  detail,
}: ResumoCardProps) {
  return (
    <div style={resumoCardStyle}>
      <div
        style={{
          ...resumoIconStyle,
          background: `${color}22`,
          color,
          boxShadow: `0 12px 28px ${color}26`,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={resumoLabelStyle}>{label}</p>
        <p style={resumoValueStyle}>{value}</p>
        <p style={resumoDetailStyle}>{detail}</p>
      </div>
    </div>
  );
}

const resumoCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: 18,
  borderRadius: 20,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
};

const resumoIconStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  minWidth: 48,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const resumoLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: 12.5,
  fontWeight: 600,
};

const resumoValueStyle: React.CSSProperties = {
  margin: "4px 0 2px",
  color: "#FFFFFF",
  fontSize: 26,
  fontWeight: 900,
  lineHeight: 1,
  letterSpacing: "-0.02em",
};

const resumoDetailStyle: React.CSSProperties = {
  margin: 0,
  color: "#6B7280",
  fontSize: 11.5,
};

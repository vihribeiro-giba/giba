import Link from "next/link";
import React from "react";

type Row = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
};

type InfoListCardProps = {
  title: string;
  rows: Row[];
  actionLabel?: string;
  actionHref?: string;
};

export default function InfoListCard({
  title,
  rows,
  actionLabel = "Ver todos",
  actionHref = "#",
}: InfoListCardProps) {
  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>

        <Link href={actionHref} style={buttonStyle}>
          {actionLabel} →
        </Link>
      </div>

      <div style={{ marginTop: "18px" }}>
        {rows.map((row) => (
          <div key={row.label} style={rowStyle}>
            <div>
              <p style={rowLabelStyle}>{row.label}</p>
              <strong style={rowValueStyle}>{row.value}</strong>
            </div>

            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: row.color,
                background: `${row.color}20`,
              }}
            >
              {row.icon}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  padding: "22px",
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
  fontSize: "18px",
  color: "#FFFFFF",
};

const buttonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#FFFFFF",
  borderRadius: "12px",
  padding: "8px 11px",
  fontSize: "12px",
  cursor: "pointer",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  padding: "16px 0",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const rowLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: "14px",
};

const rowValueStyle: React.CSSProperties = {
  display: "block",
  marginTop: "5px",
  color: "#FFFFFF",
  fontSize: "20px",
};
"use client";

import Link from "next/link";
import { CalendarPlus, UserPlus, Plus, FileText } from "lucide-react";

export default function QuickActions() {
  return (
    <div style={wrapperStyle}>
      <Link href="/agenda" style={primaryButtonStyle}>
        <CalendarPlus size={18} />
        Novo Evento
      </Link>

      <ActionButton href="/clientes" label="Novo Cliente" icon={<UserPlus size={18} />} />
      <ActionButton href="/financeiro" label="Nova Receita" icon={<Plus size={18} />} />
      <ActionButton href="/contratos" label="Novo Contrato" icon={<FileText size={18} />} />
    </div>
  );
}

function ActionButton({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} style={secondaryButtonStyle}>
      {icon}
      {label}
    </Link>
  );
}

const wrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "22px",
};

const baseButton: React.CSSProperties = {
  minHeight: "44px",
  padding: "0 18px",
  borderRadius: "14px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  color: "#FFFFFF",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const primaryButtonStyle: React.CSSProperties = {
  ...baseButton,
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 16px 35px rgba(139,53,255,0.28)",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButton,
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
};

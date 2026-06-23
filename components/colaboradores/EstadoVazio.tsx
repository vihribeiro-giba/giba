import type React from "react";
import { Users } from "lucide-react";

type EstadoVazioProps = {
  titulo: string;
  texto: string;
};

export default function EstadoVazio({ titulo, texto }: EstadoVazioProps) {
  return (
    <div style={estadoVazioStyle}>
      <div style={estadoVazioIconStyle}>
        <Users size={26} />
      </div>
      <p style={{ margin: "0 0 4px", fontWeight: 800, color: "#FFFFFF" }}>{titulo}</p>
      <p style={{ margin: 0, color: "#94A3B8", fontSize: 13 }}>{texto}</p>
    </div>
  );
}

const estadoVazioStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "40px 20px",
  borderRadius: 18,
  background: "rgba(0,0,0,0.20)",
  border: "1px dashed rgba(255,255,255,0.12)",
};

const estadoVazioIconStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  margin: "0 auto 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(139,53,255,0.14)",
  color: "#C4A0FF",
};

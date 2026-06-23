import type React from "react";
import { Search, X } from "lucide-react";
import type { FiltroStatus } from "./types";

const filtros: { id: FiltroStatus; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "ativos", label: "Ativos" },
  { id: "inativos", label: "Inativos" },
  { id: "sem-acesso", label: "Sem acesso" },
];

type ColaboradorFiltersProps = {
  busca: string;
  setBusca: (v: string) => void;
  filtro: FiltroStatus;
  setFiltro: (v: FiltroStatus) => void;
};

export default function ColaboradorFilters({
  busca,
  setBusca,
  filtro,
  setFiltro,
}: ColaboradorFiltersProps) {
  return (
    <>
      {/* Busca */}
      <div style={buscaWrapperStyle}>
        <Search size={18} color="#94A3B8" />
        <input
          className="col-input"
          style={buscaInputStyle}
          placeholder="Buscar por nome, função, celular ou e-mail..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        {busca && (
          <button
            type="button"
            onClick={() => setBusca("")}
            style={buscaLimparStyle}
            aria-label="Limpar busca"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="col-scroll" style={filtrosWrapperStyle}>
        {filtros.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            style={filtro === f.id ? filtroAtivoStyle : filtroInativoStyle}
          >
            {f.label}
          </button>
        ))}
      </div>
    </>
  );
}

const buscaWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 18,
  padding: "0 14px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.26)",
};

const buscaInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "13px 0",
  border: "none",
  background: "transparent",
  color: "#fff",
  fontSize: 14.5,
  outline: "none",
};

const buscaLimparStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const filtrosWrapperStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 14,
  overflowX: "auto",
  paddingBottom: 4,
};

const filtroBaseStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "0.2s ease",
};

const filtroAtivoStyle: React.CSSProperties = {
  ...filtroBaseStyle,
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#FFFFFF",
  border: "1px solid rgba(255,255,255,0.20)",
  boxShadow: "0 10px 22px rgba(139,53,255,0.24)",
};

const filtroInativoStyle: React.CSSProperties = {
  ...filtroBaseStyle,
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  border: "1px solid rgba(255,255,255,0.10)",
};

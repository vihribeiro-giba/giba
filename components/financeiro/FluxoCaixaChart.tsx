"use client"

import { useMemo } from "react"

type Ponto = {
  label: string
  entradas: number
  saidas: number
}

function formatarK(valor: number) {
  if (Math.abs(valor) >= 1000) return `${Math.round(valor / 1000)}k`
  return String(Math.round(valor))
}

export default function FluxoCaixaChart({ dados }: { dados: Ponto[] }) {
  const maxValor = useMemo(() => {
    const todos = dados.flatMap((d) => [d.entradas, d.saidas])
    const max = Math.max(...todos, 1)
    return max
  }, [dados])

  const linhas = 4
  const marcadores = Array.from({ length: linhas + 1 }, (_, i) =>
    Math.round((maxValor / linhas) * (linhas - i)),
  )

  return (
    <div style={wrapStyle}>
      <div style={legendStyle}>
        <span style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#37E884" }} />
          Entradas
        </span>
        <span style={legendItemStyle}>
          <span style={{ ...legendDotStyle, background: "#FF5B8A" }} />
          Saídas
        </span>
      </div>

      <div style={chartAreaStyle}>
        <div style={yAxisStyle}>
          {marcadores.map((m, i) => (
            <span key={i} style={yLabelStyle}>
              {formatarK(m)}
            </span>
          ))}
        </div>

        <div style={barsAreaStyle}>
          <div style={gridLinesStyle}>
            {marcadores.map((_, i) => (
              <div key={i} style={gridLineStyle} />
            ))}
          </div>

          <div style={groupsStyle}>
            {dados.map((d, i) => (
              <div key={i} style={groupStyle}>
                <div style={barPairStyle}>
                  <div
                    title={`Entradas: ${d.entradas}`}
                    style={{
                      ...barStyle,
                      height: `${(d.entradas / maxValor) * 100}%`,
                      background: "linear-gradient(180deg, #37E884, #18B866)",
                    }}
                  />
                  <div
                    title={`Saídas: ${d.saidas}`}
                    style={{
                      ...barStyle,
                      height: `${(d.saidas / maxValor) * 100}%`,
                      background: "linear-gradient(180deg, #FF7BA3, #FF5B8A)",
                    }}
                  />
                </div>
                <span style={xLabelStyle}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = { width: "100%" }

const legendStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "18px",
  marginBottom: "14px",
}

const legendItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  color: "#CBD5E1",
  fontWeight: 600,
}

const legendDotStyle: React.CSSProperties = {
  width: "11px",
  height: "11px",
  borderRadius: "4px",
  display: "inline-block",
}

const chartAreaStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  height: "210px",
}

const yAxisStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  paddingBottom: "22px",
}

const yLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#64748B",
  fontWeight: 600,
}

const barsAreaStyle: React.CSSProperties = {
  position: "relative",
  flex: 1,
}

const gridLinesStyle: React.CSSProperties = {
  position: "absolute",
  inset: "0 0 22px 0",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}

const gridLineStyle: React.CSSProperties = {
  height: "1px",
  background: "rgba(255,255,255,0.06)",
}

const groupsStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-around",
  gap: "8px",
}

const groupStyle: React.CSSProperties = {
  flex: 1,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-end",
}

const barPairStyle: React.CSSProperties = {
  flex: 1,
  width: "100%",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "5px",
  paddingBottom: "6px",
}

const barStyle: React.CSSProperties = {
  width: "26%",
  maxWidth: "20px",
  minHeight: "3px",
  borderRadius: "6px 6px 3px 3px",
  transition: "height 0.4s ease",
}

const xLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#94A3B8",
  fontWeight: 600,
  height: "16px",
}

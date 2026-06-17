"use client"

type Fatia = {
  label: string
  valor: number
  cor: string
}

export default function DespesasDonut({ dados }: { dados: Fatia[] }) {
  const total = dados.reduce((acc, d) => acc + d.valor, 0)

  // Monta o conic-gradient acumulando as fatias.
  let acumulado = 0
  const segmentos = dados.map((d) => {
    const inicio = total > 0 ? (acumulado / total) * 100 : 0
    acumulado += d.valor
    const fim = total > 0 ? (acumulado / total) * 100 : 0
    return `${d.cor} ${inicio}% ${fim}%`
  })

  const gradiente =
    total > 0
      ? `conic-gradient(${segmentos.join(", ")})`
      : "conic-gradient(rgba(255,255,255,0.08) 0% 100%)"

  return (
    <div style={wrapStyle}>
      <div style={donutWrapStyle}>
        <div style={{ ...donutStyle, background: gradiente }}>
          <div style={donutHoleStyle}>
            <span style={holeLabelStyle}>Total</span>
            <span style={holeValueStyle}>
              {total.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
        </div>
      </div>

      <div style={legendStyle}>
        {dados.map((d) => {
          const pct = total > 0 ? Math.round((d.valor / total) * 100) : 0
          return (
            <div key={d.label} style={legendItemStyle}>
              <span style={legendLeftStyle}>
                <span style={{ ...dotStyle, background: d.cor }} />
                <span style={legendLabelStyle}>{d.label}</span>
              </span>
              <span style={legendPctStyle}>{pct}%</span>
            </div>
          )
        })}
        {dados.length === 0 && (
          <p style={vazioStyle}>Nenhuma despesa registrada ainda.</p>
        )}
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "22px",
  flexWrap: "wrap",
}

const donutWrapStyle: React.CSSProperties = {
  flexShrink: 0,
}

const donutStyle: React.CSSProperties = {
  width: "168px",
  height: "168px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 20px 45px rgba(0,0,0,0.30)",
}

const donutHoleStyle: React.CSSProperties = {
  width: "104px",
  height: "104px",
  borderRadius: "50%",
  background: "#0A0F1C",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "2px",
}

const holeLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#94A3B8",
  fontWeight: 600,
}

const holeValueStyle: React.CSSProperties = {
  fontSize: "15px",
  color: "#FFFFFF",
  fontWeight: 800,
}

const legendStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "160px",
  display: "flex",
  flexDirection: "column",
  gap: "11px",
}

const legendItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
}

const legendLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
}

const dotStyle: React.CSSProperties = {
  width: "11px",
  height: "11px",
  borderRadius: "4px",
  display: "inline-block",
}

const legendLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#CBD5E1",
  fontWeight: 600,
}

const legendPctStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#FFFFFF",
  fontWeight: 800,
}

const vazioStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#64748B",
}

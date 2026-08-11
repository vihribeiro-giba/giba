"use client";

import { useMemo, useState } from "react";
import GibaSelect from "../GibaSelect";

type Financeiro = {
  id: string;
  type: string;
  amount: number;
  created_at?: string;
};

type RevenueChartProps = {
  financeiro: Financeiro[];
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RevenueChart({ financeiro }: RevenueChartProps) {
  const [period, setPeriod] = useState<6 | 12>(12);
  const [hovered, setHovered] = useState<number | null>(null);

  const data = useMemo(() => {
    const now = new Date();

    return Array.from({ length: period }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (period - 1) + index, 1);
      const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const monthNumber = date.getMonth();
      const year = date.getFullYear();

      const value = financeiro.reduce((acc, item) => {
        if (item.type !== "Entrada") return acc;

        const itemDate = item.created_at ? new Date(item.created_at) : now;
        const sameMonth = itemDate.getMonth() === monthNumber && itemDate.getFullYear() === year;

        return sameMonth ? acc + Number(item.amount || 0) : acc;
      }, 0);

      return {
        label: month.charAt(0).toUpperCase() + month.slice(1),
        value,
        highlight: index === period - 1,
      };
    });
  }, [financeiro, period]);

  const maxValue = Math.max(...data.map((item) => item.value), 1000);
  const activeIndex = hovered ?? data.length - 1;

  return (
    <section style={cardStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Faturamento</h2>
          <p style={subtitleStyle}>últimos {period} meses</p>
        </div>

        <GibaSelect
          ariaLabel="Período do faturamento"
          value={period}
          onChange={(nextPeriod) => setPeriod(Number(nextPeriod) as 6 | 12)}
          options={[
            { value: "6", label: "Últimos 6 meses" },
            { value: "12", label: "Últimos 12 meses" },
          ]}
          className="w-[178px]"
          align="right"
          triggerStyle={buttonStyle}
        />
      </div>

      <div style={chartAreaStyle}>
        <div style={axisStyle}>
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency(maxValue / 2)}</span>
          <span>R$ 0</span>
        </div>

        <div style={barsWrapperStyle}>
          {data.map((item, index) => {
            const height = Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 2);
            const isActive = activeIndex === index;

            return (
              <div
                key={`${item.label}-${index}`}
                style={barColumnStyle}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                {isActive && (
                  <div style={tooltipStyle}>
                    <small>{item.label}</small>
                    <strong>{formatCurrency(item.value)}</strong>
                  </div>
                )}

                <div
                  style={{
                    ...barStyle,
                    height: `${height}%`,
                    background: item.highlight
                      ? "linear-gradient(180deg, #38BDF8, #00AAFF)"
                      : "linear-gradient(180deg, #8B35FF, rgba(139,53,255,0.58))",
                    boxShadow: item.highlight
                      ? "0 0 24px rgba(0,170,255,0.30)"
                      : "none",
                  }}
                />

                <span
                  style={{
                    ...monthStyle,
                    color: item.highlight ? "#38BDF8" : "#94A3B8",
                    fontWeight: item.highlight ? 800 : 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
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

const subtitleStyle: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#94A3B8",
  fontSize: "13px",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 42,
  fontSize: "12px",
};

const chartAreaStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  marginTop: "32px",
  minHeight: "270px",
};

const axisStyle: React.CSSProperties = {
  width: "60px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  color: "#94A3B8",
  fontSize: "10px",
  paddingBottom: "32px",
};

const barsWrapperStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "flex-end",
  gap: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  borderLeft: "1px solid rgba(255,255,255,0.06)",
  padding: "0 4px 0 12px",
};

const barColumnStyle: React.CSSProperties = {
  position: "relative",
  flex: 1,
  height: "230px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: "10px",
};

const barStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "10px",
  borderRadius: "8px 8px 0 0",
  transition: "0.25s ease",
};

const monthStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "-30px",
  fontSize: "11px",
};

const tooltipStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "calc(100% + 12px)",
  zIndex: 3,
  minWidth: "118px",
  padding: "10px 12px",
  borderRadius: "12px",
  background: "#070B16",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#FFFFFF",
  boxShadow: "0 18px 35px rgba(0,0,0,0.35)",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  textAlign: "center",
};

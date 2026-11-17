"use client";

import { BadgeDollarSign } from "lucide-react";

export default function ResultadoFinal({
  custoTotal,
  lucro,
  lucroPercentual,
  valorVenda,
}: {
  custoTotal: string;
  lucro: string;
  lucroPercentual: string;
  valorVenda: string;
}) {
  return (
    <section className="giba-card rounded-[24px] border border-white/[0.08] p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-sky-400/20 bg-sky-500/10 text-sky-300">
          <BadgeDollarSign size={18} />
        </div>
        <h2 className="text-lg font-black tracking-[-0.02em] text-white">Resultado Final</h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Metric label="Custo Total" value={custoTotal} accent="slate" />
        <Metric label="Lucro" value={lucro} accent="emerald" />
        <Metric label="Lucro Percentual" value={lucroPercentual} accent="violet" />
        <Metric label="Valor de Venda" value={valorVenda} accent="sky" />
      </div>
    </section>
  );
}

const metricStyles = {
  slate: "border-white/[0.07] bg-white/[0.025] text-white",
  emerald: "border-white/[0.07] bg-white/[0.025] text-emerald-300",
  violet: "border-white/[0.07] bg-white/[0.025] text-violet-300",
  sky: "border-white/[0.07] bg-white/[0.025] text-sky-300",
} as const;

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: keyof typeof metricStyles;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border px-3.5 py-3 ${metricStyles[accent]}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <strong className="mt-1.5 block break-words text-base font-black tracking-[-0.02em] sm:text-lg">
        {value}
      </strong>
    </div>
  );
}

"use client";

import { BadgeDollarSign } from "lucide-react";

export default function ResultadoFinal({
  custoTotal,
  lucro,
  precoIdeal,
  precoMinimo,
  precoSugerido,
  lucroPercentual,
}: {
  custoTotal: string;
  lucro: string;
  precoIdeal: string;
  precoMinimo: string;
  precoSugerido: string;
  lucroPercentual: string;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-[0_18px_44px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-sky-400/20 bg-sky-500/15 text-sky-200">
          <BadgeDollarSign size={22} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-white">Resultado Final</h2>
          <p className="text-sm text-slate-400">Resumo financeiro principal da simulação.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Custo Total" value={custoTotal} />
        <Metric label="Lucro" value={lucro} />
        <Metric label="Preço Ideal" value={precoIdeal} highlight />
        <Metric label="Preço Mínimo" value={precoMinimo} />
        <Metric label="Preço Sugerido" value={precoSugerido} />
        <Metric label="Lucro Percentual" value={lucroPercentual} />
      </div>
    </section>
  );
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={highlight ? "rounded-2xl border border-sky-300/25 bg-sky-400/10 p-4" : "rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4"}>
      <p className="text-xs font-black uppercase text-slate-500">{label}</p>
      <strong className={highlight ? "mt-2 block break-words text-2xl font-black text-white" : "mt-2 block break-words text-xl font-black text-white"}>
        {value}
      </strong>
    </div>
  );
}

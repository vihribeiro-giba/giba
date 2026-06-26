"use client";

import ActionsBar from "./ActionsBar";

export default function ResumoSimulacao({
  custos,
  equipe,
  equipamentos,
  lucro,
  precoFinal,
  dataFinanceiro,
  setDataFinanceiro,
  onSalvar,
  onExportar,
  onEnviarFinanceiro,
  onLimpar,
}: {
  custos: string;
  equipe: string;
  equipamentos: string;
  lucro: string;
  precoFinal: string;
  dataFinanceiro: string;
  setDataFinanceiro: (valor: string) => void;
  onSalvar: () => void;
  onExportar: () => void;
  onEnviarFinanceiro: () => void;
  onLimpar: () => void;
}) {
  return (
    <aside className="grid gap-4 rounded-3xl border border-white/[0.09] bg-white/[0.04] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-black tracking-[-0.02em] text-white">Resumo da Simulação</h2>
        <p className="mt-1 text-sm text-slate-400">Conferência rápida dos valores.</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <Line label="Custos" value={custos} />
        <Line label="Equipe" value={equipe} />
        <Line label="Equipamentos" value={equipamentos} />
        <Line label="Lucro" value={lucro} />
        <Line label="Preço Final" value={precoFinal} strong />
      </div>

      <label className="grid gap-2">
        <span className="text-xs font-black text-slate-300">Data no Financeiro</span>
        <input
          type="date"
          value={dataFinanceiro}
          onChange={(event) => setDataFinanceiro(event.target.value)}
          className="h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none"
        />
      </label>

      <ActionsBar onSalvar={onSalvar} onExportar={onExportar} onEnviarFinanceiro={onEnviarFinanceiro} onLimpar={onLimpar} compact />
    </aside>
  );
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/25 px-3 py-2.5">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <strong className={strong ? "text-base font-black text-white" : "text-sm font-black text-white"}>{value}</strong>
    </div>
  );
}

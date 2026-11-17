"use client";

import { Calculator, FolderOpen } from "lucide-react";

export default function HeaderCalculadora({
  onNovaSimulacao,
  onAbrirSimulacoes,
  quantidadeSimulacoes,
}: {
  onNovaSimulacao: () => void;
  onAbrirSimulacoes: () => void;
  quantidadeSimulacoes: number;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_14px_30px_rgba(139,53,255,0.30)]">
          <Calculator size={24} />
        </div>
        <div>
          <h1 className="text-[28px] font-black leading-tight tracking-[-0.5px] text-white">Calculadora de Show</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Simule todos os custos do evento e descubra o valor ideal de venda.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onAbrirSimulacoes}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[15px] border border-white/10 bg-white/[0.045] px-4 text-sm font-bold text-slate-200 transition hover:border-sky-400/30 hover:bg-white/[0.075]"
        >
          <FolderOpen size={17} />
          Simulações Salvas
          <span className="grid min-w-5 place-items-center rounded-full bg-sky-400/10 px-1.5 py-0.5 text-[11px] font-black text-sky-300">
            {quantidadeSimulacoes}
          </span>
        </button>

        <button
          type="button"
          onClick={onNovaSimulacao}
          className="inline-flex h-11 items-center justify-center rounded-[15px] bg-gradient-to-r from-violet-600 to-sky-500 px-5 text-sm font-black text-white shadow-[0_16px_30px_rgba(139,53,255,0.2)] transition hover:-translate-y-0.5 hover:opacity-95"
        >
          Nova Simulação
        </button>
      </div>
    </header>
  );
}

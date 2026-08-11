"use client";

import { Calculator } from "lucide-react";

export default function HeaderCalculadora({ onNovaSimulacao }: { onNovaSimulacao: () => void }) {
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

      <button
        type="button"
        onClick={onNovaSimulacao}
        className="inline-flex h-11 items-center justify-center rounded-[15px] bg-gradient-to-r from-violet-600 to-sky-500 px-5 text-sm font-black text-white shadow-[0_16px_30px_rgba(139,53,255,0.2)] transition hover:-translate-y-0.5 hover:opacity-95"
      >
        Nova Simulação
      </button>
    </header>
  );
}

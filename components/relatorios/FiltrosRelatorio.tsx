"use client";

import { Filter, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { FiltrosRelatorioState } from "./types";

type Props = {
  filtros: FiltrosRelatorioState;
  onChange: (campo: keyof FiltrosRelatorioState, valor: string) => void;
  onApply: () => void;
  onClear: () => void;
};

const periodos = [
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "7 dias" },
  { value: "30dias", label: "30 dias" },
  { value: "90dias", label: "90 dias" },
  { value: "ano", label: "Este ano" },
  { value: "personalizado", label: "Personalizado" },
];

export default function FiltrosRelatorio({ filtros, onChange, onApply, onClear }: Props) {
  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/15 text-violet-200">
          <SlidersHorizontal size={18} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-white">Filtros</h2>
          <p className="text-sm text-slate-400">Refine o painel por período de datas.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {periodos.map((periodo) => {
          const ativo = filtros.periodo === periodo.value;

          return (
            <button
              key={periodo.value}
              type="button"
              onClick={() => onChange("periodo", periodo.value)}
              className={`h-10 rounded-full px-4 text-sm font-black transition hover:-translate-y-0.5 ${
                ativo
                  ? "bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-[0_16px_32px_rgba(139,53,255,0.24)]"
                  : "border border-white/10 bg-white/[0.06] text-slate-300"
              }`}
            >
              {periodo.label}
            </button>
          );
        })}
      </div>

      {filtros.periodo === "personalizado" && (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Data inicial" type="date" value={filtros.dataInicial} onChange={(value) => onChange("dataInicial", value)} />
          <Input label="Data final" type="date" value={filtros.dataFinal} onChange={(value) => onChange("dataFinal", value)} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-sky-500 px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-95"
        >
          <Filter size={16} />
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-95"
        >
          <RotateCcw size={16} />
          Limpar filtros
        </button>
      </div>
    </section>
  );
}

function Input({
  label,
  value,
  type,
  onChange,
}: {
  label: string;
  value: string;
  type: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-300">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none"
      />
    </label>
  );
}

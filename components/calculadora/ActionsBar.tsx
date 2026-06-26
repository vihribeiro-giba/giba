"use client";

import { FileDown, RotateCcw, Save, Send } from "lucide-react";

export default function ActionsBar({
  onSalvar,
  onExportar,
  onEnviarFinanceiro,
  onLimpar,
  compact = false,
}: {
  onSalvar: () => void;
  onExportar: () => void;
  onEnviarFinanceiro?: () => void;
  onLimpar: () => void;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-10 px-3 text-xs" : "h-12 px-4 text-sm";

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onSalvar} className={`${sizeClass} inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-sky-500 font-black text-white transition hover:-translate-y-0.5`}>
        <Save size={16} />
        Salvar
      </button>
      <button type="button" onClick={onExportar} className={`${sizeClass} inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.07] font-black text-white transition hover:-translate-y-0.5`}>
        <FileDown size={16} />
        PDF
      </button>
      {onEnviarFinanceiro && (
        <button type="button" onClick={onEnviarFinanceiro} className={`${sizeClass} inline-flex items-center justify-center gap-2 rounded-[14px] border border-emerald-400/25 bg-emerald-500/15 font-black text-emerald-200 transition hover:-translate-y-0.5`}>
          <Send size={16} />
          Financeiro
        </button>
      )}
      <button type="button" onClick={onLimpar} className={`${sizeClass} inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.07] font-black text-white transition hover:-translate-y-0.5`}>
        <RotateCcw size={16} />
        Limpar
      </button>
    </div>
  );
}

"use client";

import { FolderOpen, Trash2 } from "lucide-react";
import SectionShell from "./SectionShell";
import type { OrcamentoSalvoCalculadora } from "./types";

export default function OrcamentosSalvos({
  orcamentos,
  formatarDataHora,
  onCarregar,
  onExcluir,
}: {
  orcamentos: OrcamentoSalvoCalculadora[];
  formatarDataHora: (data?: string) => string;
  onCarregar: (orcamento: any) => void;
  onExcluir: (id: string) => void;
}) {
  if (orcamentos.length === 0) return null;

  return (
    <SectionShell title="Simulações Salvas" subtitle="Continue uma simulação anterior." icon={<FolderOpen size={18} />}>
      <div className="grid max-h-[360px] gap-3 overflow-y-auto pr-1">
        {orcamentos.map((orcamento) => (
          <article key={orcamento.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong className="text-white">{orcamento.nome}</strong>
              <p className="mt-1 text-sm text-slate-400">Salvo em {formatarDataHora(orcamento.created_at || orcamento.criadoEm)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCarregar(orcamento)}
                className="inline-flex h-10 items-center justify-center rounded-[14px] bg-gradient-to-r from-violet-600 to-sky-500 px-3 text-xs font-black text-white"
              >
                Carregar
              </button>
              <button
                type="button"
                onClick={() => onExcluir(orcamento.id)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-rose-400/25 bg-rose-500/15 px-3 text-xs font-black text-rose-200"
              >
                <Trash2 size={14} />
                Excluir
              </button>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

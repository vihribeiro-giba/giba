"use client";

import { useEffect } from "react";
import { FolderOpen, Trash2, X } from "lucide-react";
import type { OrcamentoSalvoCalculadora } from "./types";

export default function OrcamentosSalvos({
  aberto,
  orcamentos,
  formatarDataHora,
  onCarregar,
  onExcluir,
  onFechar,
}: {
  aberto: boolean;
  orcamentos: OrcamentoSalvoCalculadora[];
  formatarDataHora: (data?: string) => string;
  onCarregar: (orcamento: OrcamentoSalvoCalculadora) => void;
  onExcluir: (id: string) => void;
  onFechar: () => void;
}) {
  useEffect(() => {
    if (!aberto) return;

    const overflowAnterior = document.body.style.overflow;
    const fecharComEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onFechar();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape);
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onFechar();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-simulacoes-salvas"
        className="flex max-h-[82vh] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0b1628] shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-violet-400/20 bg-violet-500/10 text-violet-300">
              <FolderOpen size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="titulo-simulacoes-salvas" className="truncate text-lg font-black text-white">
                  Simulações Salvas
                </h2>
                <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] font-black text-sky-300">
                  {orcamentos.length}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">Escolha uma simulação para continuar.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar simulações salvas"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-2 overflow-y-auto p-4 sm:p-5">
          {orcamentos.length === 0 ? (
            <div className="grid min-h-36 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-5 text-center">
              <div>
                <p className="font-bold text-slate-200">Nenhuma simulação salva</p>
                <p className="mt-1 text-sm text-slate-500">Suas próximas simulações aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            orcamentos.map((orcamento) => (
              <article
                key={orcamento.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <strong className="block truncate text-sm text-white">{orcamento.nome}</strong>
                  <p className="mt-1 text-xs text-slate-500">
                    Salvo em {formatarDataHora(orcamento.created_at || orcamento.criadoEm)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCarregar(orcamento)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-[12px] border border-sky-400/20 bg-sky-400/10 px-4 text-xs font-black text-sky-200 transition hover:bg-sky-400/15 sm:flex-none"
                  >
                    Carregar
                  </button>
                  <button
                    type="button"
                    onClick={() => onExcluir(orcamento.id)}
                    aria-label={`Excluir ${orcamento.nome}`}
                    title="Excluir simulação"
                    className="grid h-9 w-9 place-items-center rounded-[12px] border border-rose-400/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/15"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

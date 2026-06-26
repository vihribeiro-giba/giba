"use client";

import type { ResumoCardData } from "./types";

export default function ResumoCards({ cards }: { cards: ResumoCardData[] }) {
  return (
    <section className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.titulo}
          className="rounded-3xl border border-white/[0.09] bg-white/[0.04] p-6 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-slate-400">{card.titulo}</p>
              <strong className="mt-2 block break-words text-2xl font-black tracking-[-0.02em] text-white">
                {card.valor}
              </strong>
              <span className="mt-2 block text-xs font-semibold text-slate-500">{card.detalhe}</span>
            </div>
            <div
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border"
              style={{
                color: card.cor,
                backgroundColor: `${card.cor}1F`,
                borderColor: `${card.cor}40`,
              }}
            >
              {card.icon}
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-slate-300">
            {card.comparacao}
          </div>
        </article>
      ))}
    </section>
  );
}

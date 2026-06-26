"use client";

import type { ReactNode } from "react";

export default function SectionShell({
  title,
  subtitle,
  icon,
  total,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  total?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:border-white/[0.14]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/15 text-violet-200">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-xl font-black tracking-[-0.02em] text-white">{title}</h2>
            {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
          </div>
        </div>

        {total && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-2 text-right">
            <span className="block text-xs font-black uppercase text-slate-500">Subtotal</span>
            <strong className="text-lg font-black text-white">{total}</strong>
          </div>
        )}
      </div>

      {children}
    </section>
  );
}

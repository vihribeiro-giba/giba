"use client";

import type { ReactNode } from "react";

export default function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="giba-card rounded-3xl border border-white/[0.09] p-5">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[-0.02em] text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

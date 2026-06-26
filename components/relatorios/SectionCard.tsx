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
    <section className="rounded-3xl border border-white/[0.09] bg-white/[0.04] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[-0.02em] text-white">{title}</h2>
        {subtitle && <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

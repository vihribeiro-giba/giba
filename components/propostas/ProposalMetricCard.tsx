import type { LucideIcon } from "lucide-react";

export default function ProposalMetricCard({ title, value, helper, icon: Icon, accent }: { title: string; value: number; helper: string; icon: LucideIcon; accent: string }) {
  return (
    <article className="relative min-h-40 overflow-hidden rounded-[24px] border border-white/10 bg-white/[.055] p-6">
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg,transparent,${accent},transparent)` }} />
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-black tracking-[.15em] text-slate-400">{title}</p><strong className="mt-4 block text-4xl font-black text-white">{value}</strong><p className="mt-2 text-sm font-semibold text-slate-400">{helper}</p></div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border" style={{ color: accent, borderColor: `${accent}55`, background: `${accent}18` }}><Icon size={22} /></span>
      </div>
    </article>
  );
}

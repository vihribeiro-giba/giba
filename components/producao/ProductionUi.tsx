import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ClipboardCheck, Plus } from "lucide-react";
import { productionStatusColor, productionStatusLabel } from "../../lib/production/constants";
import type { ProductionStatus } from "../../lib/production/types";

export const productionPanelClass = "rounded-[24px] border border-white/10 bg-[#101827]/90 shadow-[0_20px_60px_rgba(0,0,0,.18)]";
export const productionInputClass = "h-12 w-full rounded-2xl border border-white/10 bg-[#071225] px-4 text-sm font-semibold text-white outline-none transition focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60";
export const productionTextareaClass = `${productionInputClass} h-auto min-h-28 py-3 resize-y`;
export const productionPrimaryButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_10px_30px_rgba(37,99,235,.25)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50";
export const productionSecondaryButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-bold text-slate-100 transition hover:border-cyan-400/40 hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50";
export const productionDangerButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50";

export function ProductionHeader({ backHref, eyebrow = "OPERAÇÃO", title, subtitle, actionHref, actionLabel = "Nova produção" }: {
  backHref?: string; eyebrow?: string; title: string; subtitle: string; actionHref?: string; actionLabel?: string;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        {backHref ? (
          <Link href={backHref} className={`${productionSecondaryButtonClass} h-12 w-12 shrink-0 p-0`} aria-label="Voltar"><ArrowLeft size={19} /></Link>
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-400 shadow-[0_12px_35px_rgba(34,211,238,.2)]"><ClipboardCheck size={28} /></div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[.22em] text-cyan-300">{eyebrow}</p>
          <h1 className="truncate text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-slate-400 sm:text-base">{subtitle}</p>
        </div>
      </div>
      {actionHref && <Link href={actionHref} className={productionPrimaryButtonClass}><Plus size={18} /> {actionLabel}</Link>}
    </header>
  );
}
export function ProductionMetric({ label, value, helper, icon: Icon, tone = "violet" }: { label: string; value: number; helper: string; icon: LucideIcon; tone?: "violet" | "cyan" | "amber" | "green" }) {
  const tones = { violet: "text-violet-300 bg-violet-500/15 border-violet-400/25", cyan: "text-cyan-300 bg-cyan-500/15 border-cyan-400/25", amber: "text-amber-300 bg-amber-500/15 border-amber-400/25", green: "text-emerald-300 bg-emerald-500/15 border-emerald-400/25" };
  return (
    <div className={`${productionPanelClass} flex min-h-32 items-start justify-between p-5`}>
      <div><p className="text-xs font-black uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-2 text-3xl font-black text-white">{value}</p><p className="mt-1 text-xs text-slate-500">{helper}</p></div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tones[tone]}`}><Icon size={20} /></span>
    </div>
  );
}

export function ProductionStatusBadge({ status }: { status: ProductionStatus }) {
  const color = productionStatusColor(status);
  return <span className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-black" style={{ color, borderColor: `${color}55`, background: `${color}16` }}>{productionStatusLabel(status)}</span>;
}

export function ProductionProgressBar({ value, compact = false }: { value: number; compact?: boolean }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className={compact ? "min-w-28" : "w-full"}><div className="mb-1 flex items-center justify-between text-[11px] font-bold text-slate-400"><span>Progresso</span><span>{safe}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all" style={{ width: `${safe}%` }} /></div></div>;
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs font-black text-slate-300">{children}</label>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"><ClipboardCheck className="mb-3 text-slate-600" size={30} /><h3 className="font-black text-white">{title}</h3><p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

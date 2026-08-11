import type { LucideIcon } from "lucide-react";
import { Building2, CalendarCheck2, Clock3, TrendingUp } from "lucide-react";

type CrmSummaryCardsProps = {
  total: number;
  active: number;
  overdue: number;
  today: number;
  upcoming: number;
};

type SummaryItem = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone: "violet" | "cyan" | "amber" | "rose";
};

const toneClasses = {
  violet: {
    icon: "border-violet-400/20 bg-violet-500/15 text-violet-200",
    glow: "bg-violet-500/20",
  },
  cyan: {
    icon: "border-cyan-400/20 bg-cyan-400/15 text-cyan-200",
    glow: "bg-cyan-400/20",
  },
  amber: {
    icon: "border-amber-400/20 bg-amber-400/15 text-amber-200",
    glow: "bg-amber-400/20",
  },
  rose: {
    icon: "border-rose-400/20 bg-rose-500/15 text-rose-200",
    glow: "bg-rose-500/20",
  },
};

export default function CrmSummaryCards({
  total,
  active,
  overdue,
  today,
  upcoming,
}: CrmSummaryCardsProps) {
  const items: SummaryItem[] = [
    {
      label: "Prefeituras",
      value: total,
      hint: "carteira cadastrada",
      icon: Building2,
      tone: "violet",
    },
    {
      label: "Oportunidades ativas",
      value: active,
      hint: "em acompanhamento",
      icon: TrendingUp,
      tone: "cyan",
    },
    {
      label: "Follow-ups hoje",
      value: today,
      hint: `${upcoming} nos próximos 30 dias`,
      icon: CalendarCheck2,
      tone: "amber",
    },
    {
      label: "Follow-ups vencidos",
      value: overdue,
      hint: overdue ? "precisam de atenção" : "carteira em dia",
      icon: Clock3,
      tone: "rose",
    },
  ];

  return (
    <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch lg:mt-6">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = toneClasses[item.tone];

        return (
          <article
            key={item.label}
            className="group relative min-h-[172px] overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-white/15 sm:h-full sm:p-6"
          >
            <div className={`pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full blur-3xl ${tone.glow}`} />
            <div className="relative flex h-full items-start justify-between gap-4">
              <div className="flex h-full min-w-0 flex-col">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                  {item.label}
                </p>
                <strong className="mt-4 block text-4xl font-black leading-none tracking-[-0.04em] text-white">
                  {item.value}
                </strong>
                <p className="mt-auto pt-3 text-sm font-semibold text-slate-400">{item.hint}</p>
              </div>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${tone.icon}`}>
                <Icon size={21} />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

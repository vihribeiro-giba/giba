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
  },
  cyan: {
    icon: "border-cyan-400/20 bg-cyan-400/15 text-cyan-200",
  },
  amber: {
    icon: "border-amber-400/20 bg-amber-400/15 text-amber-200",
  },
  rose: {
    icon: "border-rose-400/20 bg-rose-500/15 text-rose-200",
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
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        const tone = toneClasses[item.tone];

        return (
          <article
            key={item.label}
            className="min-h-[134px] rounded-[20px] border border-white/[0.085] bg-white/[0.03] p-5 transition hover:border-white/15 hover:bg-white/[0.045]"
          >
            <div className="flex h-full items-start justify-between gap-4">
              <div className="flex h-full min-w-0 flex-col">
                <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500">
                  {item.label}
                </p>
                <strong className="mt-3 block text-3xl font-black leading-none tracking-[-0.04em] text-white">
                  {item.value}
                </strong>
                <p className="mt-auto pt-3 text-xs font-semibold leading-5 text-slate-500">{item.hint}</p>
              </div>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] border ${tone.icon}`}>
                <Icon size={18} />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

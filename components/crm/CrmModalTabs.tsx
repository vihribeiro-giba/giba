import { Building2, CalendarDays, History, Target } from "lucide-react";

export type CrmModalTab = "dados" | "eventos" | "historico" | "oportunidade";

type CrmModalTabsProps = {
  active: CrmModalTab;
  eventCount: number;
  historyCount: number;
  onChange: (tab: CrmModalTab) => void;
};

export default function CrmModalTabs({
  active,
  eventCount,
  historyCount,
  onChange,
}: CrmModalTabsProps) {
  const tabs = [
    { id: "dados" as const, label: "Dados", icon: Building2 },
    { id: "eventos" as const, label: "Eventos", icon: CalendarDays, count: eventCount },
    { id: "historico" as const, label: "Histórico", icon: History, count: historyCount },
    { id: "oportunidade" as const, label: "Oportunidade", icon: Target },
  ];

  return (
    <div
      role="tablist"
      aria-label="Seções do cadastro da prefeitura"
      className="grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-slate-950/40 p-2 sm:grid-cols-4"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-2xl px-3 text-xs font-black transition sm:text-sm ${
              selected
                ? "bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 text-white shadow-[0_12px_26px_rgba(59,130,246,0.22)]"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <Icon size={16} />
            {tab.label}
            {typeof tab.count === "number" && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${selected ? "bg-white/20" : "bg-white/[0.07]"}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

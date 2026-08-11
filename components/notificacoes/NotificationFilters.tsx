import type { GibaNotificationModule } from "./types"
import { notificationModuleLabels } from "./types"

export type NotificationViewFilter = "todas" | "novas" | "alta" | "vencidas"

type NotificationFiltersProps = {
  module: "todas" | GibaNotificationModule
  view: NotificationViewFilter
  counts: Partial<Record<GibaNotificationModule, number>>
  onModuleChange: (module: "todas" | GibaNotificationModule) => void
  onViewChange: (view: NotificationViewFilter) => void
}

const modules: Array<"todas" | GibaNotificationModule> = [
  "todas",
  "crm",
  "agenda",
  "financeiro",
  "clientes",
  "assinatura",
]

const views: Array<{ id: NotificationViewFilter; label: string }> = [
  { id: "todas", label: "Todas" },
  { id: "novas", label: "Novas" },
  { id: "alta", label: "Alta prioridade" },
  { id: "vencidas", label: "Vencidas" },
]

export default function NotificationFilters({
  module,
  view,
  counts,
  onModuleChange,
  onViewChange,
}: NotificationFiltersProps) {
  return (
    <div className="grid gap-3">
      <div
        role="tablist"
        aria-label="Filtrar notificações por módulo"
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {modules.map((item) => {
          const selected = module === item
          const label = item === "todas" ? "Todas" : notificationModuleLabels[item]
          const count =
            item === "todas"
              ? Object.values(counts).reduce((total, value) => total + (value || 0), 0)
              : counts[item] || 0

          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onModuleChange(item)}
              className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl border px-3 text-xs font-black transition ${
                selected
                  ? "border-cyan-400/25 bg-gradient-to-r from-violet-600/80 to-blue-500/80 text-white"
                  : "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
              }`}
            >
              {label}
              <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">{count}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onViewChange(item.id)}
            className={`min-h-9 rounded-xl px-3 text-[11px] font-black transition ${
              view === item.id
                ? "bg-white/10 text-white"
                : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

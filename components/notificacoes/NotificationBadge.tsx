import type { GibaNotificationPriority } from "./types"

const priorityStyles: Record<GibaNotificationPriority, string> = {
  alta: "border-rose-400/25 bg-rose-500/15 text-rose-100",
  media: "border-amber-400/25 bg-amber-400/15 text-amber-100",
  baixa: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
  info: "border-violet-400/25 bg-violet-500/15 text-violet-100",
}

const priorityLabels: Record<GibaNotificationPriority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  info: "Informativa",
}

export default function NotificationBadge({
  priority,
}: {
  priority: GibaNotificationPriority
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${priorityStyles[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  )
}

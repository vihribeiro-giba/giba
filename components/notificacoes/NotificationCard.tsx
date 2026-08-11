import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Landmark,
  Users,
  Wallet,
  X,
} from "lucide-react"
import NotificationBadge from "./NotificationBadge"
import type { GibaNotification, GibaNotificationModule } from "./types"

const moduleIcons: Record<GibaNotificationModule, typeof Landmark> = {
  crm: Landmark,
  agenda: CalendarDays,
  financeiro: Wallet,
  clientes: Users,
  assinatura: CreditCard,
}

type NotificationCardProps = {
  notification: GibaNotification
  onOpen: (notification: GibaNotification) => void
  onRead: (notification: GibaNotification) => void
  onIgnore: (notification: GibaNotification) => void
}

export default function NotificationCard({
  notification,
  onOpen,
  onRead,
  onIgnore,
}: NotificationCardProps) {
  const Icon = moduleIcons[notification.module]

  return (
    <article
      className={`group relative overflow-hidden rounded-[22px] border p-4 transition ${
        notification.status === "nova"
          ? "border-white/10 bg-white/[0.06] shadow-[0_16px_38px_rgba(0,0,0,0.18)]"
          : "border-white/[0.06] bg-white/[0.025] opacity-75"
      }`}
    >
      {notification.status === "nova" && (
        <span className="absolute left-0 top-5 h-9 w-1 rounded-r-full bg-gradient-to-b from-violet-500 to-cyan-400" />
      )}

      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-400/15 bg-gradient-to-br from-violet-500/15 to-cyan-400/10 text-cyan-100">
          <Icon size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-black leading-5 text-white">{notification.title}</h4>
              {notification.date && (
                <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                  <Clock3 size={11} /> {formatNotificationDate(notification.date)}
                </span>
              )}
            </div>
            <NotificationBadge priority={notification.priority} />
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-300">{notification.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {notification.actionUrl && (
              <button
                type="button"
                onClick={() => onOpen(notification)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 px-3 text-[11px] font-black text-white transition hover:brightness-110"
              >
                <ArrowUpRight size={13} />
                {notification.actionLabel || "Abrir item"}
              </button>
            )}
            {notification.status === "nova" && (
              <button
                type="button"
                onClick={() => onRead(notification)}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-3 text-[11px] font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Check size={13} /> Marcar como lida
              </button>
            )}
            <button
              type="button"
              onClick={() => onIgnore(notification)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-[11px] font-black text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-200"
            >
              <X size={13} /> Ignorar
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

function formatNotificationDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR")
}

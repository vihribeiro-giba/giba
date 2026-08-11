"use client"

import { useMemo, useState } from "react"
import { Bell, BellRing, CheckCheck, RefreshCw, Settings2, ShieldCheck, X } from "lucide-react"
import NotificationCard from "./NotificationCard"
import NotificationFilters, { type NotificationViewFilter } from "./NotificationFilters"
import type {
  GibaNotification,
  GibaNotificationModule,
  GibaNotificationStatus,
} from "./types"
import { notificationModuleLabels } from "./types"

type NotificationCenterProps = {
  open: boolean
  notifications: GibaNotification[]
  enabledModules: GibaNotificationModule[]
  loading: boolean
  error: string
  onClose: () => void
  onRefresh: () => void
  onOpenNotification: (notification: GibaNotification) => void
  onStatusChange: (id: string, status: GibaNotificationStatus) => void
  onMarkAllAsRead: () => void
  onToggleModule: (module: GibaNotificationModule) => void
  onEnableAllModules: () => void
}

const modules: GibaNotificationModule[] = [
  "crm",
  "agenda",
  "financeiro",
  "clientes",
  "assinatura",
]

export default function NotificationCenter({
  open,
  notifications,
  enabledModules,
  loading,
  error,
  onClose,
  onRefresh,
  onOpenNotification,
  onStatusChange,
  onMarkAllAsRead,
  onToggleModule,
  onEnableAllModules,
}: NotificationCenterProps) {
  const [moduleFilter, setModuleFilter] = useState<"todas" | GibaNotificationModule>("todas")
  const [viewFilter, setViewFilter] = useState<NotificationViewFilter>("todas")
  const [browserFeedback, setBrowserFeedback] = useState("")
  const [showPreferences, setShowPreferences] = useState(false)

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (notification.status === "ignorada") return false
        if (moduleFilter !== "todas" && notification.module !== moduleFilter) return false
        if (viewFilter === "novas" && notification.status !== "nova") return false
        if (viewFilter === "alta" && notification.priority !== "alta") return false
        if (viewFilter === "vencidas" && !notification.overdue) return false
        return true
      }),
    [moduleFilter, notifications, viewFilter],
  )

  const counts = useMemo(
    () =>
      notifications.reduce<Partial<Record<GibaNotificationModule, number>>>((result, item) => {
        if (item.status !== "ignorada") result[item.module] = (result[item.module] || 0) + 1
        return result
      }, {}),
    [notifications],
  )

  async function activateBrowserNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserFeedback("Este navegador não oferece notificações locais.")
      return
    }

    if (Notification.permission === "denied") {
      setBrowserFeedback("A permissão está bloqueada nas configurações do navegador.")
      return
    }

    const permission =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission()

    setBrowserFeedback(
      permission === "granted"
        ? "Notificações do navegador ativadas. Nenhum alerta será disparado sem contexto."
        : "Permissão não concedida. Você ainda verá todos os alertas nesta central.",
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1200] bg-slate-950/70 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-center-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="ml-auto flex h-[100dvh] w-full max-w-[660px] flex-col overflow-hidden border-l border-white/10 bg-[linear-gradient(145deg,rgba(12,17,36,0.98),rgba(3,25,45,0.98))] shadow-[-28px_0_90px_rgba(0,0,0,0.48)]"
      >
        <header className="relative overflow-hidden border-b border-white/10 px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pb-5 sm:pt-6">
          <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="relative flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400 text-white shadow-[0_15px_35px_rgba(59,130,246,0.28)]">
              <BellRing size={21} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="notification-center-title" className="text-xl font-black tracking-[-0.025em] text-white sm:text-2xl">
                Central de Notificações
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">
                Acompanhe alertas importantes da sua operação.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar Central de Notificações"
            >
              <X size={19} />
            </button>
          </div>

          <div className="relative mt-5">
            <NotificationFilters
              module={moduleFilter}
              view={viewFilter}
              counts={counts}
              onModuleChange={setModuleFilter}
              onViewChange={setViewFilter}
            />
          </div>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={activateBrowserNotifications}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-500/10 px-3 text-[11px] font-black text-violet-100 transition hover:bg-violet-500/20"
            >
              <ShieldCheck size={14} /> Ativar no navegador
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences((current) => !current)}
              className={`inline-flex min-h-9 items-center gap-2 rounded-xl border px-3 text-[11px] font-black transition ${showPreferences ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-100" : "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
            >
              <Settings2 size={14} /> Preferências
            </button>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-400 transition hover:text-white disabled:opacity-50"
              aria-label="Atualizar notificações"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-[11px] font-black text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <CheckCheck size={14} /> Ler todas
            </button>
          </div>
          {browserFeedback && (
            <p className="w-full rounded-xl border border-white/[0.06] bg-white/[0.035] px-3 py-2 text-[11px] leading-5 text-slate-400">
              {browserFeedback}
            </p>
          )}
          {showPreferences && (
            <div className="w-full rounded-2xl border border-white/[0.08] bg-slate-950/35 p-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-black text-white">Tipos de notificação</h3>
                  <p className="mt-1 text-[11px] leading-4 text-slate-400">
                    Escolha quais categorias devem aparecer na Central e no contador do sino.
                  </p>
                </div>
                {enabledModules.length < modules.length && (
                  <button
                    type="button"
                    onClick={onEnableAllModules}
                    className="shrink-0 text-[10px] font-black text-cyan-300 transition hover:text-cyan-100"
                  >
                    Ativar todas
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {modules.map((module) => {
                  const enabled = enabledModules.includes(module)
                  return (
                    <button
                      key={module}
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => onToggleModule(module)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-left transition hover:bg-white/[0.06]"
                    >
                      <span>
                        <strong className="block text-xs font-black text-slate-200">
                          {notificationModuleLabels[module]}
                        </strong>
                        <small className="text-[10px] text-slate-500">
                          {enabled ? "Notificações ativas" : "Notificações desativadas"}
                        </small>
                      </span>
                      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-gradient-to-r from-violet-600 to-cyan-400" : "bg-slate-700"}`}>
                        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading && !notifications.length ? (
            <div className="grid min-h-64 place-items-center text-sm font-bold text-slate-400">
              <span className="flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
                Organizando seus alertas...
              </span>
            </div>
          ) : error && !notifications.length ? (
            <div className="grid min-h-64 place-items-center text-center">
              <div>
                <Bell size={28} className="mx-auto text-rose-300" />
                <p className="mt-3 text-sm font-bold text-slate-300">{error}</p>
              </div>
            </div>
          ) : !visibleNotifications.length ? (
            <div className="grid min-h-64 place-items-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.025] text-center">
              <div>
                <CheckCheck size={28} className="mx-auto text-emerald-300" />
                <h3 className="mt-3 text-base font-black text-white">Tudo em dia</h3>
                <p className="mt-1 text-xs text-slate-500">Nenhum alerta corresponde aos filtros atuais.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {modules.map((module) => {
                const moduleNotifications = visibleNotifications.filter(
                  (notification) => notification.module === module,
                )
                if (!moduleNotifications.length) return null

                return (
                  <section key={module}>
                    <div className="mb-2 flex items-center justify-between px-1">
                      <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                        {notificationModuleLabels[module]}
                      </h3>
                      <span className="rounded-full bg-white/[0.05] px-2 py-1 text-[10px] font-black text-slate-500">
                        {moduleNotifications.length}
                      </span>
                    </div>
                    <div className="grid gap-3">
                      {moduleNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onOpen={onOpenNotification}
                          onRead={(item) => onStatusChange(item.id, "lida")}
                          onIgnore={(item) => onStatusChange(item.id, "ignorada")}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

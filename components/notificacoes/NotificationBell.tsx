"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import NotificationCenter from "./NotificationCenter"
import useGibaNotifications from "./useGibaNotifications"
import type { GibaNotification, GibaNotificationModule } from "./types"

export const OPEN_GIBA_NOTIFICATIONS_EVENT = "giba:open-notifications"
const PREFERENCES_STORAGE_KEY = "giba:notification-preferences:v1"
const ALL_MODULES: GibaNotificationModule[] = [
  "crm",
  "agenda",
  "financeiro",
  "clientes",
  "assinatura",
]

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [enabledModules, setEnabledModules] = useState<GibaNotificationModule[]>(ALL_MODULES)
  const router = useRouter()
  const {
    notifications,
    loading,
    error,
    refresh,
    setNotificationStatus,
    markAllAsRead,
  } = useGibaNotifications()

  useEffect(() => {
    function openCenter() {
      setOpen(true)
    }

    window.addEventListener(OPEN_GIBA_NOTIFICATIONS_EVENT, openCenter)
    return () => window.removeEventListener(OPEN_GIBA_NOTIFICATIONS_EVENT, openCenter)
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFERENCES_STORAGE_KEY) || "null")
      if (Array.isArray(saved)) {
        setEnabledModules(ALL_MODULES.filter((module) => saved.includes(module)))
      }
    } catch {
      localStorage.removeItem(PREFERENCES_STORAGE_KEY)
    }
  }, [])

  const activeNotifications = useMemo(
    () => notifications.filter((notification) => enabledModules.includes(notification.module)),
    [enabledModules, notifications],
  )

  const activeUnreadCount = useMemo(
    () => activeNotifications.filter((notification) => notification.status === "nova").length,
    [activeNotifications],
  )

  function toggleModule(module: GibaNotificationModule) {
    setEnabledModules((current) => {
      const updated = current.includes(module)
        ? current.filter((item) => item !== module)
        : [...current, module]
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  function enableAllModules() {
    setEnabledModules(ALL_MODULES)
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(ALL_MODULES))
  }

  function openNotification(notification: GibaNotification) {
    setNotificationStatus(notification.id, "lida")
    setOpen(false)
    if (notification.actionUrl) router.push(notification.actionUrl)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/60 text-slate-200 shadow-[0_18px_45px_rgba(0,0,0,0.28)] backdrop-blur-2xl transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/10 hover:text-white"
        aria-label={`Abrir Central de Notificações${activeUnreadCount ? `, ${activeUnreadCount} novas` : ""}`}
      >
        <Bell size={19} />
        {activeUnreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#080d1c] bg-gradient-to-r from-rose-500 to-orange-400 px-1 text-[10px] font-black text-white">
            {activeUnreadCount > 99 ? "99+" : activeUnreadCount}
          </span>
        )}
      </button>

      <NotificationCenter
        open={open}
        notifications={activeNotifications}
        enabledModules={enabledModules}
        loading={loading}
        error={error}
        onClose={() => setOpen(false)}
        onRefresh={refresh}
        onOpenNotification={openNotification}
        onStatusChange={setNotificationStatus}
        onMarkAllAsRead={markAllAsRead}
        onToggleModule={toggleModule}
        onEnableAllModules={enableAllModules}
      />
    </>
  )
}

"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react"

type FeedbackTone = "success" | "error" | "warning" | "info"

type FeedbackItem = {
  id: number
  message: string
  tone: FeedbackTone
}

const toneConfig = {
  success: {
    title: "Tudo certo",
    color: "#37E884",
    soft: "rgba(55,232,132,0.12)",
    border: "rgba(55,232,132,0.28)",
    Icon: CheckCircle2,
  },
  error: {
    title: "Algo deu errado",
    color: "#FF5B8A",
    soft: "rgba(255,91,138,0.12)",
    border: "rgba(255,91,138,0.28)",
    Icon: XCircle,
  },
  warning: {
    title: "Atenção",
    color: "#FFB454",
    soft: "rgba(255,180,84,0.12)",
    border: "rgba(255,180,84,0.28)",
    Icon: AlertTriangle,
  },
  info: {
    title: "Informação",
    color: "#38BDF8",
    soft: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.28)",
    Icon: Info,
  },
} as const

function inferTone(message: string): FeedbackTone {
  const normalized = message.toLocaleLowerCase("pt-BR")

  if (/sucesso|conclu[ií]d|salv[oa]|atualizad|enviad|criad[oa]/.test(normalized)) return "success"
  if (/erro|falha|n[aã]o foi poss[ií]vel|inv[aá]lid|expirad|recusad/.test(normalized)) return "error"
  if (/informe|selecione|configure|precisa|nenhum|aten[cç][aã]o/.test(normalized)) return "warning"
  return "info"
}

export default function GlobalFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const show = useCallback((message: string) => {
    const cleanMessage = String(message || "").trim()
    if (!cleanMessage) return

    const id = ++nextId.current
    const tone = inferTone(cleanMessage)
    setItems((current) => [...current.slice(-2), { id, message: cleanMessage, tone }])

    const duration = tone === "success" ? 4500 : 6500
    const timer = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, timer)
  }, [dismiss])

  useEffect(() => {
    const originalAlert = window.alert
    window.alert = (message?: unknown) => show(String(message ?? ""))

    return () => {
      window.alert = originalAlert
      timers.current.forEach((timer) => clearTimeout(timer))
      timers.current.clear()
    }
  }, [show])

  if (items.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-label="Notificações da plataforma"
      className="pointer-events-none fixed inset-x-3 top-3 z-[10000] flex flex-col items-stretch gap-3 sm:left-auto sm:right-5 sm:top-5 sm:w-[390px]"
    >
      {items.map((item) => {
        const config = toneConfig[item.tone]
        const Icon = config.Icon

        return (
          <section
            key={item.id}
            role="alert"
            className="pointer-events-auto overflow-hidden rounded-[20px] border bg-[#0B1628]/95 shadow-[0_24px_70px_rgba(0,0,0,0.46)] backdrop-blur-xl"
            style={{ borderColor: config.border }}
          >
            <div className="flex items-start gap-3 p-4 sm:p-[18px]">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border"
                style={{ color: config.color, background: config.soft, borderColor: config.border }}
                aria-hidden="true"
              >
                <Icon size={20} strokeWidth={2.2} />
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <h2 className="m-0 text-sm font-black tracking-[-0.01em] text-white">{config.title}</h2>
                <p className="mt-1 whitespace-pre-line break-words text-[13px] leading-5 text-slate-300">
                  {item.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                aria-label="Fechar notificação"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-1 w-full" style={{ background: config.soft }}>
              <div className="h-full w-full origin-left animate-[feedback-progress_4.5s_linear_forwards]" style={{ background: config.color }} />
            </div>
          </section>
        )
      })}
    </div>
  )
}

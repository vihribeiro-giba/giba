"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import { getAccountAuthUser } from "../../lib/access-session"
import { FREE_TRIAL_DAYS } from "../../lib/trial"
import type {
  GibaNotification,
  GibaNotificationStatus,
} from "./types"

type Row = Record<string, any>
type PersistedStatuses = Record<string, GibaNotificationStatus>
type CollaboratorSession = {
  id: string
  user_id: string
  tipo: "colaborador"
}

const STORAGE_KEY = "giba:notification-statuses:v1"
const DAY_MS = 86_400_000

export default function useGibaNotifications() {
  const [notifications, setNotifications] = useState<GibaNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const collaboratorSession = readCollaboratorSession()

      if (collaboratorSession) {
        const linksResult = await supabase
          .from("event_collaborators")
          .select("event_id,collaborator_id")
          .eq("collaborator_id", collaboratorSession.id)

        if (linksResult.error) {
          console.error("Erro ao carregar vínculos para notificações:", linksResult.error)
          setError("Não foi possível atualizar os eventos vinculados agora.")
          setNotifications([])
          return
        }

        const eventIds = Array.from(
          new Set((linksResult.data || []).map((link) => link.event_id).filter(Boolean)),
        )

        if (!eventIds.length) {
          setNotifications([])
          return
        }

        const eventsResult = await supabase
          .from("events")
          .select("*")
          .eq("user_id", collaboratorSession.user_id)
          .in("id", eventIds)

        if (eventsResult.error) {
          console.error("Erro ao carregar eventos para notificações:", eventsResult.error)
          setError("Não foi possível atualizar os eventos vinculados agora.")
          setNotifications([])
          return
        }

        const persisted = readPersistedStatuses()
        setNotifications(
          buildCollaboratorEventNotifications(
            (eventsResult.data || []) as Row[],
            collaboratorSession.id,
          )
            .map((notification) => ({
              ...notification,
              status: persisted[notification.id] || "nova",
            }))
            .sort(compareNotifications),
        )
        return
      }

      const { data: authData } = await getAccountAuthUser()
      const user = authData.user

      if (!user) {
        setNotifications([])
        return
      }

      const [
        opportunitiesResult,
        municipalEventsResult,
        interactionsResult,
        agendaResult,
        financeResult,
        recurringResult,
        receivablesResult,
        clientsResult,
        subscriptionResult,
      ] = await Promise.all([
        supabase
          .from("crm_oportunidades")
          .select("*, municipios(nome)")
          .eq("user_id", user.id),
        supabase.from("municipio_eventos").select("*").eq("user_id", user.id),
        supabase.from("crm_interacoes").select("*").eq("user_id", user.id),
        supabase.from("events").select("*").eq("user_id", user.id),
        supabase.from("finance").select("*").eq("user_id", user.id),
        supabase.from("recurring_expenses").select("*").eq("user_id", user.id),
        supabase.from("accounts_receivable").select("*").eq("user_id", user.id),
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ])

      const sourceErrors = [
        opportunitiesResult.error,
        municipalEventsResult.error,
        interactionsResult.error,
        agendaResult.error,
        financeResult.error,
        recurringResult.error,
        receivablesResult.error,
        clientsResult.error,
        subscriptionResult.error,
      ].filter(Boolean)

      if (sourceErrors.length) {
        console.warn("Algumas fontes de notificações não puderam ser carregadas:", sourceErrors)
      }

      const generated = [
        ...buildCrmNotifications(
          (opportunitiesResult.data || []) as Row[],
          (municipalEventsResult.data || []) as Row[],
          (interactionsResult.data || []) as Row[],
        ),
        ...buildAgendaNotifications(
          (agendaResult.data || []) as Row[],
          (financeResult.data || []) as Row[],
        ),
        ...buildFinanceNotifications(
          (financeResult.data || []) as Row[],
          (recurringResult.data || []) as Row[],
          (receivablesResult.data || []) as Row[],
        ),
        ...buildClientNotifications((clientsResult.data || []) as Row[]),
        ...buildSubscriptionNotifications((subscriptionResult.data || []) as Row[]),
      ]

      const persisted = readPersistedStatuses()
      setNotifications(
        generated
          .map((notification) => ({
            ...notification,
            status: persisted[notification.id] || "nova",
          }))
          .sort(compareNotifications),
      )
    } catch (loadError) {
      console.error("Erro ao montar notificações globais:", loadError)
      setError("Não foi possível atualizar as notificações agora.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const setNotificationStatus = useCallback(
    (id: string, status: GibaNotificationStatus) => {
      setNotifications((current) => {
        const updated = current.map((notification) =>
          notification.id === id ? { ...notification, status } : notification,
        )
        persistStatuses(updated)
        return updated
      })
    },
    [],
  )

  const markAllAsRead = useCallback(() => {
    setNotifications((current) => {
      const updated = current.map((notification) =>
        notification.status === "ignorada"
          ? notification
          : { ...notification, status: "lida" as const },
      )
      persistStatuses(updated)
      return updated
    })
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status === "nova").length,
    [notifications],
  )

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refresh: loadNotifications,
    setNotificationStatus,
    markAllAsRead,
  }
}

function buildCollaboratorEventNotifications(
  events: Row[],
  collaboratorId: string,
): GibaNotification[] {
  const today = startOfToday()
  const referenceDate = dateKey(today)

  return events.flatMap((event) => {
    const eventDate = parseDate(event.event_date)
    if (!eventDate || differenceInDays(eventDate, today) !== 2) return []
    if (normalizeText(event.status).includes("cancel")) return []

    const eventName = event.title || event.event_type || event.client_name || "Evento"
    const clientName = event.client_name && event.client_name !== eventName
      ? ` para ${event.client_name}`
      : ""
    const time = event.event_time ? `, às ${event.event_time}` : ""
    const location = event.location ? `, em ${event.location}` : ""
    const showFormat = event.show_format ? ` Formato: ${event.show_format}.` : ""

    return [
      {
        id: `evento_colaborador_2_dias-${event.id}-${collaboratorId}-${referenceDate}`,
        module: "agenda" as const,
        title: "Evento se aproximando",
        description: `O evento “${eventName}”${clientName} acontecerá em 2 dias, no dia ${formatDate(eventDate)}${time}${location}.${showFormat}`,
        date: dateKey(eventDate),
        priority: "media" as const,
        status: "nova" as const,
        actionUrl: "/agenda-colaborador",
        actionLabel: "Abrir agenda",
      },
    ]
  })
}

function buildCrmNotifications(
  opportunities: Row[],
  municipalEvents: Row[],
  interactions: Row[],
): GibaNotification[] {
  const notifications: GibaNotification[] = []
  const today = startOfToday()

  opportunities.forEach((opportunity) => {
    const municipality = opportunity.municipios?.nome || "Prefeitura"
    const contactDate = parseDate(opportunity.proximo_contato)

    if (contactDate) {
      const days = differenceInDays(contactDate, today)
      if (days <= 30) {
        notifications.push({
          id: `crm-followup-${opportunity.id}-${dateKey(contactDate)}`,
          module: "crm",
          title:
            days < 0
              ? `${municipality}: contato vencido`
              : days === 0
                ? `${municipality}: contato hoje`
                : `${municipality}: próximo contato`,
          description:
            days < 0
              ? `Follow-up atrasado há ${Math.abs(days)} dia(s).`
              : days === 0
                ? "O contato comercial está previsto para hoje."
                : `Entrar em contato em ${formatDate(contactDate)}.`,
          date: dateKey(contactDate),
          priority: days <= 0 ? "alta" : days <= 7 ? "media" : "baixa",
          status: "nova",
          actionUrl: "/crm",
          actionLabel: "Abrir CRM",
          overdue: days < 0,
        })
      }
    }

    const lastInteraction = interactions
      .filter((interaction) => interaction.oportunidade_id === opportunity.id)
      .map((interaction) => parseDate(interaction.data_interacao))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0]
    const referenceDate = lastInteraction || parseDate(opportunity.created_at)

    if (
      referenceDate &&
      differenceInDays(today, referenceDate) >= 45 &&
      !["fechado", "perdido"].includes(String(opportunity.status || "").toLowerCase())
    ) {
      notifications.push({
        id: `crm-inactive-${opportunity.id}-${dateKey(referenceDate)}`,
        module: "crm",
        title: `${municipality}: relacionamento parado`,
        description: `Sem interação registrada há ${differenceInDays(today, referenceDate)} dias.`,
        priority: "media",
        status: "nova",
        actionUrl: "/crm",
        actionLabel: "Revisar oportunidade",
      })
    }
  })

  municipalEvents.forEach((event) => {
    const eventDate = parseDate(event.data_evento)
    if (!eventDate) return
    const days = differenceInDays(eventDate, today)
    if (days < 0 || days > 30) return

    notifications.push({
      id: `crm-event-${event.id}-${dateKey(eventDate)}`,
      module: "crm",
      title: `${event.nome_evento || "Evento municipal"} se aproxima`,
      description:
        days === 0
          ? "O evento municipal acontece hoje."
          : `Evento previsto para ${formatDate(eventDate)}.`,
      date: dateKey(eventDate),
      priority: days <= 7 ? "media" : "baixa",
      status: "nova",
      actionUrl: "/crm",
      actionLabel: "Ver evento",
    })
  })

  return notifications
}

function buildAgendaNotifications(events: Row[], finance: Row[]): GibaNotification[] {
  const notifications: GibaNotification[] = []
  const today = startOfToday()
  const revenueEventIds = new Set(
    finance
      .filter((entry) => isIncome(entry.type))
      .map((entry) => entry.event_id)
      .filter(Boolean),
  )

  events.forEach((event) => {
    const eventDate = parseDate(event.event_date)
    if (!eventDate) return
    const days = differenceInDays(eventDate, today)
    const title = event.title || event.client_name || "Evento"
    const action = {
      actionUrl: "/agenda",
      actionLabel: "Abrir agenda",
    }

    if (days >= 0 && days <= 7) {
      notifications.push({
        id: `agenda-date-${event.id}-${dateKey(eventDate)}`,
        module: "agenda",
        title:
          days === 0
            ? `${title}: evento hoje`
            : days === 1
              ? `${title}: evento amanhã`
              : `${title}: evento em ${days} dias`,
        description: `${formatDate(eventDate)}${event.event_time ? ` às ${event.event_time}` : ""}.`,
        date: dateKey(eventDate),
        priority: days === 0 ? "alta" : days === 1 ? "media" : "baixa",
        status: "nova",
        ...action,
      })
    }

    if (String(event.status || "").toLowerCase() === "pendente" && days >= 0) {
      notifications.push({
        id: `agenda-pending-${event.id}-${dateKey(eventDate)}`,
        module: "agenda",
        title: `${title}: evento pendente`,
        description: "Revise as informações e confirme o próximo passo do evento.",
        date: dateKey(eventDate),
        priority: days <= 7 ? "media" : "baixa",
        status: "nova",
        ...action,
      })
    }

    if (days >= 0 && days <= 30 && !revenueEventIds.has(event.id)) {
      notifications.push({
        id: `agenda-revenue-${event.id}-${dateKey(eventDate)}`,
        module: "agenda",
        title: `${title}: receita não lançada`,
        description: "O evento ainda não possui uma entrada financeira vinculada.",
        date: dateKey(eventDate),
        priority: days <= 7 ? "media" : "baixa",
        status: "nova",
        actionUrl: "/financeiro",
        actionLabel: "Lançar receita",
      })
    }

    const contractIndicator =
      event.contract_generated ?? event.contrato_gerado ?? event.contract_generated_at
    if (days >= 0 && days <= 30 && contractIndicator === false) {
      notifications.push({
        id: `agenda-contract-${event.id}-${dateKey(eventDate)}`,
        module: "agenda",
        title: `${title}: contrato não gerado`,
        description: "Prepare o contrato antes da data do evento.",
        date: dateKey(eventDate),
        priority: days <= 7 ? "alta" : "media",
        status: "nova",
        actionUrl: "/contratos",
        actionLabel: "Gerar contrato",
      })
    }
  })

  return notifications
}

function buildFinanceNotifications(
  finance: Row[],
  recurringExpenses: Row[],
  receivables: Row[],
): GibaNotification[] {
  const notifications: GibaNotification[] = []
  const today = startOfToday()

  receivables.forEach((receivable) => {
    if (isPaid(receivable.status)) return
    const dueDate = parseDate(receivable.due_date)
    if (!dueDate) return
    const days = differenceInDays(dueDate, today)
    if (days > 15) return

    const name = receivable.client_name || receivable.event_title || "Recebimento"
    notifications.push({
      id: `finance-receivable-${receivable.id}-${dateKey(dueDate)}`,
      module: "financeiro",
      title: days < 0 ? `${name}: recebimento vencido` : `${name}: recebimento próximo`,
      description:
        days < 0
          ? `Vencido há ${Math.abs(days)} dia(s).`
          : `Vencimento em ${formatDate(dueDate)}.`,
      date: dateKey(dueDate),
      priority: days <= 0 ? "alta" : days <= 3 ? "media" : "baixa",
      status: "nova",
      actionUrl: "/financeiro",
      actionLabel: "Ver recebimentos",
      overdue: days < 0,
    })
  })

  recurringExpenses.forEach((expense) => {
    if (expense.is_paid || !expense.due_day) return
    const dueDate = dueDateForCurrentCycle(Number(expense.due_day), today)
    const days = differenceInDays(dueDate, today)
    if (days > 15) return
    const isTax = normalizeText(expense.category || expense.name).includes("imposto")

    notifications.push({
      id: `finance-recurring-${expense.id}-${dateKey(dueDate)}`,
      module: "financeiro",
      title: isTax
        ? `${expense.name}: imposto próximo do vencimento`
        : days < 0
          ? `${expense.name}: despesa recorrente vencida`
          : `${expense.name}: despesa recorrente próxima`,
      description:
        days < 0
          ? `Pagamento atrasado há ${Math.abs(days)} dia(s).`
          : `Vencimento previsto para ${formatDate(dueDate)}.`,
      date: dateKey(dueDate),
      priority: days <= 0 ? "alta" : days <= 5 ? "media" : "baixa",
      status: "nova",
      actionUrl: "/financeiro",
      actionLabel: "Abrir financeiro",
      overdue: days < 0,
    })
  })

  finance.forEach((entry) => {
    if (isPaid(entry.status)) return
    if (!normalizeText(entry.status).includes("pendente")) return
    const paymentDate = parseDate(entry.payment_date)
    const days = paymentDate ? differenceInDays(paymentDate, today) : null
    if (days !== null && days > 15) return

    notifications.push({
      id: `finance-pending-${entry.id}-${paymentDate ? dateKey(paymentDate) : "open"}`,
      module: "financeiro",
      title: `${entry.description || "Pagamento"}: pagamento pendente`,
      description: paymentDate
        ? `Data prevista: ${formatDate(paymentDate)}.`
        : "Movimentação financeira aguardando confirmação.",
      date: paymentDate ? dateKey(paymentDate) : undefined,
      priority: days !== null && days <= 0 ? "alta" : "media",
      status: "nova",
      actionUrl: "/financeiro",
      actionLabel: "Revisar pagamento",
      overdue: days !== null && days < 0,
    })
  })

  return notifications
}

function buildClientNotifications(clients: Row[]): GibaNotification[] {
  const notifications: GibaNotification[] = []
  const today = startOfToday()

  clients.forEach((client) => {
    const name = client.nome || "Cliente"
    if (isBirthdayToday(client.data_aniversario, today)) {
      notifications.push({
        id: `client-birthday-${client.id}-${today.getFullYear()}`,
        module: "clientes",
        title: `Aniversário de ${name}`,
        description: "Uma boa oportunidade para fortalecer o relacionamento hoje.",
        date: dateKey(today),
        priority: "info",
        status: "nova",
        actionUrl: "/clientes",
        actionLabel: "Ver cliente",
      })
    }

    const referenceDate = parseDate(
      client.last_contact_at || client.ultimo_contato || client.updated_at || client.created_at,
    )
    if (!referenceDate) return
    const inactiveDays = differenceInDays(today, referenceDate)
    const negotiation = normalizeText(client.status_cliente).includes("negociacao")

    if (negotiation && inactiveDays >= 14) {
      notifications.push({
        id: `client-negotiation-${client.id}-${dateKey(referenceDate)}`,
        module: "clientes",
        title: `${name}: negociação sem retorno`,
        description: `Sem atualização há ${inactiveDays} dias.`,
        priority: "media",
        status: "nova",
        actionUrl: "/clientes",
        actionLabel: "Retomar contato",
      })
    } else if (inactiveDays >= 60 && normalizeText(client.status_cliente) !== "inativo") {
      notifications.push({
        id: `client-inactive-${client.id}-${dateKey(referenceDate)}`,
        module: "clientes",
        title: `${name}: relacionamento sem contato`,
        description: `Cadastro sem atualização há ${inactiveDays} dias.`,
        priority: "baixa",
        status: "nova",
        actionUrl: "/clientes",
        actionLabel: "Abrir cliente",
      })
    }
  })

  return notifications
}

function buildSubscriptionNotifications(subscriptions: Row[]): GibaNotification[] {
  const subscription = subscriptions[0]
  if (!subscription) {
    return [
      {
        id: "subscription-missing",
        module: "assinatura",
        title: "Plano não configurado",
        description: "Escolha um plano para manter todos os recursos disponíveis.",
        priority: "media",
        status: "nova",
        actionUrl: "/assinatura",
        actionLabel: "Ver planos",
      },
    ]
  }

  const notifications: GibaNotification[] = []
  const status = normalizeText(subscription.status)
  const endDate = parseDate(subscription.data_fim)
  const days = endDate ? differenceInDays(endDate, startOfToday()) : null

  if (status.includes("pendente")) {
    notifications.push({
      id: `subscription-pending-${subscription.id}`,
      module: "assinatura",
      title: "Plano com pagamento pendente",
      description: "Revise os dados de pagamento para liberar ou manter o acesso.",
      priority: "alta",
      status: "nova",
      actionUrl: "/assinatura",
      actionLabel: "Revisar assinatura",
    })
  } else if (["vencido", "cancelado", "inativo"].some((value) => status.includes(value))) {
    notifications.push({
      id: `subscription-overdue-${subscription.id}`,
      module: "assinatura",
      title: "Pagamento da assinatura vencido",
      description: endDate ? `Plano encerrado em ${formatDate(endDate)}.` : "Regularize o plano para continuar.",
      date: endDate ? dateKey(endDate) : undefined,
      priority: "alta",
      status: "nova",
      actionUrl: "/assinatura",
      actionLabel: "Regularizar plano",
      overdue: true,
    })
  } else if (subscription.plano === "teste" && days !== null && days >= 0 && days <= 7) {
    notifications.push({
      id: `subscription-trial-${subscription.id}-${dateKey(endDate!)}`,
      module: "assinatura",
      title: `Teste grátis de ${FREE_TRIAL_DAYS} dias perto do fim`,
      description: days === 0 ? "Seu teste termina hoje." : `Seu teste termina em ${days} dia(s).`,
      date: dateKey(endDate!),
      priority: days <= 2 ? "media" : "baixa",
      status: "nova",
      actionUrl: "/assinatura",
      actionLabel: "Escolher plano",
    })
  } else if (status.includes("ativo")) {
    notifications.push({
      id: `subscription-confirmed-${subscription.id}-${subscription.updated_at || subscription.created_at || "active"}`,
      module: "assinatura",
      title: "Pagamento da assinatura confirmado",
      description: "Seu plano está ativo e os recursos contratados estão disponíveis.",
      priority: "info",
      status: "nova",
      actionUrl: "/assinatura",
      actionLabel: "Ver assinatura",
    })
  }

  return notifications
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

function differenceInDays(date: Date, reference: Date) {
  const dateDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const referenceDay = Date.UTC(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
  )
  return Math.round((dateDay - referenceDay) / DAY_MS)
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR")
}

function dueDateForCurrentCycle(dueDay: number, today: Date) {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  return new Date(today.getFullYear(), today.getMonth(), Math.min(dueDay, lastDay))
}

function normalizeText(value?: string | null) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function isPaid(status?: string | null) {
  const normalized = normalizeText(status)
  return ["pago", "recebido", "concluido", "confirmado", "quitado"].some((value) =>
    normalized.includes(value),
  )
}

function isIncome(type?: string | null) {
  const normalized = normalizeText(type)
  return normalized.includes("entrada") || normalized.includes("receita")
}

function isBirthdayToday(value: string | null | undefined, today: Date) {
  if (!value) return false
  const parts = value.split("T")[0].split("-")
  if (parts.length !== 3) return false
  return Number(parts[1]) === today.getMonth() + 1 && Number(parts[2]) === today.getDate()
}

function compareNotifications(a: GibaNotification, b: GibaNotification) {
  const priorityWeight = { alta: 0, media: 1, baixa: 2, info: 3 }
  const priorityDifference = priorityWeight[a.priority] - priorityWeight[b.priority]
  if (priorityDifference !== 0) return priorityDifference

  if (a.date && b.date) return a.date.localeCompare(b.date)
  if (a.date) return -1
  if (b.date) return 1
  return a.title.localeCompare(b.title)
}

function readPersistedStatuses(): PersistedStatuses {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}

function readCollaboratorSession(): CollaboratorSession | null {
  if (typeof window === "undefined") return null

  try {
    const rawSession = window.localStorage.getItem("giba_colaborador_session")
    if (!rawSession) return null
    const session = JSON.parse(rawSession) as Partial<CollaboratorSession>

    if (!session.id || !session.user_id || session.tipo !== "colaborador") return null

    return {
      id: session.id,
      user_id: session.user_id,
      tipo: "colaborador",
    }
  } catch {
    return null
  }
}

function persistStatuses(notifications: GibaNotification[]) {
  if (typeof window === "undefined") return
  const statuses = notifications.reduce<PersistedStatuses>((result, notification) => {
    if (notification.status !== "nova") result[notification.id] = notification.status
    return result
  }, {})
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses))
}

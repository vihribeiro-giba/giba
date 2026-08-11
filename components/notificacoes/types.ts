export type GibaNotificationModule =
  | "crm"
  | "agenda"
  | "financeiro"
  | "clientes"
  | "assinatura"

export type GibaNotificationPriority = "alta" | "media" | "baixa" | "info"
export type GibaNotificationStatus = "nova" | "lida" | "ignorada"

export type GibaNotification = {
  id: string
  module: GibaNotificationModule
  title: string
  description: string
  date?: string
  priority: GibaNotificationPriority
  status: GibaNotificationStatus
  actionUrl?: string
  actionLabel?: string
  overdue?: boolean
}

export const notificationModuleLabels: Record<GibaNotificationModule, string> = {
  crm: "CRM",
  agenda: "Agenda",
  financeiro: "Financeiro",
  clientes: "Clientes",
  assinatura: "Assinatura",
}

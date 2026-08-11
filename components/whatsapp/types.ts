export type WhatsAppContextType =
  | "cliente"
  | "evento"
  | "crm"
  | "proposta"
  | "contratante"
  | "colaborador"

export type WhatsAppRecipient = {
  id?: string
  name?: string
  phone?: string
  email?: string
}

export type WhatsAppEventContext = {
  id?: string
  name?: string
  date?: string
  time?: string
  format?: string
  location?: string
  city?: string
  fee?: number
  paymentType?: string
  status?: string
}

export type WhatsAppTemplate = {
  id: string
  name: string
  messageType: string
  content: string
  isDefault: boolean
  systemKey?: string | null
  createdAt: string
  updatedAt: string
}

export type WhatsAppTemplatePersistence = "database" | "local"

export type WhatsAppMessageModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  contextType?: WhatsAppContextType
  messageType?: string
  recipient?: WhatsAppRecipient
  event?: WhatsAppEventContext
  extraVariables?: Record<string, string | number | null | undefined>
}

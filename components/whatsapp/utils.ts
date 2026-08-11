import type {
  WhatsAppEventContext,
  WhatsAppRecipient,
  WhatsAppTemplate,
} from "./types"

export const WHATSAPP_MESSAGE_TYPES = [
  { value: "confirmacao_evento", label: "Confirmação de evento" },
  { value: "apresentacao_comercial", label: "Apresentação comercial" },
  { value: "follow_up_orcamento", label: "Follow-up de orçamento" },
  { value: "proposta_comercial", label: "Proposta comercial" },
  { value: "cobranca", label: "Cobrança" },
  { value: "aniversario", label: "Aniversário" },
  { value: "agradecimento_pos_evento", label: "Agradecimento pós-evento" },
  { value: "solicitacao_informacoes", label: "Solicitação de informações" },
  { value: "mensagem_personalizada", label: "Mensagem personalizada" },
]

export const WHATSAPP_VARIABLES = [
  "nome", "cliente", "telefone", "email", "tipo", "status", "aniversario",
  "data", "horario", "formato", "local", "cidade", "cache", "pagamento",
  "nome_evento", "orcamento", "validade", "responsavel", "empresa",
  "municipio", "estado", "prefeito", "secretario_cultura", "modelo_contratacao",
  "link_proposta", "valor", "numero_proposta",
]

const DEFAULT_TEMPLATES: Array<Pick<WhatsAppTemplate, "name" | "messageType" | "content">> = [
  {
    name: "Confirmação completa",
    messageType: "confirmacao_evento",
    content: "Olá, {nome}! Tudo bem?\n\nConfirmamos o evento {nome_evento} para o dia {data}, às {horario}, em {local}.\nFormato: {formato}.\n\nFicamos à disposição!",
  },
  {
    name: "Apresentação comercial",
    messageType: "apresentacao_comercial",
    content: "Olá, {nome}! Sou {responsavel}, da {empresa}. Gostaria de apresentar nosso trabalho e conversar sobre uma possível parceria.",
  },
  {
    name: "Follow-up de orçamento",
    messageType: "follow_up_orcamento",
    content: "Olá, {nome}! Passando para acompanhar o orçamento {orcamento}. Posso esclarecer alguma dúvida?",
  },
  {
    name: "Envio de proposta comercial",
    messageType: "proposta_comercial",
    content: "Olá, {nome}! Tudo bem?\n\nConforme conversamos, estou encaminhando a proposta comercial para o evento.\n\n🎤 Formato: {formato}\n📅 Data: {data}\n💰 Investimento: {valor}\n⏳ Validade da proposta: {validade}\n\nAcesse a proposta:\n{link_proposta}\n\nFico à disposição para qualquer dúvida.",
  },
  {
    name: "Cobrança cordial",
    messageType: "cobranca",
    content: "Olá, {nome}! Tudo bem? Gostaria de verificar o pagamento referente a {pagamento}. Se já foi realizado, por favor desconsidere esta mensagem.",
  },
  {
    name: "Feliz aniversário",
    messageType: "aniversario",
    content: "Olá, {nome}! 🎉 Passando para desejar um feliz aniversário, com muita saúde, alegria e realizações!",
  },
  {
    name: "Agradecimento pelo evento",
    messageType: "agradecimento_pos_evento",
    content: "Olá, {nome}! Agradecemos pela confiança no evento {nome_evento}. Foi um prazer participar desse momento!",
  },
  {
    name: "Solicitar informações",
    messageType: "solicitacao_informacoes",
    content: "Olá, {nome}! Para avançarmos, poderia nos enviar as informações sobre {nome_evento}, data, horário e local?",
  },
  {
    name: "Mensagem livre",
    messageType: "mensagem_personalizada",
    content: "Olá, {nome}!",
  },
]

export function createDefaultWhatsAppTemplates(): WhatsAppTemplate[] {
  const now = new Date().toISOString()
  return DEFAULT_TEMPLATES.map((template) => ({
    ...template,
    id: `padrao-${template.messageType}`,
    systemKey: `default:${template.messageType}`,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }))
}

export function replaceWhatsAppTemplateVariables(
  template: string,
  variables: Record<string, unknown>,
) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key: string) => {
    const value = variables[key]
    if (value === null || value === undefined || value === "") return match
    if (typeof value === "object") return match
    return String(value)
  })
}

export function buildWhatsAppVariables(
  recipient?: WhatsAppRecipient,
  event?: WhatsAppEventContext,
  extra?: Record<string, string | number | null | undefined>,
) {
  return {
    nome: recipient?.name,
    cliente: recipient?.name,
    telefone: recipient?.phone,
    email: recipient?.email,
    data: formatDate(event?.date),
    horario: event?.time,
    formato: event?.format,
    local: event?.location,
    cidade: event?.city,
    cache: formatCurrency(event?.fee),
    pagamento: event?.paymentType,
    status: event?.status,
    nome_evento: event?.name,
    ...extra,
  }
}

export function normalizeWhatsAppPhone(phone: string) {
  let digits = phone.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2)
  if (digits.startsWith("0") && digits.length > 11) digits = digits.slice(1)
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`
  }
  if (!digits.startsWith("55") || digits.length < 12 || digits.length > 13) return ""
  return digits
}

export function messageTypeLabel(value: string) {
  return WHATSAPP_MESSAGE_TYPES.find((item) => item.value === value)?.label || value
}

function formatDate(value?: string) {
  if (!value) return undefined
  const datePart = value.slice(0, 10)
  const date = new Date(`${datePart}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR")
}

function formatCurrency(value?: number) {
  if (value === null || value === undefined) return undefined
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

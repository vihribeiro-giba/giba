import { supabase } from "../../lib/supabase"
import type { WhatsAppTemplate, WhatsAppTemplatePersistence } from "./types"
import { createDefaultWhatsAppTemplates } from "./utils"

const STORAGE_PREFIX = "giba:whatsapp-templates:v1"
const MIGRATION_PREFIX = "giba:whatsapp-templates:migrated:v1"

type WhatsAppTemplateRow = {
  id: string
  user_id: string
  name: string
  message_type: string
  content: string
  is_default: boolean
  system_key: string | null
  created_at: string
  updated_at: string
}

export type WhatsAppTemplateLoadResult = {
  templates: WhatsAppTemplate[]
  persistence: WhatsAppTemplatePersistence
  warning?: string
}

export async function loadWhatsAppTemplates(ownerId: string): Promise<WhatsAppTemplateLoadResult> {
  const localTemplates = loadLocalTemplates(ownerId)
  if (!ownerId || ownerId === "local") {
    return { templates: localTemplates, persistence: "local" }
  }

  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("id, user_id, name, message_type, content, is_default, system_key, created_at, updated_at")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Erro ao carregar modelos de WhatsApp:", error)
    return {
      templates: localTemplates,
      persistence: "local",
      warning: "Modelos locais em uso. Execute a migration do Supabase para sincronizar entre navegadores.",
    }
  }

  if (data.length > 0) {
    let templates = (data as WhatsAppTemplateRow[]).map(fromRow)
    if (!localStorage.getItem(migrationKey(ownerId))) {
      const merged = mergeMissingLocalTemplates(templates, localTemplates)
      if (merged.length !== templates.length) {
        try {
          templates = await saveWhatsAppTemplates(ownerId, merged, "database")
        } catch (migrationError) {
          console.error("Erro ao incorporar modelos locais de WhatsApp:", migrationError)
          return {
            templates: localTemplates,
            persistence: "local",
            warning: "Os modelos da conta foram encontrados, mas a migração local falhou. Nenhum modelo local foi apagado.",
          }
        }
      }
      localStorage.setItem(migrationKey(ownerId), new Date().toISOString())
    }
    saveLocalTemplates(ownerId, templates)
    return { templates, persistence: "database" }
  }

  const templatesToMigrate = prepareTemplatesForDatabase(localTemplates)
  if (templatesToMigrate.length === 0) {
    localStorage.setItem(migrationKey(ownerId), new Date().toISOString())
    return { templates: [], persistence: "database" }
  }
  const { data: migrated, error: migrationError } = await supabase
    .from("whatsapp_templates")
    .insert(templatesToMigrate.map((template) => toInsert(ownerId, template)))
    .select("id, user_id, name, message_type, content, is_default, system_key, created_at, updated_at")

  if (migrationError) {
    console.error("Erro ao migrar modelos de WhatsApp:", migrationError)
    return {
      templates: localTemplates,
      persistence: "local",
      warning: "Não foi possível migrar os modelos para a conta. Eles permanecem salvos neste navegador.",
    }
  }

  const templates = (migrated as WhatsAppTemplateRow[]).map(fromRow)
  localStorage.setItem(migrationKey(ownerId), new Date().toISOString())
  saveLocalTemplates(ownerId, templates)
  return { templates, persistence: "database" }
}

export async function saveWhatsAppTemplates(
  ownerId: string,
  templates: WhatsAppTemplate[],
  persistence: WhatsAppTemplatePersistence,
) {
  if (persistence === "local") {
    saveLocalTemplates(ownerId, templates)
    return templates
  }

  const { data, error } = await supabase.rpc("replace_whatsapp_templates", {
    p_templates: templates.map((template) => ({
      id: isUuid(template.id) ? template.id : crypto.randomUUID(),
      name: template.name,
      message_type: template.messageType,
      content: template.content,
      is_default: template.isDefault,
      system_key: template.systemKey || null,
      created_at: template.createdAt,
    })),
  })

  if (error) throw error

  const saved = (data as WhatsAppTemplateRow[]).map(fromRow)
  saveLocalTemplates(ownerId, saved)
  return saved
}

function loadLocalTemplates(ownerId: string) {
  const key = storageKey(ownerId)
  const storedValue = localStorage.getItem(key)
  if (storedValue !== null) return parseTemplates(storedValue)

  const templates = migrateLegacyTemplates(createDefaultWhatsAppTemplates())
  saveLocalTemplates(ownerId, templates)
  return templates
}

function saveLocalTemplates(ownerId: string, templates: WhatsAppTemplate[]) {
  localStorage.setItem(storageKey(ownerId), JSON.stringify(templates))
}

function storageKey(ownerId: string) {
  return `${STORAGE_PREFIX}:${ownerId}`
}

function migrationKey(ownerId: string) {
  return `${MIGRATION_PREFIX}:${ownerId}`
}

function parseTemplates(value: string | null): WhatsAppTemplate[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function migrateLegacyTemplates(templates: WhatsAppTemplate[]) {
  const legacy = [
    {
      key: "giba_whatsapp_confirmacao_modelo",
      name: "Confirmação anterior da Agenda",
      messageType: "confirmacao_evento",
    },
    {
      key: "giba_clientes_whatsapp_modelo",
      name: "Mensagem anterior de Clientes",
      messageType: "aniversario",
    },
  ]
  const now = new Date().toISOString()

  for (const item of legacy) {
    const content = localStorage.getItem(item.key)?.trim()
    if (!content) continue
    templates = templates.map((template) =>
      template.messageType === item.messageType ? { ...template, isDefault: false } : template,
    )
    templates.push({
      id: `legado-${item.messageType}`,
      systemKey: `legacy:${item.key}`,
      name: item.name,
      messageType: item.messageType,
      content,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })
  }
  return templates
}

function prepareTemplatesForDatabase(templates: WhatsAppTemplate[]) {
  return templates.map((template) => ({
    ...template,
    id: isUuid(template.id) ? template.id : crypto.randomUUID(),
  }))
}

function mergeMissingLocalTemplates(
  databaseTemplates: WhatsAppTemplate[],
  localTemplates: WhatsAppTemplate[],
) {
  const merged = [...databaseTemplates]
  for (const local of localTemplates) {
    const alreadyExists = merged.some((database) =>
      Boolean(local.systemKey && database.systemKey === local.systemKey)
      || (isUuid(local.id) && database.id === local.id)
      || (
        database.name === local.name
        && database.messageType === local.messageType
        && database.content === local.content
      ),
    )
    if (alreadyExists) continue

    const typeAlreadyHasDefault = merged.some(
      (template) => template.messageType === local.messageType && template.isDefault,
    )
    merged.push({
      ...local,
      id: isUuid(local.id) ? local.id : crypto.randomUUID(),
      isDefault: typeAlreadyHasDefault ? false : local.isDefault,
    })
  }
  return merged
}

function toInsert(userId: string, template: WhatsAppTemplate) {
  return {
    id: template.id,
    user_id: userId,
    name: template.name,
    message_type: template.messageType,
    content: template.content,
    is_default: template.isDefault,
    system_key: template.systemKey || null,
    created_at: template.createdAt,
    updated_at: template.updatedAt,
  }
}

function fromRow(row: WhatsAppTemplateRow): WhatsAppTemplate {
  return {
    id: row.id,
    name: row.name,
    messageType: row.message_type,
    content: row.content,
    isDefault: row.is_default,
    systemKey: row.system_key,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

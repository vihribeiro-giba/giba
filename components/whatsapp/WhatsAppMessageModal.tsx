"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Check,
  Copy,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { supabase } from "../../lib/supabase"
import { getAccountAuthUser } from "../../lib/access-session"
import type {
  WhatsAppMessageModalProps,
  WhatsAppTemplate,
  WhatsAppTemplatePersistence,
} from "./types"
import { loadWhatsAppTemplates, saveWhatsAppTemplates } from "./templateStorage"
import GibaSelect from "../GibaSelect"
import {
  buildWhatsAppVariables,
  messageTypeLabel,
  normalizeWhatsAppPhone,
  replaceWhatsAppTemplateVariables,
  WHATSAPP_MESSAGE_TYPES,
  WHATSAPP_VARIABLES,
} from "./utils"

type Tab = "mensagem" | "modelos"

export default function WhatsAppMessageModal({
  open,
  onOpenChange,
  contextType = "cliente",
  messageType = "mensagem_personalizada",
  recipient,
  event,
  extraVariables,
}: WhatsAppMessageModalProps) {
  const [tab, setTab] = useState<Tab>("mensagem")
  const [ownerId, setOwnerId] = useState("")
  const [canManage, setCanManage] = useState(true)
  const [persistence, setPersistence] = useState<WhatsAppTemplatePersistence>("local")
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [phone, setPhone] = useState("")
  const [selectedType, setSelectedType] = useState(messageType)
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [message, setMessage] = useState("")
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("todos")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formType, setFormType] = useState(messageType)
  const [formContent, setFormContent] = useState("")
  const [formDefault, setFormDefault] = useState(false)

  const variables = useMemo(
    () => buildWhatsAppVariables(recipient, event, extraVariables),
    [event, extraVariables, recipient],
  )

  const messageTypes = useMemo(() => {
    const custom = templates
      .map((template) => template.messageType)
      .filter((value, index, list) => list.indexOf(value) === index)
      .filter((value) => !WHATSAPP_MESSAGE_TYPES.some((item) => item.value === value))
      .map((value) => ({ value, label: value }))
    return [...WHATSAPP_MESSAGE_TYPES, ...custom]
  }, [templates])

  const typeTemplates = useMemo(
    () => templates.filter((template) => template.messageType === selectedType),
    [selectedType, templates],
  )

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase()
    return templates.filter((template) => {
      if (typeFilter !== "todos" && template.messageType !== typeFilter) return false
      return !term || template.name.toLowerCase().includes(term) || template.content.toLowerCase().includes(term)
    })
  }, [search, templates, typeFilter])

  useEffect(() => {
    if (!open) return
    let active = true
    async function initialize() {
      setLoading(true)
      setFeedback("")
      setTab("mensagem")
      setPhone(recipient?.phone || "")
      setSelectedType(messageType)

      const collaborator = readCollaboratorSession()
      const { data } = await getAccountAuthUser()
      const resolvedOwner = collaborator?.user_id || data.user?.id || "local"
      const loaded = await loadWhatsAppTemplates(resolvedOwner)
      if (!active) return

      setOwnerId(resolvedOwner)
      setCanManage(!collaborator)
      setPersistence(loaded.persistence)
      setTemplates(loaded.templates)
      selectInitialTemplate(loaded.templates, messageType)
      if (loaded.warning) setFeedback(loaded.warning)
      setLoading(false)
    }
    initialize()
    return () => { active = false }
  }, [messageType, open, recipient?.phone])

  function selectInitialTemplate(list: WhatsAppTemplate[], type: string) {
    const candidates = list.filter((template) => template.messageType === type)
    const template = candidates.find((item) => item.isDefault) || candidates[0]
    setSelectedTemplateId(template?.id || "")
    setMessage(template ? replaceWhatsAppTemplateVariables(template.content, variables) : "")
  }

  function changeType(type: string) {
    setSelectedType(type)
    selectInitialTemplate(templates, type)
  }

  function changeTemplate(id: string) {
    setSelectedTemplateId(id)
    const template = templates.find((item) => item.id === id)
    if (template) setMessage(replaceWhatsAppTemplateVariables(template.content, variables))
  }

  async function persist(next: WhatsAppTemplate[], success: string) {
    setBusy(true)
    try {
      const saved = await saveWhatsAppTemplates(ownerId, next, persistence)
      setTemplates(saved)
      setFeedback(success)
      return true
    } catch (error) {
      console.error("Erro ao salvar modelos de WhatsApp:", error)
      setFeedback("Não foi possível salvar os modelos na sua conta. Tente novamente.")
      return false
    } finally {
      setBusy(false)
    }
  }

  function startNewTemplate(prefillCurrent = false) {
    setTab("modelos")
    setEditingId(null)
    setFormName("")
    setFormType(selectedType)
    setFormContent(prefillCurrent ? message : "")
    setFormDefault(false)
    setFeedback("")
  }

  function editTemplate(template: WhatsAppTemplate) {
    setEditingId(template.id)
    setFormName(template.name)
    setFormType(template.messageType)
    setFormContent(template.content)
    setFormDefault(template.isDefault)
    setFeedback("")
  }

  async function saveTemplate() {
    if (!canManage) return
    if (!formName.trim() || !formType.trim() || !formContent.trim()) {
      setFeedback("Preencha nome, tipo e conteúdo do modelo.")
      return
    }
    const now = new Date().toISOString()
    let next = [...templates]
    if (formDefault) {
      next = next.map((template) =>
        template.messageType === formType ? { ...template, isDefault: false } : template,
      )
    }
    if (editingId) {
      next = next.map((template) =>
        template.id === editingId
          ? { ...template, name: formName.trim(), messageType: formType.trim(), content: formContent, isDefault: formDefault, updatedAt: now }
          : template,
      )
      await persist(next, "Modelo atualizado com sucesso.")
    } else {
      const created: WhatsAppTemplate = {
        id: createId(),
        name: formName.trim(),
        messageType: formType.trim(),
        content: formContent,
        isDefault: formDefault,
        createdAt: now,
        updatedAt: now,
      }
      const saved = await persist([...next, created], "Novo modelo salvo com sucesso.")
      if (saved) setEditingId(created.id)
    }
  }

  async function duplicateTemplate(template: WhatsAppTemplate) {
    if (!canManage) return
    const now = new Date().toISOString()
    const copy: WhatsAppTemplate = {
      ...template,
      id: createId(),
      name: `${template.name} (cópia)`,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    await persist([...templates, copy], "Modelo duplicado com sucesso.")
  }

  async function deleteTemplate(template: WhatsAppTemplate) {
    if (!canManage) return
    if (!window.confirm(`Excluir o modelo “${template.name}”? Esta ação não pode ser desfeita.`)) return
    const next = templates.filter((item) => item.id !== template.id)
    const saved = await persist(next, "Modelo excluído.")
    if (saved && editingId === template.id) startNewTemplate()
  }

  async function setDefaultTemplate(template: WhatsAppTemplate) {
    if (!canManage) return
    const next = templates.map((item) => ({
      ...item,
      isDefault: item.messageType === template.messageType ? item.id === template.id : item.isDefault,
    }))
    await persist(next, `“${template.name}” definido como padrão.`)
  }

  function openWhatsApp() {
    const normalized = normalizeWhatsAppPhone(phone)
    if (!normalized) {
      setFeedback("Telefone inválido. Informe DDD e número, por exemplo: 31999999999.")
      return
    }
    if (!message.trim()) {
      setFeedback("A mensagem não pode ficar vazia.")
      return
    }
    setBusy(true)
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
    setBusy(false)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1250] grid place-items-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-5" onMouseDown={() => onOpenChange(false)}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[calc(100dvh-24px)] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,rgba(12,18,36,0.99),rgba(4,29,43,0.99))] text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:max-h-[calc(100dvh-40px)]"
      >
        <header className="flex items-start gap-3 border-b border-white/10 p-4 sm:p-6">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
            <MessageCircle size={23} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="whatsapp-modal-title" className="text-xl font-black tracking-[-0.025em] sm:text-2xl">Enviar WhatsApp</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400 sm:text-sm">Escolha uma mensagem, revise o conteúdo e abra o WhatsApp.</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${persistence === "database" ? "bg-emerald-500/10 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
              {persistence === "database" ? "Sincronizado na conta" : "Salvo neste navegador"}
            </span>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white" aria-label="Fechar">
            <X size={19} />
          </button>
        </header>

        <nav className="grid grid-cols-2 border-b border-white/10 bg-slate-950/20 p-2">
          {(["mensagem", "modelos"] as Tab[]).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-10 rounded-xl text-xs font-black capitalize transition ${tab === item ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}>
              {item}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {feedback && <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-xs font-bold leading-5 text-cyan-100">{feedback}</div>}
          {loading ? (
            <div className="grid min-h-64 place-items-center text-sm font-bold text-slate-400">Carregando modelos...</div>
          ) : tab === "mensagem" ? (
            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">Destinatário</h3>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-300">{contextType}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nome" value={recipient?.name || "Não informado"} readOnly />
                  <Field label="WhatsApp" value={phone} onChange={setPhone} placeholder="DDD + número" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Tipo de Mensagem" value={selectedType} onChange={changeType} options={messageTypes} />
                <SelectField label="Modelo" value={selectedTemplateId} onChange={changeTemplate} options={typeTemplates.map((template) => ({ value: template.id, label: `${template.name}${template.isDefault ? " • Padrão" : ""}` }))} placeholder="Nenhum modelo disponível" />
              </div>
              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-300">Mensagem</span>
                <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={9} className="min-h-52 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/35" />
              </label>
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
                <p className="mb-2 text-[11px] font-black text-slate-400">Variáveis disponíveis</p>
                <div className="flex flex-wrap gap-1.5">
                  {WHATSAPP_VARIABLES.map((variable) => <code key={variable} className="rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] text-cyan-200">{`{${variable}}`}</code>)}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
              <div className="min-w-0">
                <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_190px_auto]">
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar modelo..." className={inputClass} />
                  <GibaSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: "todos", label: "Todos os tipos" }, ...messageTypes]} />
                  {canManage && <button type="button" onClick={() => startNewTemplate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-xs font-black"><Plus size={15} /> Novo</button>}
                </div>
                <div className="grid gap-2">
                  {filteredTemplates.map((template) => (
                    <article key={template.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-sm text-white">{template.name}</strong>
                            {template.isDefault && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase text-amber-300">Padrão</span>}
                          </div>
                          <p className="mt-1 text-[10px] font-bold text-cyan-300">{messageTypeLabel(template.messageType)}</p>
                          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{template.content}</p>
                        </div>
                        {canManage && <div className="flex shrink-0 gap-1">
                          <IconButton label="Editar" onClick={() => editTemplate(template)}><Pencil size={13} /></IconButton>
                          <IconButton label="Duplicar" onClick={() => duplicateTemplate(template)}><Copy size={13} /></IconButton>
                          <IconButton label="Definir como padrão" onClick={() => setDefaultTemplate(template)}><Star size={13} /></IconButton>
                          <IconButton label="Excluir" onClick={() => deleteTemplate(template)} danger><Trash2 size={13} /></IconButton>
                        </div>}
                      </div>
                    </article>
                  ))}
                  {!filteredTemplates.length && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">Nenhum modelo encontrado.</p>}
                </div>
              </div>

              <aside className="rounded-2xl border border-white/[0.08] bg-slate-950/30 p-4">
                {canManage ? <div className="grid gap-3">
                  <h3 className="text-sm font-black text-white">{editingId ? "Editar modelo" : "Novo modelo"}</h3>
                  <Field label="Nome do Modelo" value={formName} onChange={setFormName} placeholder="Ex.: Confirmação simples" />
                  <label className="grid gap-2">
                    <span className="text-xs font-black text-slate-300">Tipo da mensagem</span>
                    <input list="whatsapp-message-types" value={formType} onChange={(event) => setFormType(event.target.value)} className={inputClass} />
                    <datalist id="whatsapp-message-types">{messageTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</datalist>
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-black text-slate-300">Conteúdo</span>
                    <textarea value={formContent} onChange={(event) => setFormContent(event.target.value)} rows={9} className={`${inputClass} min-h-44 resize-y py-3`} />
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] p-3 text-xs font-bold text-slate-300">
                    <input type="checkbox" checked={formDefault} onChange={(event) => setFormDefault(event.target.checked)} className="h-4 w-4 accent-cyan-400" /> Definir como padrão deste tipo
                  </label>
                  <button type="button" disabled={busy} onClick={saveTemplate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 text-xs font-black disabled:opacity-60"><Save size={15} /> {editingId ? "Salvar alterações" : "Salvar modelo"}</button>
                </div> : <div className="grid min-h-56 place-items-center text-center"><div><Check size={24} className="mx-auto text-emerald-300" /><h3 className="mt-3 text-sm font-black">Modelos Disponíveis</h3><p className="mt-1 text-xs leading-5 text-slate-400">Colaboradores podem selecionar e usar modelos, mas não podem alterar a biblioteca global.</p></div></div>}
              </aside>
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-white/10 bg-slate-950/25 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>{canManage && tab === "mensagem" && <button type="button" onClick={() => startNewTemplate(true)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-black text-slate-300 hover:bg-white/[0.08] sm:w-auto"><Save size={15} /> Salvar como novo modelo</button>}</div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <button type="button" onClick={() => onOpenChange(false)} className="min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-5 text-xs font-black text-slate-300 hover:bg-white/[0.08]">Cancelar</button>
            {tab === "mensagem" && <button type="button" disabled={busy || loading} onClick={openWhatsApp} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-xs font-black text-emerald-950 shadow-[0_15px_35px_rgba(16,185,129,0.2)] transition hover:bg-emerald-400 disabled:opacity-60"><MessageCircle size={16} /> {busy ? "Abrindo..." : "Enviar WhatsApp"}</button>}
          </div>
        </footer>
      </section>
    </div>
  )
}

const inputClass = "min-h-11 w-full rounded-xl border border-white/10 bg-slate-950/45 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/35"

function Field({ label, value, onChange, placeholder, readOnly = false }: { label: string; value: string; onChange?: (value: string) => void; placeholder?: string; readOnly?: boolean }) {
  return <label className="grid gap-2"><span className="text-xs font-black text-slate-300">{label}</span><input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} readOnly={readOnly} className={`${inputClass} ${readOnly ? "text-slate-400" : ""}`} /></label>
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; placeholder?: string }) {
  const normalizedOptions = options.length ? options : [{ value: "", label: placeholder || "Nenhuma opção disponível", disabled: true }]
  return <div className="grid gap-2"><span className="text-xs font-black text-slate-300">{label}</span><GibaSelect value={value} onChange={onChange} options={normalizedOptions} /></div>
}

function IconButton({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`grid h-8 w-8 place-items-center rounded-lg border transition ${danger ? "border-rose-400/15 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20" : "border-white/[0.07] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"}`}>{children}</button>
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `modelo-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readCollaboratorSession(): { user_id: string } | null {
  try {
    const session = JSON.parse(localStorage.getItem("giba_colaborador_session") || "null")
    return session?.tipo === "colaborador" && session.user_id ? session : null
  } catch {
    return null
  }
}

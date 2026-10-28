"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import PlanProtectedRoute from "../../../components/PlanProtectedRoute";
import GibaSelect from "../../../components/GibaSelect";
import { supabase } from "../../../lib/supabase";
import { DEFAULT_PROPOSAL_CONTENT } from "../../../lib/proposals/defaults";
import { getCurrentUser, listProposalTemplates } from "../../../lib/proposals/repository";
import { createProposalSignedUrl, uploadProposalAsset } from "../../../lib/proposals/storage";
import {
  DEFAULT_DOCUMENT_TITLE,
  normalizeTemplateContent,
  normalizeTemplateLayout,
  PROPOSAL_TEMPLATE_VARIABLES,
  templatePreviewDraft,
} from "../../../lib/proposals/template";
import type { ProposalCompany, ProposalContentSection, ProposalFormat, ProposalTemplate } from "../../../lib/proposals/types";
import ProposalContentEditor from "../../../components/propostas/ProposalContentEditor";
import ProposalPreview from "../../../components/propostas/ProposalPreview";

type TemplateForm = {
  id: string;
  name: string;
  cover_background_path: string;
  content_background_path: string;
  logo_path: string;
  signature_path: string;
  documentTitle: string;
  responsibleName: string;
  signatureRole: string;
  formatId: string;
  formatName: string;
  defaultDuration: string;
  suggestedValue: number;
  company: ProposalCompany;
  content: ProposalContentSection[];
};

type AssetField = "cover_background_path" | "content_background_path" | "logo_path" | "signature_path";

const createEmptyForm = (): TemplateForm => ({
  id: "",
  name: "",
  cover_background_path: "",
  content_background_path: "",
  logo_path: "",
  signature_path: "",
  documentTitle: DEFAULT_DOCUMENT_TITLE,
  responsibleName: "",
  signatureRole: "",
  formatId: "",
  formatName: "",
  defaultDuration: "",
  suggestedValue: 0,
  company: {},
  content: DEFAULT_PROPOSAL_CONTENT.map((section) => ({ ...section })),
});

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#071122] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50";

const companyFields: Array<{ key: keyof ProposalCompany; label: string; placeholder?: string }> = [
  { key: "razao_social", label: "Nome ou razão social" },
  { key: "cnpj", label: "CPF ou CNPJ" },
  { key: "endereco", label: "Endereço" },
  { key: "numero", label: "Número" },
  { key: "bairro", label: "Bairro" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "cep", label: "CEP" },
  { key: "telefone", label: "Telefone" },
  { key: "email", label: "E-mail" },
];

function AssetUploadBlock({
  title,
  description,
  path,
  previewUrl,
  uploading,
  recommendedRatio,
  recommendedSize,
  onUpload,
  onRemove,
}: {
  title: string;
  description: string;
  path: string;
  previewUrl: string;
  uploading: boolean;
  recommendedRatio?: string;
  recommendedSize?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollStateRef = useRef<{ element: HTMLElement; top: number } | null>(null);

  function receiveFile(files: FileList | null) {
    const file = files?.[0];
    if (file) onUpload(file);
  }

  function openFilePicker(trigger: HTMLButtonElement) {
    triggerRef.current = trigger;

    let ancestor = trigger.parentElement;
    scrollStateRef.current = null;

    while (ancestor) {
      const overflowY = window.getComputedStyle(ancestor).overflowY;
      if (/auto|scroll/.test(overflowY) && ancestor.scrollHeight > ancestor.clientHeight) {
        scrollStateRef.current = { element: ancestor, top: ancestor.scrollTop };
        break;
      }
      ancestor = ancestor.parentElement;
    }

    fileInputRef.current?.click();
  }

  function restorePickerPosition() {
    requestAnimationFrame(() => {
      const scrollState = scrollStateRef.current;
      if (scrollState) scrollState.element.scrollTop = scrollState.top;
      triggerRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-black text-slate-200">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={uploading}
          onClick={(event) => openFilePicker(event.currentTarget)}
          className="group flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-[#071122]/70 px-5 text-center transition hover:border-violet-400/60 hover:bg-violet-500/5"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            receiveFile(event.dataTransfer.files);
          }}
        >
          {recommendedRatio ? (
            <div className="flex aspect-[3/1] w-full max-w-56 flex-col items-center justify-center rounded-xl border border-cyan-400/35 bg-cyan-400/[.04] px-3">
              {uploading ? (
                <Loader2 size={24} className="animate-spin text-violet-300" />
              ) : (
                <ImageIcon size={25} className="text-cyan-300 transition group-hover:scale-105" />
              )}
              <span className="mt-2 text-[10px] font-black uppercase tracking-[.16em] text-cyan-200">
                Área da logo · {recommendedRatio}
              </span>
            </div>
          ) : uploading ? (
            <Loader2 size={28} className="animate-spin text-violet-300" />
          ) : (
            <ImageIcon size={30} className="text-violet-400 transition group-hover:scale-105" />
          )}
          <span className={recommendedRatio ? "mt-3 text-xs font-bold text-slate-300" : "mt-4 text-xs font-bold text-slate-300"}>
            {path ? "Clique ou arraste para substituir" : "Clique para anexar ou arraste a imagem aqui"}
          </span>
          {recommendedSize && (
            <span className="mt-2 text-[10px] font-bold text-cyan-200/80">
              Recomendado: {recommendedSize}
            </span>
          )}
          <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            PNG, JPG ou WEBP · até 8 MB
          </span>
        </button>

        <div className="flex min-h-52 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#071122]">
          <div
            className="relative min-h-0 flex-1 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 bg-center"
            style={
              previewUrl
                ? {
                    backgroundImage: `url(${previewUrl})`,
                    backgroundSize: recommendedRatio ? "contain" : "cover",
                    backgroundRepeat: "no-repeat",
                  }
                : undefined
            }
          >
            {!previewUrl && (
              <div className="absolute inset-0 grid place-items-center px-4 text-center text-xs font-bold text-slate-600">
                A imagem selecionada aparecerá aqui
              </div>
            )}
            {path && (
              <button
                type="button"
                onClick={onRemove}
                title={`Remover ${title.toLowerCase()}`}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-xl border border-white/15 bg-[#071122]/90 text-white transition hover:border-rose-400/40 hover:text-rose-300"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={(event) => openFilePicker(event.currentTarget)}
            className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 border-t border-white/10 text-xs font-black text-slate-200 transition hover:bg-white/5"
          >
            <Pencil size={14} />
            {path ? "Alterar imagem" : "Selecionar imagem"}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={uploading}
        className="hidden"
        onChange={(event) => {
          receiveFile(event.target.files);
          event.target.value = "";
          restorePickerPosition();
        }}
      />
    </div>
  );
}

function PreviewModal({
  template,
  assetUrls,
  page,
  onPageChange,
  onClose,
}: {
  template: ProposalTemplate;
  assetUrls: Record<string, string>;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  const coverUrl = assetUrls[template.cover_background_path] || "";
  const contentUrl = assetUrls[template.content_background_path] || "";
  const backgroundUrl = page === 1 ? coverUrl : contentUrl;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pré-visualização do modelo ${template.name}`}
      className="hidden"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#091426] shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Pré-visualização</p>
            <h2 className="truncate text-lg font-black sm:text-xl">{template.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <X size={19} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-black/20 p-4 sm:p-6">
          <div
            className="relative mx-auto aspect-[1/1.414] w-full max-w-[480px] overflow-hidden rounded-md border border-white/10 bg-[#101827] bg-cover bg-center shadow-2xl"
            style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined}
          >
            {!backgroundUrl && (
              <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-violet-950 via-slate-950 to-cyan-950 p-8 text-center text-sm font-bold text-slate-400">
                {page === 1 ? "Nenhuma capa adicionada" : "Nenhum fundo interno adicionado"}
              </div>
            )}
            {page === 2 && (
              <div className="absolute inset-0 flex flex-col justify-center bg-black/25 p-[9%] text-white">
                <p className="text-[10px] font-black uppercase tracking-[.25em] text-cyan-200">Proposta comercial</p>
                <h3 className="mt-3 text-2xl font-black sm:text-3xl">Título Demonstrativo</h3>
                <p className="mt-3 max-w-md text-xs leading-5 text-slate-100 sm:text-sm sm:leading-6">
                  Este conteúdo demonstra como títulos, textos e informações poderão aparecer sobre o fundo interno do modelo.
                </p>
                <div className="mt-6 rounded-2xl border border-white/20 bg-black/35 p-4 backdrop-blur-sm sm:p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-white">Bloco de exemplo</p>
                  <p className="mt-2 text-xs leading-5 text-slate-200">
                    Espaço reservado para detalhes do evento, formato contratado, valores ou condições comerciais.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black disabled:opacity-30"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Anterior</span>
          </button>
          <span className="rounded-xl bg-white/5 px-4 py-2 text-xs font-black text-slate-300">Página {page} de 2</span>
          <button
            type="button"
            onClick={() => onPageChange(2)}
            disabled={page === 2}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black disabled:opacity-30"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight size={16} />
          </button>
        </footer>
      </section>
    </div>
  );
}

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function DocumentPreviewModal({
  template,
  assetUrls,
  onClose,
}: {
  template: ProposalTemplate;
  assetUrls: Record<string, string>;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização completa do modelo"
      className="fixed inset-0 z-[130] overflow-auto bg-[#030712]/90 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#091426] p-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Pré-visualização completa</p>
            <h2 className="text-lg font-black">{template.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar pré-visualização" className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10">
            <X size={19} />
          </button>
        </div>
        <ProposalPreview proposal={templatePreviewDraft(template)} assetUrls={assetUrls} />
      </div>
    </div>
  );
}

export default function ProposalTemplatesPage() {
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [form, setForm] = useState<TemplateForm>(() => createEmptyForm());
  const [settings, setSettings] = useState<ProposalCompany>({});
  const [formats, setFormats] = useState<ProposalFormat[]>([]);
  const [userId, setUserId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<AssetField | "">("");
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!previewTemplate) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewTemplate(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [previewTemplate]);

  async function load() {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      setUserId(user.id);
      const [rows, settingsResult, formatsResult] = await Promise.all([
        listProposalTemplates(user.id),
        supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("show_formats").select("*").eq("user_id", user.id).order("nome"),
      ]);
      setTemplates(rows);
      setSettings((settingsResult.data || {}) as ProposalCompany);
      setFormats((formatsResult.data || []) as ProposalFormat[]);
      const paths = Array.from(
        new Set(
          rows
            .flatMap((item) => [
              item.cover_background_path,
              item.content_background_path,
              item.logo_path,
              item.signature_path,
            ])
            .filter(Boolean),
        ),
      );
      const signedAssets = await Promise.all(
        paths.map(async (path) => {
          try {
            return [path, path.startsWith("http") ? path : await createProposalSignedUrl(path, 3600)] as const;
          } catch {
            return [path, ""] as const;
          }
        }),
      );
      setAssetUrls((current) => ({ ...current, ...Object.fromEntries(signedAssets) }));
    } catch (error) {
      console.error(error);
      setFeedback("Não foi possível carregar os modelos. Verifique a configuração do módulo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(field: AssetField, file: File) {
    if (!userId) return;
    setUploading(field);
    setFeedback("");
    try {
      const path = await uploadProposalAsset(userId, file, "templates");
      setAssetUrls((current) => ({ ...current, [path]: URL.createObjectURL(file) }));
      setForm((current) => ({ ...current, [field]: path }));
      setFeedback("Imagem anexada. Salve o modelo para confirmar a alteração.");
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : "Erro ao anexar imagem.");
    } finally {
      setUploading("");
    }
  }

  async function fillFromSettings() {
    const logoPath = String(settings.logo_url || "");
    const signaturePath = String(settings.signature_url || "");
    setForm((current) => ({
      ...current,
      company: {
        ...settings,
        cnpj: settings.cnpj || settings.cpf || "",
        endereco: settings.endereco || settings.endereco_completo || "",
      },
      logo_path: logoPath || current.logo_path,
      signature_path: signaturePath || current.signature_path,
      responsibleName: String(settings.responsavel || current.responsibleName || ""),
    }));
    const paths = [logoPath, signaturePath].filter((path) => path && !path.startsWith("http"));
    const signed = await Promise.all(
      paths.map(async (path) => {
        try {
          return [path, await createProposalSignedUrl(path, 3600)] as const;
        } catch {
          return [path, ""] as const;
        }
      }),
    );
    setAssetUrls((current) => ({ ...current, ...Object.fromEntries(signed) }));
    setFeedback("Dados atuais das Configurações copiados para o modelo.");
  }

  async function save() {
    if (!form.name.trim()) {
      setFeedback("Informe o nome do modelo.");
      return;
    }
    if (!form.formatId || !form.formatName) {
      setFeedback("Selecione o formato de show associado ao modelo.");
      return;
    }
    if (!form.cover_background_path) {
      setFeedback("Adicione a capa da proposta.");
      return;
    }
    if (!form.content_background_path) {
      setFeedback("Adicione o fundo das páginas internas.");
      return;
    }

    setSaving(true);
    setFeedback("");
    try {
      const existing = templates.find((item) => item.id === form.id);
      const payload = {
        user_id: userId,
        name: form.name.trim(),
        description: existing?.description ?? "",
        template_type: existing?.template_type ?? "classico",
        is_default: existing?.is_default ?? false,
        primary_color: existing?.primary_color ?? "#7c3aed",
        secondary_color: existing?.secondary_color ?? "#0ea5e9",
        text_color: existing?.text_color ?? "#0f172a",
        default_content: form.content.map((section) => ({ ...section })),
        layout_config: {
          documentTitle: form.documentTitle,
          responsibleName: form.responsibleName,
          signatureRole: form.signatureRole,
          formatId: form.formatId,
          formatName: form.formatName,
          defaultDuration: form.defaultDuration,
          suggestedValue: form.suggestedValue,
          company: { ...form.company },
        },
        cover_background_path: form.cover_background_path,
        content_background_path: form.content_background_path,
        default_photo_path: existing?.default_photo_path ?? "",
        logo_path: form.logo_path,
        signature_path: form.signature_path,
      };
      const query = form.id
        ? supabase.from("proposal_templates").update(payload).eq("id", form.id).eq("user_id", userId)
        : supabase.from("proposal_templates").insert(payload);
      const { error } = await query;
      if (error) throw error;
      setForm(createEmptyForm());
      setFeedback(form.id ? "Alterações salvas com sucesso." : "Modelo salvo com sucesso.");
      await load();
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : "Erro ao salvar modelo.");
    } finally {
      setSaving(false);
    }
  }

  function edit(item: ProposalTemplate) {
    const layout = normalizeTemplateLayout(item.layout_config);
    setForm({
      id: item.id,
      name: item.name,
      cover_background_path: item.cover_background_path,
      content_background_path: item.content_background_path,
      logo_path: item.logo_path,
      signature_path: item.signature_path,
      documentTitle: layout.documentTitle,
      responsibleName: layout.responsibleName,
      signatureRole: layout.signatureRole,
      formatId: layout.formatId,
      formatName: layout.formatName,
      defaultDuration: layout.defaultDuration,
      suggestedValue: layout.suggestedValue,
      company: { ...layout.company },
      content: normalizeTemplateContent(item.default_content),
    });
    setFeedback("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openPreview(item: ProposalTemplate) {
    setPreviewTemplate(item);
  }

  async function duplicate(item: ProposalTemplate) {
    const { error } = await supabase.from("proposal_templates").insert({
      ...item,
      id: undefined,
      name: `${item.name} (cópia)`,
      is_default: false,
      created_at: undefined,
      updated_at: undefined,
    });
    if (error) setFeedback(error.message);
    else {
      setFeedback("Modelo duplicado com sucesso.");
      await load();
    }
  }

  async function remove(item: ProposalTemplate) {
    if (!confirm(`Excluir o modelo ${item.name}? As propostas já criadas serão preservadas.`)) return;
    const { error } = await supabase
      .from("proposal_templates")
      .delete()
      .eq("id", item.id)
      .eq("user_id", userId);
    if (error) setFeedback(error.message);
    else {
      if (form.id === item.id) setForm(createEmptyForm());
      setFeedback("Modelo excluído com sucesso.");
      await load();
    }
  }

  const liveTemplate: ProposalTemplate = {
    id: form.id || "preview",
    user_id: userId,
    name: form.name || "Novo modelo",
    description: "",
    template_type: "classico",
    is_default: false,
    cover_background_path: form.cover_background_path,
    content_background_path: form.content_background_path,
    default_photo_path: "",
    logo_path: form.logo_path,
    signature_path: form.signature_path,
    primary_color: "#7c3aed",
    secondary_color: "#0ea5e9",
    text_color: "#0f172a",
    layout_config: {
      documentTitle: form.documentTitle,
      responsibleName: form.responsibleName,
      signatureRole: form.signatureRole,
      formatId: form.formatId,
      formatName: form.formatName,
      defaultDuration: form.defaultDuration,
      suggestedValue: form.suggestedValue,
      company: form.company,
    },
    default_content: form.content,
    created_at: "",
    updated_at: "",
  };

  return (
    <ProtectedRoute modulo="propostas">
      <PlanProtectedRoute modulo="propostas">
        <AppLayout>
          <main className="min-h-screen text-white">
            <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500">
                  <LayoutTemplate size={24} />
                </div>
                <div>
                  <h1 className="text-[28px] font-black">Modelos de Proposta</h1>
                  <p className="text-sm text-slate-400">
                    Gerencie os modelos visuais usados como ponto de partida para novas propostas.
                  </p>
                </div>
              </div>
              <Link
                href="/propostas"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 text-center font-black transition hover:bg-white/5"
              >
                <ArrowLeft size={17} />
                Voltar às propostas
              </Link>
            </header>

            {feedback && (
              <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-100">
                {feedback}
              </div>
            )}

            <div className="grid items-start gap-5 xl:grid-cols-[510px_minmax(0,1fr)]">
              <section className="rounded-[24px] border border-violet-400/30 bg-white/[.045] p-5 sm:p-6">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-black">
                    <Plus size={20} className="text-violet-300" />
                    {form.id ? "Editar modelo" : "Novo modelo"}
                  </h2>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {form.id
                      ? "Substitua a capa ou o fundo interno e salve as alterações."
                      : "Crie um novo modelo adicionando a capa e o fundo das páginas."}
                  </p>
                </div>

                <div className="mt-6 space-y-7">
                  <label className="block text-sm font-black text-slate-200">
                    Nome do modelo
                    <input
                      className={inputClass}
                      value={form.name}
                      placeholder="Ex.: Proposta Comercial Acústico"
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </label>

                  <div className="rounded-2xl border border-white/10 bg-white/[.025] p-4">
                    <h3 className="text-sm font-black text-slate-200">Formato Associado ao Modelo</h3>
                    <p className="mt-1 text-xs text-slate-500">Este formato será aplicado automaticamente ao criar uma proposta.</p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-2 text-xs font-bold text-slate-300 sm:col-span-2">
                        <span>Nome do formato de show</span>
                        <GibaSelect
                          value={form.formatId}
                          onChange={(formatId) => {
                            const selected = formats.find((format) => format.id === formatId);
                            setForm({
                              ...form,
                              formatId: selected?.id || "",
                              formatName: selected?.nome || "",
                              defaultDuration: selected?.duracao_padrao || form.defaultDuration,
                              suggestedValue: selected?.valor_sugerido ? Number(selected.valor_sugerido) : form.suggestedValue,
                            });
                          }}
                          options={[
                            { value: "", label: "Selecione um formato cadastrado" },
                            ...formats.map((format) => ({ value: format.id, label: format.nome })),
                          ]}
                          searchable
                        />
                      </div>
                      <label className="text-xs font-bold text-slate-300">
                        Tempo padrão do show
                        <input
                          value={form.defaultDuration}
                          onChange={(event) => setForm({ ...form, defaultDuration: event.target.value })}
                          className={inputClass}
                          placeholder="Ex.: 2 horas"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-300">
                        Valor sugerido
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={form.suggestedValue || ""}
                          onChange={(event) => setForm({ ...form, suggestedValue: Number(event.target.value || 0) })}
                          className={inputClass}
                          placeholder="0,00"
                        />
                      </label>
                    </div>
                  </div>

                  <AssetUploadBlock
                    title="Capa da proposta"
                    description="Imagem usada como primeira página da proposta."
                    path={form.cover_background_path}
                    previewUrl={assetUrls[form.cover_background_path] || ""}
                    uploading={uploading === "cover_background_path"}
                    onUpload={(file) => void handleUpload("cover_background_path", file)}
                    onRemove={() => setForm({ ...form, cover_background_path: "" })}
                  />

                  <AssetUploadBlock
                    title="Fundo das páginas internas"
                    description="Imagem aplicada como fundo nas páginas de conteúdo da proposta."
                    path={form.content_background_path}
                    previewUrl={assetUrls[form.content_background_path] || ""}
                    uploading={uploading === "content_background_path"}
                    onUpload={(file) => void handleUpload("content_background_path", file)}
                    onRemove={() => setForm({ ...form, content_background_path: "" })}
                  />

                  <details open className="rounded-2xl border border-white/10 bg-white/[.025]">
                    <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-black">
                      <Building2 size={18} className="text-cyan-300" />
                      Dados fixos da empresa
                    </summary>
                    <div className="border-t border-white/10 p-4">
                      <button
                        type="button"
                        onClick={() => void fillFromSettings()}
                        className="mb-4 min-h-10 w-full rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 text-xs font-black text-violet-100"
                      >
                        Preencher com dados das Configurações
                      </button>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {companyFields.map((field) => (
                          <label key={field.key} className="text-xs font-bold text-slate-300">
                            {field.label}
                            <input
                              value={String(form.company[field.key] || "")}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  company: { ...form.company, [field.key]: event.target.value },
                                })
                              }
                              className={inputClass}
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  </details>

                  <details open className="rounded-2xl border border-white/10 bg-white/[.025]">
                    <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-black">
                      <LayoutTemplate size={18} className="text-cyan-300" />
                      Conteúdo fixo
                    </summary>
                    <div className="space-y-5 border-t border-white/10 p-4">
                      <label className="block text-sm font-black text-slate-200">
                        Título principal
                        <input
                          value={form.documentTitle}
                          onChange={(event) => setForm({ ...form, documentTitle: event.target.value })}
                          className={inputClass}
                        />
                      </label>
                      <ProposalContentEditor
                        sections={form.content}
                        variables={PROPOSAL_TEMPLATE_VARIABLES}
                        onChange={(content) => setForm({ ...form, content })}
                      />
                    </div>
                  </details>

                  <details open className="rounded-2xl border border-white/10 bg-white/[.025]">
                    <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-black">
                      <Pencil size={18} className="text-cyan-300" />
                      Logomarca e assinatura
                    </summary>
                    <div className="space-y-5 border-t border-white/10 p-4">
                      <button
                        type="button"
                        onClick={() => void fillFromSettings()}
                        className="min-h-10 w-full rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 text-xs font-black text-violet-100"
                      >
                        Preencher com dados das Configurações
                      </button>
                      <AssetUploadBlock
                        title="Logomarca"
                        description="Imagem exibida em destaque no canto superior direito das páginas internas. Use um arquivo sem margens transparentes excedentes."
                        path={form.logo_path}
                        previewUrl={assetUrls[form.logo_path] || (form.logo_path.startsWith("http") ? form.logo_path : "")}
                        uploading={uploading === "logo_path"}
                        recommendedRatio="3:1"
                        recommendedSize="1500 × 500 px, preferencialmente PNG transparente"
                        onUpload={(file) => void handleUpload("logo_path", file)}
                        onRemove={() => setForm({ ...form, logo_path: "" })}
                      />
                      <AssetUploadBlock
                        title="Assinatura"
                        description="Imagem centralizada no rodapé da proposta."
                        path={form.signature_path}
                        previewUrl={assetUrls[form.signature_path] || (form.signature_path.startsWith("http") ? form.signature_path : "")}
                        uploading={uploading === "signature_path"}
                        onUpload={(file) => void handleUpload("signature_path", file)}
                        onRemove={() => setForm({ ...form, signature_path: "" })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-bold text-slate-300">
                          Nome do responsável
                          <input value={form.responsibleName} onChange={(event) => setForm({ ...form, responsibleName: event.target.value })} className={inputClass} />
                        </label>
                        <label className="text-xs font-bold text-slate-300">
                          Texto ou função
                          <input value={form.signatureRole} onChange={(event) => setForm({ ...form, signatureRole: event.target.value })} className={inputClass} />
                        </label>
                      </div>
                    </div>
                  </details>

                  <details className="rounded-2xl border border-white/10 bg-white/[.025]">
                    <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-black">
                      <Eye size={18} className="text-cyan-300" />
                      Pré-visualização automática
                    </summary>
                    <div className="border-t border-white/10 p-3">
                      <ProposalPreview proposal={templatePreviewDraft(liveTemplate)} assetUrls={assetUrls} />
                    </div>
                  </details>

                  <button
                    type="button"
                    onClick={() => void save()}
                    disabled={saving || Boolean(uploading)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 px-5 font-black shadow-lg shadow-violet-950/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Salvar modelo"}
                  </button>
                  {form.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setForm(createEmptyForm());
                        setFeedback("");
                      }}
                      className="min-h-11 w-full rounded-2xl border border-white/10 font-bold transition hover:bg-white/5"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </section>

              <section className="min-w-0 rounded-[24px] border border-white/10 bg-white/[.025] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-xl font-black">Modelos Salvos</h2>
                  <span className="rounded-xl bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-400">
                    {templates.length} {templates.length === 1 ? "modelo" : "modelos"}
                  </span>
                </div>

                {loading ? (
                  <div className="grid min-h-48 place-items-center text-slate-400">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/15 p-8 text-center">
                    <div>
                      <LayoutTemplate size={34} className="mx-auto text-slate-600" />
                      <h3 className="mt-4 text-lg font-black">Nenhum Modelo Cadastrado Ainda.</h3>
                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                        Adicione uma capa e um fundo interno para criar seu primeiro modelo de proposta.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {templates.map((item) => {
                      const coverUrl = assetUrls[item.cover_background_path] || "";
                      const createdAt = formatCreatedAt(item.created_at);
                      return (
                        <article
                          key={item.id}
                          className="grid gap-4 rounded-2xl border border-white/10 bg-[#071122]/75 p-3 transition hover:border-white/20 sm:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[190px_minmax(0,1fr)_132px]"
                        >
                          <div
                            className="aspect-[1.45/1] overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 bg-cover bg-center"
                            style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : undefined}
                          >
                            {!coverUrl && (
                              <div className="grid h-full place-items-center text-slate-600">
                                <ImageIcon size={26} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 self-center">
                            <h3 className="truncate text-lg font-black">{item.name}</h3>
                            <div className="mt-4 space-y-2 text-xs font-bold">
                              <p className={item.cover_background_path ? "text-slate-300" : "text-slate-500"}>
                                <CheckCircle2
                                  size={15}
                                  className={`mr-2 inline ${item.cover_background_path ? "text-lime-400" : "text-slate-600"}`}
                                />
                                {item.cover_background_path ? "Capa adicionada" : "Capa não adicionada"}
                              </p>
                              <p className={item.content_background_path ? "text-slate-300" : "text-slate-500"}>
                                <CheckCircle2
                                  size={15}
                                  className={`mr-2 inline ${item.content_background_path ? "text-lime-400" : "text-slate-600"}`}
                                />
                                {item.content_background_path ? "Fundo interno adicionado" : "Fundo interno não adicionado"}
                              </p>
                            </div>
                            {createdAt && <p className="mt-4 text-[11px] text-slate-500">Criado em {createdAt}</p>}
                          </div>

                          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-1 lg:grid-cols-1 lg:self-center">
                            <button
                              type="button"
                              onClick={() => openPreview(item)}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black transition hover:bg-white/5"
                            >
                              <Eye size={14} /> Visualizar
                            </button>
                            <button
                              type="button"
                              onClick={() => edit(item)}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black transition hover:bg-white/5"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void duplicate(item)}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-black transition hover:bg-white/5"
                            >
                              <Copy size={14} /> Duplicar
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(item)}
                              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-rose-400/20 px-3 text-xs font-black text-rose-300 transition hover:bg-rose-400/10"
                            >
                              <Trash2 size={14} /> Excluir
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {previewTemplate && (
              <DocumentPreviewModal
                template={previewTemplate}
                assetUrls={assetUrls}
                onClose={() => setPreviewTemplate(null)}
              />
            )}
          </main>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

"use client";

import { ArrowLeft, CheckCircle2, Eye, Loader2, Save, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { createEmptyProposalDraft } from "../../lib/proposals/defaults";
import { createProposalSignedUrl } from "../../lib/proposals/storage";
import { getCurrentUser, getProposal, listProposalTemplates, saveProposal } from "../../lib/proposals/repository";
import { applyTemplateToDraft, normalizeTemplateLayout } from "../../lib/proposals/template";
import { durationWithoutInterval, formatCurrency, normalizeIntervalDuration, totalDuration } from "../../lib/proposals/variables";
import { proposalCreationDates } from "../../lib/proposals/dates";
import type {
  ProposalClient,
  ProposalDraft,
  ProposalTemplate,
} from "../../lib/proposals/types";
import ProposalPreview from "./ProposalPreview";

const inputClass =
  "mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-[#071122] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50";
const labelClass = "text-sm font-extrabold text-slate-300";

function parseCurrency(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits || 0) / 100;
}

export default function ProposalForm({ proposalId }: { proposalId?: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState<ProposalDraft>(() => createEmptyProposalDraft());
  const [clients, setClients] = useState<ProposalClient[]>([]);
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [proposalId]);

  async function load() {
    setLoading(true);
    setFeedback("");
    try {
      const user = await getCurrentUser();
      setUserId(user.id);
      const [clientsResult, templateRows] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).order("nome"),
        listProposalTemplates(user.id),
      ]);
      const clientRows = (clientsResult.data || []) as ProposalClient[];
      setClients(clientRows);
      setTemplates(templateRows);

      const paths = Array.from(
        new Set(
          templateRows
            .flatMap((template) => [
              template.cover_background_path,
              template.content_background_path,
              template.logo_path,
              template.signature_path,
            ])
            .filter(Boolean),
        ),
      );
      const signed = await Promise.all(
        paths.map(async (path) => {
          try {
            return [path, path.startsWith("http") ? path : await createProposalSignedUrl(path, 3600)] as const;
          } catch {
            return [path, ""] as const;
          }
        }),
      );
      setAssetUrls(Object.fromEntries(signed));

      if (proposalId) {
        const proposal = await getProposal(user.id, proposalId);
        setDraft({
          ...proposal,
          visual_config: {
            ...createEmptyProposalDraft().visual_config,
            ...proposal.visual_config,
          },
        });
        setClientSearch(String(proposal.client_snapshot.nome || ""));
        setTemplateSearch(templateRows.find((template) => template.id === proposal.template_id)?.name || "");
      }
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : "Não foi possível carregar o formulário.");
    } finally {
      setLoading(false);
    }
  }

  const selectedTemplate = templates.find((item) => item.id === draft.template_id);
  const selectedTemplateLayout = selectedTemplate ? normalizeTemplateLayout(selectedTemplate.layout_config) : null;
  const intervalValue = String(draft.format_snapshot.intervalo || "").trim();
  const normalizedIntervalValue = intervalValue.toLocaleLowerCase("pt-BR");
  const intervalFlag = draft.format_snapshot._has_interval;
  const hasInterval = normalizedIntervalValue !== "sem intervalo" && (intervalFlag === true || (intervalFlag !== false && Boolean(intervalValue)));
  const showDuration = durationWithoutInterval(draft.format_snapshot.tempo_show, hasInterval ? intervalValue : "");
  const calculatedDuration = totalDuration(showDuration, hasInterval ? intervalValue : "");
  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) return clients.slice(0, 8);
    return clients.filter((item) => item.nome.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 8);
  }, [clientSearch, clients]);

  const filteredTemplates = useMemo(() => {
    const term = templateSearch.trim().toLocaleLowerCase("pt-BR");
    if (!term) return templates;
    return templates.filter((item) => item.name.toLocaleLowerCase("pt-BR").includes(term));
  }, [templateSearch, templates]);

  function update<K extends keyof ProposalDraft>(key: K, value: ProposalDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectClient(client: ProposalClient) {
    setDraft((current) => ({
      ...current,
      client_id: client.id,
      client_snapshot: { ...client },
    }));
    setClientSearch(client.nome);
    setClientMenuOpen(false);
  }

  function useTypedClientName() {
    const name = clientSearch.trim();
    if (!name) return;
    setDraft((current) => ({
      ...current,
      client_id: null,
      client_snapshot: { nome: name },
    }));
    setClientSearch(name);
    setClientMenuOpen(false);
  }

  function selectTemplate(template: ProposalTemplate) {
    setDraft((current) => applyTemplateToDraft(current, template));
    setTemplateSearch(template.name);
    setTemplateMenuOpen(false);
  }

  async function handleSave() {
    if (!draft.title.trim()) return setFeedback("Informe o título da proposta.");
    const clientName = String(draft.client_snapshot.nome || clientSearch).trim();
    if (!clientName) return setFeedback("Selecione um cliente ou informe um nome.");
    if (!draft.template_id) return setFeedback("Selecione um modelo.");
    setSaving(true);
    setFeedback("");
    try {
      const dates = proposalId
        ? { issueDate: draft.issue_date, expirationDate: draft.expiration_date }
        : proposalCreationDates();
      const saved = await saveProposal(userId, {
        ...draft,
        client_id: draft.client_id || null,
        client_snapshot: draft.client_id ? draft.client_snapshot : { ...draft.client_snapshot, nome: clientName },
        issue_date: dates.issueDate,
        expiration_date: dates.expirationDate,
      });
      router.push("/propostas/" + saved.id);
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : "Erro ao salvar proposta.");
    } finally {
      setSaving(false);
    }
  }

  const summary: Array<[string, string]> = [
    ["Título", draft.title || "—"],
    ["Cliente", String(draft.client_snapshot.nome || "—")],
    ["Modelo", selectedTemplate?.name || "—"],
    ["Formato", String(draft.format_snapshot.nome || "—")],
    ["Tempo de show", String(draft.format_snapshot.tempo_show || "—")],
    ["Intervalo", hasInterval && intervalValue ? normalizeIntervalDuration(intervalValue) : "Sem intervalo"],
    ["Valor", formatCurrency(draft.amount)],
    ["Validade", "15 dias após a criação"],
  ];

  if (loading) {
    return <div className="grid min-h-[45vh] place-items-center text-slate-400"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {feedback && (
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100">
          {feedback}
        </div>
      )}

      <section className="rounded-[26px] border border-white/10 bg-white/[.045] p-5 sm:p-7">
        <div>
          <h2 className="text-xl font-black">Informações da Proposta</h2>
          <p className="mt-1 text-sm text-slate-400">Preencha os dados variáveis deste orçamento.</p>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Título da proposta
            <input value={draft.title} onChange={(event) => update("title", event.target.value)} className={inputClass} />
          </label>

          <div className="relative">
            <label className={labelClass}>
              Nome do cliente
              <span className="relative block">
                <Search size={17} className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-500" />
                <input
                  value={clientSearch}
                  onFocus={() => setClientMenuOpen(true)}
                  onBlur={() => window.setTimeout(() => setClientMenuOpen(false), 150)}
                  onChange={(event) => {
                    const name = event.target.value;
                    setClientSearch(name);
                    setClientMenuOpen(true);
                    setDraft((current) => {
                      const linkedClient = clients.find((client) => client.id === current.client_id);
                      if (linkedClient && name === linkedClient.nome) return current;
                      return {
                        ...current,
                        client_id: null,
                        client_snapshot: name.trim() ? { nome: name } : {},
                      };
                    });
                  }}
                  className={inputClass + " pl-11"}
                  placeholder="Selecione um cliente ou digite um nome"
                />
              </span>
            </label>
            <p className={`mt-2 text-xs font-bold ${draft.client_id ? "text-emerald-300" : clientSearch.trim() ? "text-cyan-300" : "text-slate-500"}`}>
              {draft.client_id
                ? "Cliente cadastrado selecionado."
                : clientSearch.trim()
                  ? "Cliente avulso — será usado somente nesta proposta."
                  : "Pesquise na base ou informe livremente o nome do cliente."}
            </p>
            {clientMenuOpen && clientSearch && !draft.client_id && (
              <div className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-2xl border border-white/10 bg-[#0a1528] p-2 shadow-2xl">
                {filteredClients.map((client) => (
                  <button type="button" key={client.id} onClick={() => selectClient(client)} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-white/5">
                    {client.nome}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={useTypedClientName}
                  className="mt-1 block w-full rounded-xl border border-cyan-400/20 bg-cyan-400/[.06] px-3 py-2 text-left text-sm font-bold text-cyan-200 hover:bg-cyan-400/10"
                >
                  Usar “{clientSearch.trim()}” somente nesta proposta
                </button>
              </div>
            )}
          </div>

          <div className="relative md:col-span-2">
            <label className={labelClass}>
              Selecionar modelo
              <span className="relative block">
                <Search size={17} className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-500" />
                <input
                  value={templateSearch}
                  onFocus={() => setTemplateMenuOpen(true)}
                  onBlur={() => window.setTimeout(() => setTemplateMenuOpen(false), 150)}
                  onChange={(event) => {
                    setTemplateSearch(event.target.value);
                    setTemplateMenuOpen(true);
                    if (selectedTemplate && event.target.value !== selectedTemplate.name) {
                      update("template_id", null);
                    }
                  }}
                  className={inputClass + " pl-11"}
                  placeholder="Pesquisar e selecionar modelo"
                />
              </span>
            </label>
            {templateMenuOpen && (
              <div className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-white/10 bg-[#0a1528] p-2 shadow-2xl">
                {filteredTemplates.map((template) => {
                  const cover = assetUrls[template.cover_background_path] || "";
                  return (
                    <button
                      type="button"
                      key={template.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectTemplate(template)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5"
                    >
                      <div
                        className="h-14 w-11 shrink-0 rounded-lg bg-slate-900 bg-cover bg-center"
                        style={cover ? { backgroundImage: "url(" + cover + ")" } : undefined}
                      />
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-black">{template.name}</strong>
                        {normalizeTemplateLayout(template.layout_config).formatName && (
                          <small className="mt-0.5 block truncate text-xs text-slate-500">
                            {normalizeTemplateLayout(template.layout_config).formatName}
                          </small>
                        )}
                      </span>
                    </button>
                  );
                })}
                {filteredTemplates.length === 0 && <p className="p-3 text-sm text-slate-500">Nenhum modelo encontrado.</p>}
              </div>
            )}
            {selectedTemplate && (
              <div className="mt-3 grid gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:items-center">
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="aspect-[1/1.414] rounded-lg bg-slate-900 bg-cover bg-center"
                    style={assetUrls[selectedTemplate.cover_background_path] ? { backgroundImage: "url(" + assetUrls[selectedTemplate.cover_background_path] + ")" } : undefined}
                    title="Capa"
                  />
                  <div
                    className="aspect-[1/1.414] rounded-lg bg-slate-900 bg-cover bg-center"
                    style={assetUrls[selectedTemplate.content_background_path] ? { backgroundImage: "url(" + assetUrls[selectedTemplate.content_background_path] + ")" } : undefined}
                    title="Página interna"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-black">{selectedTemplate.name}</p>
                  {selectedTemplateLayout?.formatName && (
                    <p className="mt-1 text-xs font-bold text-cyan-300">{selectedTemplateLayout.formatName}</p>
                  )}
                  <p className="text-xs text-slate-400">Capa e página interna serão aplicadas automaticamente.</p>
                </div>
                <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-xs font-black">
                  <Eye size={15} /> Visualizar modelo
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-5 md:col-span-2 lg:grid-cols-3 lg:items-start">
            <label className={labelClass}>
              Tempo de show
              <input
                value={String(draft.format_snapshot.tempo_show || "")}
                onChange={(event) => update("format_snapshot", { ...draft.format_snapshot, tempo_show: event.target.value })}
                className={inputClass}
                placeholder="Ex.: 2 horas e 30 minutos"
              />
              <span className="mt-2 block text-xs font-medium text-slate-500">Informe somente o tempo da apresentação.</span>
            </label>

            <div>
              <label className={labelClass}>
                Intervalo <span className="text-xs font-medium text-slate-500">(minutos)</span>
                <input
                  value={hasInterval ? intervalValue : ""}
                  onChange={(event) => {
                    const nextInterval = event.target.value.replace(/\D/g, "");
                    update("format_snapshot", {
                      ...draft.format_snapshot,
                      tempo_show: durationWithoutInterval(draft.format_snapshot.tempo_show, nextInterval),
                      intervalo: nextInterval,
                      _has_interval: true,
                    });
                  }}
                  inputMode="numeric"
                  disabled={!hasInterval}
                  className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-45`}
                  placeholder={hasInterval ? "Ex.: 30" : "Sem intervalo"}
                />
              </label>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-400">
                <input
                  type="checkbox"
                  checked={!hasInterval}
                  onChange={(event) => update("format_snapshot", {
                    ...draft.format_snapshot,
                    intervalo: event.target.checked ? "" : intervalValue,
                    _has_interval: !event.target.checked,
                  })}
                  className="h-4 w-4 rounded border-white/20 bg-[#071122] accent-cyan-400"
                />
                Sem intervalo
              </label>
              <span className="mt-2 block text-xs font-medium text-cyan-300">
                Tempo total: {calculatedDuration || "informe o tempo do show"}.
              </span>
            </div>

            <label className={labelClass}>
              Valor da proposta
              <input value={formatCurrency(draft.amount)} onChange={(event) => update("amount", parseCurrency(event.target.value))} inputMode="numeric" className={inputClass} />
            </label>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-[#071122]/75 p-5">
          <h3 className="font-black">Resumo da Proposta</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.map(([label, value]) => (
              <div key={label}>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                <p className="mt-1 truncate text-sm font-bold text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/propostas" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 font-extrabold text-slate-300">
            <ArrowLeft size={18} /> Cancelar
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => setPreviewOpen(true)} disabled={!draft.template_id} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 font-black disabled:opacity-40">
              <Eye size={18} /> Visualizar proposta
            </button>
            <button type="button" disabled={saving} onClick={() => void handleSave()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 px-6 font-black disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : proposalId ? <Save size={18} /> : <CheckCircle2 size={18} />}
              {saving ? "Salvando..." : proposalId ? "Salvar alterações" : "Salvar proposta"}
            </button>
          </div>
        </footer>
      </section>

      {previewOpen && (
        <div className="fixed inset-0 z-[130] overflow-auto bg-[#030712]/90 p-3 backdrop-blur-md sm:p-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-[#091426] p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Documento completo</p>
                <h2 className="text-lg font-black">{draft.title}</h2>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Fechar visualização" className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10">
                <X size={19} />
              </button>
            </div>
            <ProposalPreview proposal={draft} assetUrls={assetUrls} />
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Braces,
  CalendarDays,
  FileText,
  Plus,
  Save,
  ScrollText,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import AppLayout from "../../components/AppLayout";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import ProtectedRoute from "../../components/ProtectedRoute";
import ContractTemplatePreview from "../../components/contratos/ContractTemplatePreview";
import { getAccountAuthUser } from "../../lib/access-session";
import {
  CONTRACT_VARIABLES,
  countClausesBefore,
  createContractClause,
  normalizeContractTopics,
  type ContractClause,
  type ContractTopic,
  type LegacyContractFields,
} from "../../lib/contracts/template";
import { supabase } from "../../lib/supabase";

type ContractSettings = LegacyContractFields & {
  id?: string;
  user_id?: string;
  titulo: string;
  contratado_texto: string;
  cidade_assinatura: string;
  topicos: ContractTopic[];
};

const emptyLegacy: Required<LegacyContractFields> = {
  objeto_base: "",
  remuneracao_base: "",
  obrigacao_contratado: "",
  obrigacao_contratante: "",
  multa_contratado: "",
  multa_contratante: "",
  foro: "",
  texto_final: "",
};

function createInitialForm(): ContractSettings {
  return {
    ...emptyLegacy,
    titulo: "Contrato de Prestação de Serviços Artísticos",
    contratado_texto: "",
    cidade_assinatura: "",
    topicos: normalizeContractTopics([], emptyLegacy),
  };
}

export default function ContratosModeloPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState<ContractSettings>(createInitialForm);

  useEffect(() => {
    void carregarModelo();
  }, []);

  async function obterUsuarioLogado() {
    const { data, error } = await getAccountAuthUser();
    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }
    return data.user;
  }

  async function carregarModelo() {
    try {
      const user = await obterUsuarioLogado();
      if (!user) return;

      const [modeloRes, empresaRes] = await Promise.all([
        supabase
          .from("contract_settings")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("company_settings")
          .select("cidade")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const { error } = modeloRes;

      if (error) throw error;
      if (empresaRes.error) throw empresaRes.error;

      const data = [...(modeloRes.data || [])].sort((first, second) => {
        const firstTopics = Array.isArray(first.topicos) ? first.topicos.length : 0;
        const secondTopics = Array.isArray(second.topicos) ? second.topicos.length : 0;
        return secondTopics - firstTopics;
      })[0] || null;
      const cidadeEmpresa = empresaRes.data?.cidade?.trim() || "";
      if (!data) {
        setForm((current) => ({ ...current, cidade_assinatura: cidadeEmpresa }));
        return;
      }

      const legacy: LegacyContractFields = {
        objeto_base: data.objeto_base || "",
        remuneracao_base: data.remuneracao_base || "",
        obrigacao_contratado: data.obrigacao_contratado || "",
        obrigacao_contratante: data.obrigacao_contratante || "",
        multa_contratado: data.multa_contratado || "",
        multa_contratante: data.multa_contratante || "",
        foro: data.foro || "",
        texto_final: data.texto_final || "",
      };

      setForm({
        id: data.id,
        user_id: user.id,
        titulo: data.titulo || "Contrato de Prestação de Serviços Artísticos",
        contratado_texto: data.contratado_texto || "",
        cidade_assinatura: cidadeEmpresa,
        ...legacy,
        topicos: normalizeContractTopics(data.topicos, legacy),
      });
    } catch (error) {
      console.error(error);
      setFeedback("Não foi possível carregar o modelo de contrato.");
    } finally {
      setLoading(false);
    }
  }

  function updateTopic(index: number, changes: Partial<ContractTopic>) {
    setForm((current) => ({
      ...current,
      topicos: current.topicos.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, ...changes } : topic,
      ),
    }));
  }

  function addTopic() {
    setForm((current) => ({
      ...current,
      topicos: [
        ...current.topicos,
        {
          id: crypto.randomUUID(),
          title: "NOVO TÓPICO",
          clauses: [createContractClause()],
        },
      ],
    }));
  }

  function removeTopic(index: number) {
    if (form.topicos.length === 1) {
      setFeedback("O modelo precisa manter pelo menos um tópico.");
      return;
    }
    setForm((current) => ({
      ...current,
      topicos: current.topicos.filter((_, topicIndex) => topicIndex !== index),
    }));
  }

  function moveTopic(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.topicos.length) return;
    setForm((current) => {
      const next = [...current.topicos];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...current, topicos: next };
    });
  }

  function updateClause(
    topicIndex: number,
    clauseIndex: number,
    changes: Partial<ContractClause>,
  ) {
    const topic = form.topicos[topicIndex];
    updateTopic(topicIndex, {
      clauses: topic.clauses.map((clause, index) =>
        index === clauseIndex ? { ...clause, ...changes } : clause,
      ),
    });
  }

  function addClause(topicIndex: number) {
    const topic = form.topicos[topicIndex];
    updateTopic(topicIndex, {
      clauses: [...topic.clauses, createContractClause()],
    });
  }

  function removeClause(topicIndex: number, clauseIndex: number) {
    const topic = form.topicos[topicIndex];
    if (topic.clauses.length === 1) {
      setFeedback("Cada tópico precisa manter pelo menos uma cláusula.");
      return;
    }
    updateTopic(topicIndex, {
      clauses: topic.clauses.filter((_, index) => index !== clauseIndex),
    });
  }

  function moveClause(topicIndex: number, clauseIndex: number, direction: -1 | 1) {
    const topic = form.topicos[topicIndex];
    const target = clauseIndex + direction;
    if (target < 0 || target >= topic.clauses.length) return;
    const clauses = [...topic.clauses];
    [clauses[clauseIndex], clauses[target]] = [clauses[target], clauses[clauseIndex]];
    updateTopic(topicIndex, { clauses });
  }

  function insertVariable(topicIndex: number, clauseIndex: number, key: string) {
    const clause = form.topicos[topicIndex].clauses[clauseIndex];
    const spacer = clause.content && !clause.content.endsWith(" ") ? " " : "";
    updateClause(topicIndex, clauseIndex, {
      content: `${clause.content}${spacer}{${key}}`,
    });
  }

  async function salvarModelo() {
    setFeedback("");
    if (!form.titulo.trim()) return setFeedback("Informe o título do contrato.");
    if (!form.topicos.length) return setFeedback("Adicione pelo menos um tópico.");

    const user = await obterUsuarioLogado();
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      titulo: form.titulo.trim(),
      contratado_texto: form.contratado_texto || "",
      objeto_base: form.objeto_base || "",
      remuneracao_base: form.remuneracao_base || "",
      obrigacao_contratado: form.obrigacao_contratado || "",
      obrigacao_contratante: form.obrigacao_contratante || "",
      multa_contratado: form.multa_contratado || "",
      multa_contratante: form.multa_contratante || "",
      foro: form.foro || "",
      texto_final: form.texto_final || "",
      cidade_assinatura: form.cidade_assinatura.trim(),
      topicos: form.topicos,
    };

    try {
      if (form.id) {
        const { data, error } = await supabase
          .from("contract_settings")
          .update(payload)
          .eq("user_id", user.id)
          .select("id");
        if (error) throw error;
        if (!data?.length) {
          throw new Error("Nenhum modelo foi atualizado. Verifique as permissões de escrita do perfil.");
        }
        const currentId = data.find((row) => row.id === form.id)?.id || data[0].id;
        setForm((current) => ({ ...current, id: currentId, user_id: user.id }));
      } else {
        const { data, error } = await supabase
          .from("contract_settings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        setForm((current) => ({ ...current, id: data.id, user_id: user.id }));
      }
      setFeedback("Modelo salvo com sucesso.");
    } catch (error) {
      const errorData =
        typeof error === "object" && error !== null
          ? (error as Record<string, unknown>)
          : {};
      const message =
        error instanceof Error
          ? error.message
          : typeof errorData.message === "string"
            ? errorData.message
            : String(error);
      const details = typeof errorData.details === "string" ? errorData.details : "";
      const hint = typeof errorData.hint === "string" ? errorData.hint : "";
      const code = typeof errorData.code === "string" ? errorData.code : "";
      const diagnostic = [message, details, hint, code].join(" ").toLowerCase();

      console.groupCollapsed("Falha ao salvar o modelo de contrato");
      console.warn("Mensagem:", message);
      console.warn("Detalhes:", details);
      console.warn("Hint:", hint);
      console.warn("Código:", code);
      console.groupEnd();

      setFeedback(
        diagnostic.includes("topicos") ||
          diagnostic.includes("schema cache") ||
          code === "PGRST204"
          ? "A atualização de tópicos ainda não foi aplicada no Supabase. Execute a migration 20260810120000_contract_settings_topics.sql."
          : `Não foi possível salvar o modelo${message && message !== "[object Object]" ? `: ${message}` : "."}`,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute modulo="contratos">
      <PlanProtectedRoute modulo="contratos-modelo">
        <AppLayout>
          <main className="mx-auto w-full max-w-[1500px] text-white">
            <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-3.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_10px_24px_rgba(76,29,149,.24)]">
                  <ScrollText size={22} />
                </div>
                <div>
                  <h1 className="text-[26px] font-black tracking-tight">Modelo de Contrato</h1>
                  <p className="mt-1 text-sm text-slate-400">
                    Monte o modelo único, organize os tópicos e acompanhe a pré-visualização.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/contratos" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-400/15 bg-slate-400/[.04] px-4 text-sm font-extrabold text-slate-200 transition hover:border-slate-400/25 hover:bg-slate-400/[.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400">
                  <ArrowLeft size={17} /> Voltar
                </Link>
                <button type="button" onClick={() => void salvarModelo()} disabled={saving || loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 px-4 text-sm font-black transition hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
                  <Save size={17} /> {saving ? "Salvando..." : "Salvar Modelo"}
                </button>
              </div>
            </header>

            {feedback && (
              <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm font-bold ${feedback.includes("sucesso") ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-amber-400/20 bg-amber-400/10 text-amber-100"}`}>
                {feedback}
              </div>
            )}

            {loading ? (
              <div className="grid min-h-64 place-items-center rounded-[18px] border border-slate-400/10 bg-white/[.025] text-slate-400">Carregando modelo...</div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,.92fr)_minmax(520px,1.08fr)]">
                <section className="min-w-0 space-y-5">
                  <section className="rounded-[18px] border border-slate-400/[.12] bg-white/[.025] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-black">Configuração do modelo</h2>
                        <p className="mt-0.5 text-xs text-slate-500">Um único modelo ativo por perfil.</p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[.07] px-2.5 py-1 text-[11px] font-extrabold text-emerald-300">
                        {form.id ? "Modelo salvo" : "Modelo novo"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3">
                      <Field label="Título do contrato">
                        <input value={form.titulo} onChange={(event) => setForm((current) => ({ ...current, titulo: event.target.value }))} className={inputClass} />
                      </Field>
                    </div>
                  </section>

                  <section className="rounded-[18px] border border-slate-400/[.12] bg-white/[.025] p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="text-cyan-300" />
                      <div>
                        <h2 className="text-base font-black">Informações automáticas</h2>
                        <p className="text-xs text-slate-400">Preenchidos automaticamente ao gerar o contrato.</p>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                      <AutomaticInfo icon={<User size={16} />} title="Contratante" text="Nome, CPF/CNPJ e endereço do cliente." />
                      <AutomaticInfo icon={<FileText size={16} />} title="Contratado" text="Empresa, artista e responsável das Configurações." />
                      <AutomaticInfo icon={<CalendarDays size={16} />} title="Assinatura" text={`${form.cidade_assinatura || "Cidade da empresa não informada"} + data atual.`} />
                      <AutomaticInfo icon={<Braces size={16} />} title="Evento" text="Dados inseridos pelas variáveis abaixo." />
                    </div>
                  </section>

                  <p className="flex items-center gap-2 px-1 text-xs leading-5 text-slate-500">
                    <span aria-hidden="true" className="text-cyan-300">ⓘ</span>
                    A numeração das cláusulas é automática em todo o contrato.
                  </p>

                  <div className="space-y-4">
                    {form.topicos.map((topic, index) => {
                      const firstClauseNumber = countClausesBefore(form.topicos, index) + 1;
                      return (
                      <article key={topic.id} className="rounded-[18px] border border-slate-400/[.12] bg-white/[.025] p-4 sm:p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <h2 className="text-sm font-black text-white">Tópico {index + 1}</h2>
                          <div className="flex gap-1.5">
                            <IconButton label="Mover para cima" disabled={index === 0} onClick={() => moveTopic(index, -1)}><ArrowUp size={15} /></IconButton>
                            <IconButton label="Mover para baixo" disabled={index === form.topicos.length - 1} onClick={() => moveTopic(index, 1)}><ArrowDown size={15} /></IconButton>
                            <IconButton label="Excluir tópico" danger onClick={() => removeTopic(index)}><Trash2 size={15} /></IconButton>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          <Field label="Título do tópico">
                            <input value={topic.title} onChange={(event) => updateTopic(index, { title: event.target.value })} className={inputClass} />
                          </Field>
                        </div>
                        <div className="mt-4">
                          {topic.clauses.map((clause, clauseIndex) => {
                            const clauseNumber = firstClauseNumber + clauseIndex;
                            return (
                              <section key={clause.id} className="border-t border-slate-400/10 py-4 first:mt-1">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                  <strong className="text-sm text-white">Cláusula {clauseNumber}ª</strong>
                                  <div className="flex gap-1.5">
                                    <IconButton label="Mover cláusula para cima" disabled={clauseIndex === 0} onClick={() => moveClause(index, clauseIndex, -1)}><ArrowUp size={14} /></IconButton>
                                    <IconButton label="Mover cláusula para baixo" disabled={clauseIndex === topic.clauses.length - 1} onClick={() => moveClause(index, clauseIndex, 1)}><ArrowDown size={14} /></IconButton>
                                    <IconButton label="Excluir cláusula" danger onClick={() => removeClause(index, clauseIndex)}><Trash2 size={14} /></IconButton>
                                  </div>
                                </div>
                                <Field label="Texto da cláusula e seus parágrafos">
                                  <textarea
                                    rows={7}
                                    value={clause.content}
                                    onChange={(event) => updateClause(index, clauseIndex, { content: event.target.value })}
                                    placeholder="Digite o texto principal. Para subdivisões, inicie novas linhas com §1º., §2º. e assim por diante."
                                    className={`${inputClass} min-h-[150px] resize-y py-3 font-normal leading-6`}
                                  />
                                </Field>
                                <div className="mt-3">
                                  <p className="mb-2 text-xs font-bold text-slate-500">Variáveis</p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {CONTRACT_VARIABLES.map((variable) => (
                                      <button key={variable.key} type="button" title={variable.description} onClick={() => insertVariable(index, clauseIndex, variable.key)} className="inline-flex min-h-8 items-center rounded-lg border border-slate-400/15 bg-transparent px-2.5 text-[11px] font-extrabold text-slate-300 transition hover:border-violet-400/40 hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">
                                        {variable.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </section>
                            );
                          })}
                          <button type="button" onClick={() => addClause(index)} className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400/20 bg-transparent text-xs font-extrabold text-slate-300 transition hover:border-violet-400/35 hover:bg-violet-400/[.05] hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400">
                            <Plus size={15} /> Adicionar cláusula
                          </button>
                        </div>
                      </article>
                      );
                    })}
                  </div>

                  <button type="button" onClick={addTopic} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-400/20 bg-transparent text-sm font-extrabold text-slate-300 transition hover:border-cyan-400/35 hover:bg-cyan-400/[.04] hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400">
                    <Plus size={16} /> Novo tópico
                  </button>
                </section>

                <aside className="min-w-0 xl:sticky xl:top-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-black">Pré-visualização</h2>
                      <p className="text-xs text-slate-400">Dados de exemplo são usados nesta tela.</p>
                    </div>
                    <span className="rounded-full border border-violet-400/15 bg-violet-400/[.06] px-2.5 py-1 text-[11px] font-extrabold text-violet-200">Ao vivo</span>
                  </div>
                  <ContractTemplatePreview title={form.titulo} city={form.cidade_assinatura} topics={form.topicos} />
                </aside>
              </div>
            )}
          </main>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

const inputClass = "min-h-11 w-full rounded-xl border border-slate-400/15 bg-[#071122] px-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-4 focus:ring-violet-400/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-300"><span>{label}</span>{children}</label>;
}

function AutomaticInfo({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-w-0 gap-2.5 py-2" title={text}>
      <span className="mt-0.5 shrink-0 text-cyan-300">{icon}</span>
      <div className="min-w-0"><strong className="block text-xs text-slate-200">{title}</strong><span className="block text-[11px] leading-4 text-slate-500">{text}</span></div>
    </div>
  );
}

function IconButton({ label, onClick, children, disabled, danger = false }: { label: string; onClick: () => void; children: React.ReactNode; disabled?: boolean; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:opacity-30 ${danger ? "border-transparent text-rose-300 hover:border-rose-400/20 hover:bg-rose-400/[.07]" : "border-slate-400/10 text-slate-400 hover:border-slate-400/20 hover:bg-white/[.05] hover:text-slate-200"}`}>
      {children}
    </button>
  );
}

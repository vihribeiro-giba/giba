"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { getAccountAuthUser } from "../../lib/access-session";
import {
  createShowFormatPdfUrl,
  downloadShowFormatPdf,
  removeShowFormatPdf,
  uploadShowFormatPdf,
  validateShowFormatPdf,
} from "../../lib/show-formats/storage";
import {
  Clock3, Cloud, Download, Eye, FileText, ListMusic, Mic2, Paperclip,
  Pencil, Plus, Save, Share2, Trash2, Upload, Users, X,
} from "lucide-react";

type FormatoShow = {
  id: string;
  nome: string;
  descricao: string | null;
  duracao_padrao: string | null;
  formacao: string | null;
  observacoes: string | null;
  user_id?: string;
  input_list_path?: string | null;
  input_list_name?: string | null;
  input_list_size?: number | null;
  input_list_updated_at?: string | null;
};

function formatarTamanho(bytes?: number | null) {
  if (!bytes) return "PDF";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function mensagemErro(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) return String(error.message);
  return "Não foi possível concluir a operação.";
}

export default function FormatosPage() {
  const [formatos, setFormatos] = useState<FormatoShow[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [arquivoEmAndamento, setArquivoEmAndamento] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoPadrao, setDuracaoPadrao] = useState("");
  const [formacao, setFormacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [inputList, setInputList] = useState<File | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  function mostrarFeedback(tipo: "sucesso" | "erro", texto: string) {
    setFeedback({ tipo, texto });
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4500);
  }

  async function obterUsuarioLogado() {
    const { data, error } = await getAccountAuthUser();
    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }
    return data.user;
  }

  async function carregarFormatos() {
    setCarregando(true);
    const user = await obterUsuarioLogado();
    if (!user) return setCarregando(false);

    const { data, error } = await supabase
      .from("show_formats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar formatos:", error);
      mostrarFeedback("erro", "Erro ao carregar formatos.");
    } else {
      setFormatos((data || []) as FormatoShow[]);
    }
    setCarregando(false);
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setDuracaoPadrao("");
    setFormacao("");
    setObservacoes("");
    setInputList(null);
  }

  function novoFormato() {
    limparFormulario();
    setModalAberto(true);
  }

  function editarFormato(formato: FormatoShow) {
    setEditandoId(formato.id);
    setNome(formato.nome || "");
    setDescricao(formato.descricao || "");
    setDuracaoPadrao(formato.duracao_padrao || "");
    setFormacao(formato.formacao || "");
    setObservacoes(formato.observacoes || "");
    setInputList(null);
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;
    setModalAberto(false);
    limparFormulario();
  }

  async function atualizarArquivoDoFormato(formato: FormatoShow, file: File, userId: string) {
    const novoPath = await uploadShowFormatPdf(userId, formato.id, file);
    const { error } = await supabase
      .from("show_formats")
      .update({
        input_list_path: novoPath,
        input_list_name: file.name,
        input_list_size: file.size,
        input_list_updated_at: new Date().toISOString(),
      })
      .eq("id", formato.id)
      .eq("user_id", userId);

    if (error) {
      await removeShowFormatPdf(novoPath).catch(() => undefined);
      throw error;
    }

    if (formato.input_list_path && formato.input_list_path !== novoPath) {
      await removeShowFormatPdf(formato.input_list_path).catch((error) => {
        console.warn("Não foi possível remover a versão anterior do Input List:", error);
      });
    }
  }

  async function salvarFormato(event: React.FormEvent) {
    event.preventDefault();
    if (!nome.trim()) return;

    if (inputList) {
      const validacao = validateShowFormatPdf(inputList);
      if (validacao) return mostrarFeedback("erro", validacao);
    }

    const user = await obterUsuarioLogado();
    if (!user) return;
    setSalvando(true);

    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        duracao_padrao: duracaoPadrao.trim(),
        formacao: formacao.trim(),
        observacoes: observacoes.trim(),
        user_id: user.id,
      };

      let formatoSalvo: FormatoShow;
      if (editandoId) {
        const atual = formatos.find((item) => item.id === editandoId);
        const { data, error } = await supabase
          .from("show_formats")
          .update(dados)
          .eq("id", editandoId)
          .eq("user_id", user.id)
          .select("*")
          .single();
        if (error || !data) throw error || new Error("Formato não encontrado.");
        formatoSalvo = { ...atual, ...data } as FormatoShow;
      } else {
        const { data, error } = await supabase.from("show_formats").insert(dados).select("*").single();
        if (error || !data) throw error || new Error("Formato não foi criado.");
        formatoSalvo = data as FormatoShow;
      }

      if (inputList) await atualizarArquivoDoFormato(formatoSalvo, inputList, user.id);

      mostrarFeedback("sucesso", editandoId ? "Formato atualizado com sucesso." : "Formato cadastrado com sucesso.");
      setModalAberto(false);
      limparFormulario();
      await carregarFormatos();
    } catch (error) {
      console.error("Erro ao salvar formato:", error);
      mostrarFeedback("erro", mensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function anexarInputList(formato: FormatoShow, file?: File) {
    if (!file) return;
    const validacao = validateShowFormatPdf(file);
    if (validacao) return mostrarFeedback("erro", validacao);

    const user = await obterUsuarioLogado();
    if (!user) return;
    setArquivoEmAndamento(formato.id);

    try {
      await atualizarArquivoDoFormato(formato, file, user.id);
      mostrarFeedback("sucesso", "Input List anexado ao formato.");
      await carregarFormatos();
    } catch (error) {
      console.error("Erro ao anexar Input List:", error);
      mostrarFeedback("erro", mensagemErro(error));
    } finally {
      setArquivoEmAndamento(null);
    }
  }

  async function visualizarInputList(formato: FormatoShow) {
    if (!formato.input_list_path) return;
    const novaJanela = window.open("about:blank", "_blank");
    if (novaJanela) novaJanela.opener = null;
    try {
      const url = await createShowFormatPdfUrl(formato.input_list_path);
      if (novaJanela) novaJanela.location.replace(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      novaJanela?.close();
      mostrarFeedback("erro", mensagemErro(error));
    }
  }

  async function baixarInputList(formato: FormatoShow) {
    if (!formato.input_list_path) return;
    setArquivoEmAndamento(formato.id);
    try {
      const blob = await downloadShowFormatPdf(formato.input_list_path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = formato.input_list_name || `Input List - ${formato.nome}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      mostrarFeedback("erro", mensagemErro(error));
    } finally {
      setArquivoEmAndamento(null);
    }
  }

  async function compartilharInputList(formato: FormatoShow) {
    if (!formato.input_list_path) return;
    setArquivoEmAndamento(formato.id);
    try {
      const blob = await downloadShowFormatPdf(formato.input_list_path);
      const file = new File([blob], formato.input_list_name || `Input List - ${formato.nome}.pdf`, { type: "application/pdf" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `Input List - ${formato.nome}`, files: [file] });
      } else {
        const url = await createShowFormatPdfUrl(formato.input_list_path, 60 * 60);
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          mostrarFeedback("sucesso", "Link temporário do PDF copiado.");
        } else {
          window.prompt("Copie o link temporário do Input List:", url);
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      mostrarFeedback("erro", mensagemErro(error));
    } finally {
      setArquivoEmAndamento(null);
    }
  }

  async function removerInputList(formato: FormatoShow) {
    if (!formato.input_list_path || !confirm("Remover o Input List deste formato?")) return;
    const user = await obterUsuarioLogado();
    if (!user) return;
    setArquivoEmAndamento(formato.id);

    try {
      const path = formato.input_list_path;
      const { error } = await supabase
        .from("show_formats")
        .update({ input_list_path: null, input_list_name: null, input_list_size: null, input_list_updated_at: null })
        .eq("id", formato.id)
        .eq("user_id", user.id);
      if (error) throw error;
      await removeShowFormatPdf(path);
      mostrarFeedback("sucesso", "Input List removido.");
      await carregarFormatos();
    } catch (error) {
      mostrarFeedback("erro", mensagemErro(error));
    } finally {
      setArquivoEmAndamento(null);
    }
  }

  async function excluirFormato(formato: FormatoShow) {
    if (!confirm("Deseja excluir este formato de show?")) return;
    const user = await obterUsuarioLogado();
    if (!user) return;

    try {
      if (formato.input_list_path) await removeShowFormatPdf(formato.input_list_path);
      const { error } = await supabase.from("show_formats").delete().eq("id", formato.id).eq("user_id", user.id);
      if (error) throw error;
      mostrarFeedback("sucesso", "Formato excluído.");
      await carregarFormatos();
    } catch (error) {
      console.error("Erro ao excluir formato:", error);
      mostrarFeedback("erro", mensagemErro(error));
    }
  }

  useEffect(() => {
    carregarFormatos();
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!modalAberto) return;
    const fecharComEsc = (event: KeyboardEvent) => event.key === "Escape" && fecharModal();
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [modalAberto, salvando]);

  return (
    <ProtectedRoute modulo="formatos">
      <PlanProtectedRoute modulo="formatos">
        <AppLayout>
          <div className="formatos-page">
            <header className="page-header">
              <div className="header-left">
                <div className="header-icon" aria-hidden="true"><Mic2 size={24} /></div>
                <div>
                  <h1>Formatos de Show</h1>
                  <p>Organize seus formatos e mantenha cada Input List pronto para compartilhar.</p>
                </div>
              </div>
              <button type="button" className="btn-primary header-btn" onClick={novoFormato}><Plus size={18} /> Novo Formato</button>
            </header>

            {feedback && <div className={`feedback feedback-${feedback.tipo}`} role="status">{feedback.texto}</div>}

            <section className="formats-section">
              <div className="section-heading">
                <div><h2>Formatos Cadastrados</h2><p>Informações do show e documentos reunidos em um só lugar.</p></div>
                <span className="total-badge">{formatos.length} {formatos.length === 1 ? "formato" : "formatos"}</span>
              </div>

              {carregando ? (
                <div className="empty-state"><div className="spinner" /><p>Carregando formatos...</p></div>
              ) : formatos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon"><ListMusic size={27} /></div>
                  <h3>Nenhum Formato Cadastrado</h3>
                  <p>Crie o primeiro formato e anexe seu Input List em PDF.</p>
                  <button type="button" className="btn-primary empty-btn" onClick={novoFormato}><Plus size={17} /> Novo Formato</button>
                </div>
              ) : (
                <div className="formats-grid">
                  {formatos.map((formato) => {
                    const processando = arquivoEmAndamento === formato.id;
                    return (
                      <article key={formato.id} className="format-card">
                        <div className="card-header">
                          <div className="format-title-wrap">
                            <div className="format-icon"><Mic2 size={18} /></div>
                            <div><h3>{formato.nome}</h3><span><Clock3 size={13} /> {formato.duracao_padrao || "Duração não informada"}</span></div>
                          </div>
                          <div className="icon-actions">
                            <button type="button" onClick={() => editarFormato(formato)} aria-label={`Editar ${formato.nome}`}><Pencil size={16} /></button>
                            <button type="button" className="danger-icon" onClick={() => excluirFormato(formato)} aria-label={`Excluir ${formato.nome}`}><Trash2 size={16} /></button>
                          </div>
                        </div>

                        {formato.descricao && <p className="description">{formato.descricao}</p>}
                        <div className="compact-info">
                          <div><Users size={14} /><span><b>Formação</b>{formato.formacao || "Não informada"}</span></div>
                          {formato.observacoes && <div><FileText size={14} /><span><b>Observações</b>{formato.observacoes}</span></div>}
                        </div>

                        <div className={`document-cloud ${formato.input_list_path ? "has-document" : ""}`}>
                          {formato.input_list_path ? (
                            <>
                              <div className="document-main">
                                <div className="pdf-icon">PDF</div>
                                <div className="document-copy"><strong>{formato.input_list_name || "Input List.pdf"}</strong><span>{formatarTamanho(formato.input_list_size)} · Armazenado com segurança</span></div>
                              </div>
                              <div className="document-actions">
                                <button type="button" onClick={() => visualizarInputList(formato)} disabled={processando}><Eye size={15} /> Visualizar</button>
                                <button type="button" onClick={() => baixarInputList(formato)} disabled={processando}><Download size={15} /> Baixar</button>
                                <button type="button" className="share-button" onClick={() => compartilharInputList(formato)} disabled={processando}><Share2 size={15} /> Enviar</button>
                              </div>
                              <div className="document-secondary-actions">
                                <label className="file-link"><Upload size={14} /> Substituir
                                  <input type="file" accept="application/pdf,.pdf" onChange={(event) => {
                                    void anexarInputList(formato, event.target.files?.[0]);
                                    event.currentTarget.value = "";
                                  }} disabled={processando} />
                                </label>
                                <button type="button" onClick={() => removerInputList(formato)} disabled={processando}><Trash2 size={14} /> Remover</button>
                              </div>
                            </>
                          ) : (
                            <label className="upload-empty"><Cloud size={25} /><strong>{processando ? "Enviando PDF..." : "Anexar Input List"}</strong><span>PDF de até 15 MB</span>
                              <input type="file" accept="application/pdf,.pdf" onChange={(event) => {
                                void anexarInputList(formato, event.target.files?.[0]);
                                event.currentTarget.value = "";
                              }} disabled={processando} />
                            </label>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {modalAberto && (
            <div className="modal-overlay" onMouseDown={fecharModal}>
              <section className="format-modal" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="format-modal-title">
                <div className="modal-header">
                  <div><span className="modal-eyebrow">FORMATO DE SHOW</span><h2 id="format-modal-title">{editandoId ? "Editar formato" : "Novo formato"}</h2><p>Cadastre as informações essenciais e, se quiser, anexe o Input List.</p></div>
                  <button type="button" className="close-button" onClick={fecharModal} aria-label="Fechar"><X size={18} /></button>
                </div>

                <form onSubmit={salvarFormato} className="formulario">
                  <label className="full-field">Nome do formato *<input autoFocus placeholder="Ex.: Vih Ribeiro Acústico" value={nome} onChange={(event) => setNome(event.target.value)} required /></label>
                  <label>Duração padrão<input placeholder="Ex.: 2 horas" value={duracaoPadrao} onChange={(event) => setDuracaoPadrao(event.target.value)} /></label>
                  <label>Formação/equipe<input placeholder="Ex.: Voz, violão e percussão" value={formacao} onChange={(event) => setFormacao(event.target.value)} /></label>
                  <label className="full-field">Descrição do show<textarea placeholder="Descreva o formato de apresentação" value={descricao} onChange={(event) => setDescricao(event.target.value)} /></label>
                  <label className="full-field">Observações<textarea placeholder="Informações adicionais para agenda ou contrato" value={observacoes} onChange={(event) => setObservacoes(event.target.value)} /></label>

                  <label className="full-field file-field">
                    <span className="file-field-title"><Paperclip size={15} /> Input List do formato</span>
                    <span className="file-drop"><Upload size={20} /><span><strong>{inputList ? inputList.name : "Selecionar PDF"}</strong><small>{inputList ? formatarTamanho(inputList.size) : "Opcional · máximo de 15 MB"}</small></span><input type="file" accept="application/pdf,.pdf" onChange={(event) => setInputList(event.target.files?.[0] || null)} /></span>
                    {editandoId && formatos.find((item) => item.id === editandoId)?.input_list_name && !inputList && <small className="current-file">Arquivo atual: {formatos.find((item) => item.id === editandoId)?.input_list_name}. Selecione outro PDF para substituir.</small>}
                  </label>

                  <div className="modal-actions full-field">
                    <button type="button" className="btn-secondary" onClick={fecharModal} disabled={salvando}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={salvando}><Save size={17} /> {salvando ? "Salvando..." : "Salvar formato"}</button>
                  </div>
                </form>
              </section>
            </div>
          )}

          <style jsx>{`
            .formatos-page { width: 100%; max-width: 1380px; margin: 0 auto; color: #fff; }
            h1, h2, h3, p { margin: 0; }
            button, input, textarea { font: inherit; }
            .page-header { display: flex; align-items: center; justify-content: space-between; gap: 18px; margin-bottom: 24px; }
            .header-left { display: flex; align-items: center; gap: 16px; }
            .header-icon { display: grid; place-items: center; width: 48px; height: 48px; flex: 0 0 auto; border-radius: 15px; background: linear-gradient(135deg,#8b35ff,#00aaff); box-shadow: 0 14px 32px rgba(139,53,255,.3); }
            .page-header h1 { font-size: 28px; line-height: 1.1; font-weight: 900; letter-spacing: -.5px; }
            .page-header p, .section-heading p, .modal-header p { margin-top: 5px; color: #94a3b8; font-size: 14px; }
            .btn-primary, .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 18px; border-radius: 13px; border: 1px solid transparent; color: #fff; font-weight: 850; cursor: pointer; }
            .btn-primary { background: linear-gradient(100deg,#7c2cff,#00aaff); box-shadow: 0 12px 28px rgba(101,65,255,.25); }
            .btn-secondary { background: rgba(255,255,255,.055); border-color: rgba(255,255,255,.11); }
            .btn-primary:disabled, .btn-secondary:disabled { opacity: .55; cursor: wait; }
            .header-btn { min-width: 164px; }
            .feedback { margin-bottom: 18px; padding: 12px 15px; border-radius: 13px; font-size: 13px; font-weight: 750; }
            .feedback-sucesso { color: #4ade80; background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.28); }
            .feedback-erro { color: #fda4af; background: rgba(244,63,94,.1); border: 1px solid rgba(244,63,94,.28); }
            .formats-section { padding: 22px; border-radius: 22px; border: 1px solid rgba(255,255,255,.085); background: rgba(255,255,255,.025); }
            .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; }
            .section-heading h2 { font-size: 20px; font-weight: 900; }
            .total-badge { padding: 7px 12px; border-radius: 999px; color: #cbd5e1; background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09); font-size: 12px; font-weight: 800; white-space: nowrap; }
            .formats-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; }
            .format-card { min-width: 0; padding: 17px; border-radius: 18px; border: 1px solid rgba(255,255,255,.085); background: rgba(10,18,34,.62); transition: transform .18s ease,border-color .18s ease; }
            .format-card:hover { transform: translateY(-2px); border-color: rgba(139,92,246,.3); }
            .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
            .format-title-wrap { display: flex; align-items: center; gap: 11px; min-width: 0; }
            .format-icon { display: grid; place-items: center; width: 39px; height: 39px; flex: 0 0 auto; border-radius: 12px; color: #c4b5fd; background: rgba(139,53,255,.13); border: 1px solid rgba(139,53,255,.22); }
            .format-card h3 { overflow: hidden; color: #fff; font-size: 17px; font-weight: 900; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
            .format-title-wrap span { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: #7dd3fc; font-size: 12px; font-weight: 700; }
            .icon-actions { display: flex; gap: 6px; }
            .icon-actions button, .close-button { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.045); color: #94a3b8; cursor: pointer; }
            .icon-actions button:hover { color: #7dd3fc; border-color: rgba(56,189,248,.3); }
            .icon-actions .danger-icon:hover { color: #fb7185; border-color: rgba(251,113,133,.3); }
            .description { display: -webkit-box; margin: 14px 0 12px; overflow: hidden; color: #cbd5e1; font-size: 13px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
            .compact-info { display: grid; gap: 7px; margin: 13px 0; }
            .compact-info > div { display: flex; align-items: flex-start; gap: 8px; min-width: 0; color: #64748b; }
            .compact-info svg { margin-top: 2px; flex: 0 0 auto; color: #818cf8; }
            .compact-info span { display: -webkit-box; overflow: hidden; color: #94a3b8; font-size: 12px; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
            .compact-info b { margin-right: 6px; color: #cbd5e1; }
            .document-cloud { min-height: 116px; display: grid; place-items: center; padding: 13px; border-radius: 15px; border: 1px dashed rgba(56,189,248,.25); background: linear-gradient(135deg,rgba(14,165,233,.055),rgba(139,53,255,.045)); }
            .document-cloud.has-document { display: block; border-style: solid; border-color: rgba(56,189,248,.16); }
            .upload-empty { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px; color: #38bdf8; cursor: pointer; text-align: center; }
            .upload-empty strong { color: #e2e8f0; font-size: 13px; }
            .upload-empty span { color: #64748b; font-size: 11px; }
            .upload-empty input, .file-link input, .file-drop input { display: none; }
            .document-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
            .pdf-icon { display: grid; place-items: center; width: 38px; height: 42px; flex: 0 0 auto; border-radius: 10px; color: #fb7185; background: rgba(244,63,94,.11); border: 1px solid rgba(244,63,94,.2); font-size: 10px; font-weight: 950; }
            .document-copy { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
            .document-copy strong { overflow: hidden; color: #e2e8f0; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
            .document-copy span { color: #64748b; font-size: 10px; }
            .document-actions { display: grid; grid-template-columns: repeat(3,1fr); gap: 6px; margin-top: 11px; }
            .document-actions button, .document-secondary-actions button, .file-link { min-height: 34px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 0 8px; border-radius: 9px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.035); color: #cbd5e1; font-size: 11px; font-weight: 800; cursor: pointer; }
            .document-actions .share-button { color: #67e8f9; background: rgba(6,182,212,.09); border-color: rgba(6,182,212,.2); }
            .document-actions button:disabled, .document-secondary-actions button:disabled { opacity: .5; cursor: wait; }
            .document-secondary-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 9px; }
            .document-secondary-actions button, .document-secondary-actions .file-link { min-height: auto; padding: 0; border: 0; background: transparent; color: #64748b; }
            .document-secondary-actions button:hover, .document-secondary-actions .file-link:hover { color: #cbd5e1; }
            .empty-state { min-height: 260px; display: grid; place-items: center; align-content: center; gap: 10px; padding: 30px; text-align: center; border: 1px dashed rgba(255,255,255,.12); border-radius: 18px; color: #94a3b8; }
            .empty-state h3 { color: #fff; font-size: 17px; }
            .empty-state p { max-width: 380px; font-size: 13px; line-height: 1.5; }
            .empty-icon { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 16px; color: #c4b5fd; background: rgba(139,53,255,.12); }
            .empty-btn { margin-top: 6px; }
            .spinner { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(255,255,255,.1); border-top-color: #8b35ff; animation: spin .8s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .modal-overlay { position: fixed; inset: 0; z-index: 2100; display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; background: rgba(2,4,12,.76); backdrop-filter: blur(8px); }
            .format-modal { width: min(680px,100%); max-height: 92vh; overflow-y: auto; padding: 23px; border-radius: 22px; border: 1px solid rgba(255,255,255,.11); background: linear-gradient(145deg,#101326,#091426); box-shadow: 0 40px 90px rgba(0,0,0,.58); color: #fff; scrollbar-width: none; }
            .format-modal::-webkit-scrollbar { display: none; }
            .modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,.07); }
            .modal-eyebrow { color: #22d3ee; font-size: 10px; font-weight: 950; letter-spacing: 1.5px; }
            .modal-header h2 { margin-top: 6px; font-size: 22px; font-weight: 900; }
            .formulario { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 18px; }
            .formulario label { display: grid; gap: 7px; color: #cbd5e1; font-size: 12px; font-weight: 800; }
            .full-field { grid-column: 1/-1; }
            .formulario input, .formulario textarea { width: 100%; box-sizing: border-box; padding: 12px 13px; border-radius: 12px; border: 1px solid rgba(255,255,255,.1); outline: 0; background: rgba(2,6,23,.48); color: #fff; font-size: 13px; }
            .formulario textarea { min-height: 78px; resize: vertical; }
            .formulario input:focus, .formulario textarea:focus { border-color: rgba(139,92,246,.7); box-shadow: 0 0 0 3px rgba(139,53,255,.12); }
            .file-field-title { display: flex; align-items: center; gap: 6px; }
            .file-drop { min-height: 66px; display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-radius: 13px; border: 1px dashed rgba(56,189,248,.28); background: rgba(14,165,233,.055); color: #38bdf8; cursor: pointer; }
            .file-drop > span { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
            .file-drop strong { overflow: hidden; color: #e2e8f0; font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
            .file-drop small, .current-file { color: #64748b; font-size: 10px; font-weight: 600; }
            .modal-actions { display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px; margin-top: 3px; }
            @media (max-width: 900px) { .formats-grid { grid-template-columns: 1fr; } }
            @media (max-width: 640px) {
              .page-header { align-items: flex-start; flex-direction: column; }
              .header-btn { width: 100%; }
              .formats-section { padding: 15px; border-radius: 19px; }
              .section-heading { align-items: flex-start; }
              .formulario { grid-template-columns: 1fr; }
              .formulario label, .full-field { grid-column: 1; }
              .modal-overlay { padding: 10px; align-items: flex-end; }
              .format-modal { max-height: 94vh; padding: 18px; border-radius: 20px 20px 14px 14px; }
              .modal-actions { grid-template-columns: 1fr; }
              .modal-actions .btn-primary { order: -1; }
              .document-actions { grid-template-columns: 1fr; }
            }
          `}</style>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  ClipboardList,
  FileText,
  ListMusic,
  Mic2,
  Pencil,
  Plus,
  Save,
  Trash2,
  Users,
  X,
} from "lucide-react";

type FormatoShow = {
  id: string;
  nome: string;
  descricao: string;
  duracao_padrao: string;
  formacao: string;
  observacoes: string;
  user_id?: string;
};

export default function FormatosPage() {
  const [formatos, setFormatos] = useState<FormatoShow[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoPadrao, setDuracaoPadrao] = useState("");
  const [formacao, setFormacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  function mostrarFeedback(tipo: "sucesso" | "erro", texto: string) {
    setFeedback({ tipo, texto });
    window.clearTimeout((mostrarFeedback as any)._t);
    (mostrarFeedback as any)._t = window.setTimeout(() => setFeedback(null), 4000);
  }

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarFormatos() {
    setCarregando(true);
    const user = await obterUsuarioLogado();
    if (!user) {
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("show_formats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar formatos:", error);
      mostrarFeedback("erro", "Erro ao carregar formatos.");
      setCarregando(false);
      return;
    }

    setFormatos(data || []);
    setCarregando(false);
  }

  async function salvarFormato(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();
    if (!user) return;

    setSalvando(true);

    const dados = {
      nome,
      descricao,
      duracao_padrao: duracaoPadrao,
      formacao,
      observacoes,
      user_id: user.id,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("show_formats")
        .update(dados)
        .eq("id", editandoId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar formato:", error);
        mostrarFeedback("erro", "Erro ao atualizar formato.");
        setSalvando(false);
        return;
      }

      mostrarFeedback("sucesso", "Formato atualizado com sucesso.");
    } else {
      const { error } = await supabase.from("show_formats").insert(dados);

      if (error) {
        console.error("Erro ao cadastrar formato:", error);
        mostrarFeedback("erro", "Erro ao cadastrar formato.");
        setSalvando(false);
        return;
      }

      mostrarFeedback("sucesso", "Formato cadastrado com sucesso.");
    }

    setSalvando(false);
    limparFormulario();
    carregarFormatos();
  }

  function editarFormato(formato: FormatoShow) {
    setEditandoId(formato.id);
    setNome(formato.nome || "");
    setDescricao(formato.descricao || "");
    setDuracaoPadrao(formato.duracao_padrao || "");
    setFormacao(formato.formacao || "");
    setObservacoes(formato.observacoes || "");

    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function excluirFormato(id: string) {
    const confirmar = confirm("Deseja excluir este formato de show?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();
    if (!user) return;

    const { error } = await supabase
      .from("show_formats")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir formato:", error);
      mostrarFeedback("erro", "Erro ao excluir formato.");
      return;
    }

    mostrarFeedback("sucesso", "Formato excluído.");
    carregarFormatos();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setDescricao("");
    setDuracaoPadrao("");
    setFormacao("");
    setObservacoes("");
  }

  function novoFormato() {
    limparFormulario();
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  useEffect(() => {
    carregarFormatos();
  }, []);

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="formatos">
        <AppLayout>
          <div className="formatos-page">
            {/* HEADER */}
            <header className="page-header">
              <div className="header-left">
                <div className="header-icon" aria-hidden="true">
                  <Mic2 size={26} />
                </div>
                <div>
                  <h1>Formatos de Show</h1>
                  <p>Cadastre os formatos utilizados na agenda e nos contratos.</p>
                </div>
              </div>

              <button type="button" className="btn-primary header-btn" onClick={novoFormato}>
                <Plus size={18} aria-hidden="true" />
                Novo Formato
              </button>
            </header>

            {feedback && (
              <div className={`feedback feedback-${feedback.tipo}`} role="status">
                {feedback.texto}
              </div>
            )}

            {/* GRID */}
            <div className="formatos-grid">
              {/* FORM */}
              <section className="panel form-panel" ref={formRef}>
                <div className="panel-title-row">
                  <div className="panel-title-icon">
                    <div className="mini-icon" aria-hidden="true">
                      <Pencil size={18} />
                    </div>
                    <h2>{editandoId ? "Editar Formato" : "Cadastrar Formato"}</h2>
                  </div>

                  {editandoId && <span className="editing-badge">Editando</span>}
                </div>

                <form onSubmit={salvarFormato} className="formulario">
                  <label>
                    Nome do formato
                    <input
                      placeholder="Ex: Vih Ribeiro - Now Go"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Descrição do show
                    <textarea
                      placeholder="Descreva o formato de apresentação"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                    />
                  </label>

                  <label>
                    Duração padrão
                    <input
                      placeholder="Ex: 2 horas"
                      value={duracaoPadrao}
                      onChange={(e) => setDuracaoPadrao(e.target.value)}
                    />
                  </label>

                  <label>
                    Formação/equipe
                    <textarea
                      placeholder="Ex: Voz, violão, bateria, percussão..."
                      value={formacao}
                      onChange={(e) => setFormacao(e.target.value)}
                    />
                  </label>

                  <label>
                    Observações
                    <textarea
                      placeholder="Informações adicionais para agenda ou contrato"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </label>

                  <button type="submit" className="btn-primary" disabled={salvando}>
                    <Save size={17} aria-hidden="true" />
                    {salvando
                      ? "Salvando..."
                      : editandoId
                        ? "Salvar alterações"
                        : "Cadastrar formato"}
                  </button>

                  {editandoId && (
                    <button type="button" onClick={limparFormulario} className="btn-secondary">
                      <X size={17} aria-hidden="true" />
                      Cancelar edição
                    </button>
                  )}
                </form>
              </section>

              {/* LISTA */}
              <section className="panel list-panel">
                <div className="panel-title-row">
                  <div className="panel-title-icon">
                    <div className="mini-icon" aria-hidden="true">
                      <ListMusic size={18} />
                    </div>
                    <h2>Formatos cadastrados</h2>
                  </div>

                  <span className="total-badge">
                    {formatos.length} {formatos.length === 1 ? "formato" : "formatos"}
                  </span>
                </div>

                <div className="formatos-lista">
                  {carregando ? (
                    <div className="loading-state">
                      <div className="spinner" aria-hidden="true" />
                      <p>Carregando formatos...</p>
                    </div>
                  ) : formatos.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon" aria-hidden="true">
                        <ListMusic size={28} />
                      </div>
                      <h3>Nenhum formato cadastrado ainda</h3>
                      <p>Cadastre seu primeiro formato para usar na agenda e nos contratos.</p>
                      <button type="button" className="btn-primary empty-btn" onClick={novoFormato}>
                        <Plus size={17} aria-hidden="true" />
                        Cadastrar formato
                      </button>
                    </div>
                  ) : (
                    formatos.map((formato) => (
                      <article key={formato.id} className="formato-card">
                        <div className="formato-conteudo">
                          <div className="formato-topo">
                            <div className="formato-icon" aria-hidden="true">
                              <Mic2 size={20} />
                            </div>
                            <div>
                              <h3>{formato.nome}</h3>
                              <p className="formato-subtitle">
                                {formato.duracao_padrao || "Duração não informada"}
                              </p>
                            </div>
                          </div>

                          <div className="info-grid">
                            <div className="info-item full">
                              <span>
                                <FileText size={13} aria-hidden="true" />
                                Descrição
                              </span>
                              <p>{formato.descricao || "-"}</p>
                            </div>

                            <div className="info-item full">
                              <span>
                                <Users size={13} aria-hidden="true" />
                                Formação
                              </span>
                              <p>{formato.formacao || "-"}</p>
                            </div>

                            <div className="info-item full">
                              <span>
                                <ClipboardList size={13} aria-hidden="true" />
                                Observações
                              </span>
                              <p>{formato.observacoes || "-"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button
                            type="button"
                            onClick={() => editarFormato(formato)}
                            className="btn-edit"
                          >
                            <Pencil size={15} aria-hidden="true" />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => excluirFormato(formato.id)}
                            className="btn-delete"
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            Excluir
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          <style jsx>{`
            .formatos-page {
              display: flex;
              flex-direction: column;
              gap: 22px;
              width: 100%;
              max-width: 1320px;
              margin: 0 auto;
              color: #ffffff;
            }

            h1,
            h2,
            h3,
            p {
              margin: 0;
            }

            /* ===== HEADER ===== */
            .page-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 18px;
              flex-wrap: wrap;
              margin-bottom: 2px;
            }

            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .header-icon {
              display: grid;
              place-items: center;
              width: 62px;
              height: 62px;
              border-radius: 20px;
              color: #ffffff;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              box-shadow: 0 18px 38px rgba(139, 53, 255, 0.35);
              flex-shrink: 0;
            }

            .page-header h1 {
              color: #ffffff;
              font-size: 32px;
              line-height: 1.1;
              font-weight: 900;
              letter-spacing: -0.5px;
            }

            .page-header p {
              margin-top: 4px;
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.45;
            }

            .header-btn {
              width: auto;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 42px;
              padding: 0 16px;
              margin: 0;
              border-radius: 14px;
            }

            /* ===== FEEDBACK ===== */
            .feedback {
              padding: 14px 18px;
              border-radius: 16px;
              font-size: 14px;
              font-weight: 700;
              border: 1px solid transparent;
            }

            .feedback-sucesso {
              color: #4ade80;
              background: rgba(34, 197, 94, 0.12);
              border-color: rgba(34, 197, 94, 0.3);
            }

            .feedback-erro {
              color: #fb7185;
              background: rgba(244, 63, 94, 0.12);
              border-color: rgba(244, 63, 94, 0.3);
            }

            /* ===== GRID ===== */
            .formatos-grid {
              display: grid;
              grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
              gap: 22px;
              align-items: start;
            }

            .panel {
              border-radius: 24px;
              padding: 22px;
              border: 1px solid rgba(255, 255, 255, 0.09);
              background: rgba(255, 255, 255, 0.04);
              box-shadow: 0 22px 50px rgba(0, 0, 0, 0.22);
              backdrop-filter: blur(18px);
            }

            .form-panel {
              position: sticky;
              top: 22px;
            }

            .panel-title-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 16px;
              margin-bottom: 22px;
            }

            .panel-title-icon {
              display: flex;
              align-items: center;
              gap: 12px;
            }

            .mini-icon {
              display: grid;
              place-items: center;
              width: 38px;
              height: 38px;
              border-radius: 12px;
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.16);
              border: 1px solid rgba(139, 53, 255, 0.22);
              flex-shrink: 0;
            }

            .panel h2 {
              color: #ffffff;
              font-size: 21px;
              line-height: 1.2;
              font-weight: 800;
              letter-spacing: -0.02em;
            }

            .editing-badge,
            .total-badge {
              display: inline-flex;
              align-items: center;
              min-height: 32px;
              padding: 0 14px;
              border-radius: 999px;
              color: #c7d2fe;
              background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.12);
              font-size: 13px;
              font-weight: 700;
              white-space: nowrap;
            }

            .editing-badge {
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.16);
              border-color: rgba(139, 53, 255, 0.28);
            }

            /* ===== FORM ===== */
            .formulario {
              display: grid;
              gap: 15px;
            }

            label {
              display: grid;
              gap: 8px;
              color: #cbd5e1;
              font-size: 13px;
              font-weight: 800;
            }

            input,
            textarea {
              width: 100%;
              box-sizing: border-box;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(2, 6, 23, 0.45);
              color: #ffffff;
              outline: none;
              font-size: 14px;
              padding: 14px 16px;
              transition: 0.18s ease;
            }

            textarea {
              min-height: 92px;
              resize: vertical;
            }

            input::placeholder,
            textarea::placeholder {
              color: rgba(148, 163, 184, 0.6);
            }

            input:focus,
            textarea:focus {
              border-color: rgba(139, 53, 255, 0.7);
              box-shadow: 0 0 0 4px rgba(139, 53, 255, 0.14);
            }

            /* ===== BUTTONS ===== */
            .btn-primary,
            .btn-secondary,
            .btn-edit,
            .btn-delete {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              border: 1px solid transparent;
              cursor: pointer;
              font-weight: 800;
              transition: transform 0.16s ease, opacity 0.16s ease, background 0.16s ease;
            }

            .btn-primary:hover,
            .btn-secondary:hover,
            .btn-edit:hover,
            .btn-delete:hover {
              transform: translateY(-1px);
              opacity: 0.94;
            }

            .btn-primary:disabled {
              opacity: 0.6;
              cursor: not-allowed;
              transform: none;
            }

            .btn-primary {
              width: 100%;
              margin-top: 4px;
              padding: 15px 18px;
              border-radius: 14px;
              color: #ffffff;
              font-size: 15px;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              box-shadow: 0 16px 32px rgba(139, 53, 255, 0.28);
            }

            .btn-secondary {
              width: 100%;
              padding: 14px 18px;
              border-radius: 14px;
              color: #ffffff;
              background: rgba(255, 255, 255, 0.07);
              border: 1px solid rgba(255, 255, 255, 0.12);
            }

            /* ===== LISTA ===== */
            .formatos-lista {
              display: grid;
              gap: 16px;
            }

            .formato-card {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 16px;
              padding: 20px;
              border-radius: 20px;
              border: 1px solid rgba(255, 255, 255, 0.09);
              background: rgba(15, 23, 42, 0.58);
              transition: border-color 0.18s ease, transform 0.18s ease;
            }

            .formato-card:hover {
              border-color: rgba(139, 53, 255, 0.35);
              transform: translateY(-2px);
            }

            .formato-topo {
              display: flex;
              gap: 12px;
              align-items: center;
              margin-bottom: 16px;
            }

            .formato-icon {
              display: grid;
              place-items: center;
              width: 44px;
              height: 44px;
              border-radius: 14px;
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.14);
              border: 1px solid rgba(139, 53, 255, 0.2);
              flex-shrink: 0;
            }

            .formato-card h3 {
              color: #ffffff;
              font-size: 18px;
              font-weight: 800;
              line-height: 1.25;
            }

            .formato-subtitle {
              margin-top: 4px;
              color: #38bdf8;
              font-size: 13px;
              font-weight: 700;
            }

            .info-grid {
              display: grid;
              gap: 10px;
            }

            .info-item {
              padding: 12px 14px;
              border-radius: 14px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.06);
            }

            .info-item span {
              display: flex;
              align-items: center;
              gap: 6px;
              margin-bottom: 5px;
              color: #93c5fd;
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }

            .info-item p {
              color: #dbe4ff;
              font-size: 14px;
              line-height: 1.55;
              white-space: pre-wrap;
            }

            .card-actions {
              display: flex;
              flex-direction: column;
              gap: 10px;
              align-items: stretch;
            }

            .btn-edit,
            .btn-delete {
              min-height: 42px;
              padding: 0 18px;
              border-radius: 12px;
              font-size: 14px;
            }

            .btn-edit {
              color: #38bdf8;
              background: rgba(14, 165, 233, 0.16);
              border: 1px solid rgba(14, 165, 233, 0.22);
            }

            .btn-delete {
              color: #fb7185;
              background: rgba(244, 63, 94, 0.14);
              border: 1px solid rgba(244, 63, 94, 0.22);
            }

            /* ===== ESTADOS ===== */
            .empty-state,
            .loading-state {
              display: grid;
              place-items: center;
              text-align: center;
              min-height: 280px;
              padding: 32px;
              border-radius: 20px;
              border: 1px dashed rgba(255, 255, 255, 0.14);
              background: rgba(2, 6, 23, 0.3);
            }

            .empty-icon {
              display: grid;
              place-items: center;
              width: 60px;
              height: 60px;
              margin-bottom: 14px;
              border-radius: 18px;
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.14);
              border: 1px solid rgba(139, 53, 255, 0.2);
            }

            .empty-state h3 {
              color: #ffffff;
              font-size: 18px;
              margin-bottom: 8px;
            }

            .empty-state p {
              color: #94a3b8;
              line-height: 1.6;
              max-width: 360px;
            }

            .empty-btn {
              width: auto;
              margin-top: 18px;
              padding: 12px 22px;
            }

            .loading-state p {
              color: #94a3b8;
              margin-top: 14px;
              font-weight: 600;
            }

            .spinner {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              border: 3px solid rgba(255, 255, 255, 0.12);
              border-top-color: #8b35ff;
              animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }

            /* ===== RESPONSIVO ===== */
            @media (max-width: 1100px) {
              .formatos-grid {
                grid-template-columns: 1fr;
              }

              .form-panel {
                position: static;
              }
            }

            @media (max-width: 720px) {
              .page-header {
                align-items: flex-start;
              }

              .header-btn {
                width: 100%;
                justify-content: center;
              }

              .page-header h1 {
                font-size: 30px;
              }

              .panel {
                border-radius: 20px;
                padding: 20px;
              }

              .formato-card {
                grid-template-columns: 1fr;
              }

              .card-actions {
                flex-direction: row;
              }

              .btn-edit,
              .btn-delete {
                flex: 1;
              }
            }
          `}</style>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

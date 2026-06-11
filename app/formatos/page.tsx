"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

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

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [duracaoPadrao, setDuracaoPadrao] = useState("");
  const [formacao, setFormacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

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
    const user = await obterUsuarioLogado();
    if (!user) return;

    const { data, error } = await supabase
      .from("show_formats")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar formatos:", error);
      alert("Erro ao carregar formatos.");
      return;
    }

    setFormatos(data || []);
  }

  async function salvarFormato(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();
    if (!user) return;

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
        alert("Erro ao atualizar formato.");
        return;
      }
    } else {
      const { error } = await supabase.from("show_formats").insert(dados);

      if (error) {
        console.error("Erro ao cadastrar formato:", error);
        alert("Erro ao cadastrar formato.");
        return;
      }
    }

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
      alert("Erro ao excluir formato.");
      return;
    }

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

  useEffect(() => {
    carregarFormatos();
  }, []);

  return (
  <ProtectedRoute adminOnly>
    <PlanProtectedRoute modulo="formatos">
      <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Formatos de Show
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Cadastre os formatos de apresentação que serão usados na agenda e nos contratos.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>
              {editandoId ? "Editar Formato" : "Cadastrar Formato"}
            </h2>

            <form
              onSubmit={salvarFormato}
              style={{ display: "grid", gap: "14px", marginTop: "20px" }}
            >
              <input
                style={inputStyle}
                placeholder="Nome do formato"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />

              <textarea
                style={{ ...inputStyle, minHeight: "100px" }}
                placeholder="Descrição do show"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="Duração padrão. Ex: 2 horas"
                value={duracaoPadrao}
                onChange={(e) => setDuracaoPadrao(e.target.value)}
              />

              <textarea
                style={{ ...inputStyle, minHeight: "90px" }}
                placeholder="Formação/equipe. Ex: Voz, violão, bateria..."
                value={formacao}
                onChange={(e) => setFormacao(e.target.value)}
              />

              <textarea
                style={{ ...inputStyle, minHeight: "90px" }}
                placeholder="Observações"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />

              <button type="submit" style={botaoPrincipal}>
                {editandoId ? "Salvar Alterações" : "Cadastrar Formato"}
              </button>

              {editandoId && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  style={botaoSecundario}
                >
                  Cancelar edição
                </button>
              )}
            </form>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Formatos cadastrados</h2>

            <div style={{ marginTop: "20px", display: "grid", gap: "14px" }}>
              {formatos.map((formato) => (
                <div key={formato.id} style={cardFormato}>
                  <div>
                    <h3 style={{ margin: "0 0 8px" }}>
                      {formato.nome}
                    </h3>

                    <p style={textoMuted}>
                      <strong>Descrição:</strong> {formato.descricao || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>Duração:</strong> {formato.duracao_padrao || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>Formação:</strong> {formato.formacao || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>Observações:</strong> {formato.observacoes || "-"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => editarFormato(formato)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirFormato(formato.id)}
                      style={botaoExcluir}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {formatos.length === 0 && (
                <p style={{ color: "#b8b8d8" }}>
                  Nenhum formato cadastrado ainda.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
      </AppLayout>
    </PlanProtectedRoute>
  </ProtectedRoute>
);
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: "15px",
  boxSizing: "border-box",
};

const botaoPrincipal: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundario: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
};

const cardFormato: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const textoMuted: React.CSSProperties = {
  color: "#b8b8d8",
  margin: "6px 0",
};

const botaoEditar: React.CSSProperties = {
  height: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(0,170,255,0.18)",
  color: "#38bdf8",
  cursor: "pointer",
};

const botaoExcluir: React.CSSProperties = {
  height: "40px",
  padding: "0 16px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,91,138,0.18)",
  color: "#ff7aa2",
  cursor: "pointer",
};


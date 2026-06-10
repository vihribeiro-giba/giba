"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Colaborador = {
  id: string;
  user_id?: string;
  nome: string;
  funcao: string;
  celular: string;
  email: string;
  senha?: string;
  status: string;
};

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState("Ativo");

  async function obterUsuarioLogado() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      alert("Usuário não autenticado. Faça login novamente.");
      return null;
    }

    return user;
  }

  async function carregarColaboradores() {
    const user = await obterUsuarioLogado();
    if (!user) return;

    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar colaboradores:", error);
      alert("Erro ao carregar colaboradores.");
      return;
    }

    setColaboradores(data || []);
  }

  async function salvarColaborador(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();
    if (!user) return;

    if (!editandoId && !senha.trim()) {
      alert("Informe uma senha para o colaborador.");
      return;
    }

    const dados: {
      user_id?: string;
      nome: string;
      funcao: string;
      celular: string;
      email: string;
      senha?: string;
      status: string;
    } = {
      nome,
      funcao,
      celular,
      email,
      status,
    };

    if (senha.trim()) {
      dados.senha = senha;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("collaborators")
        .update(dados)
        .eq("id", editandoId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar colaborador:", error);
        alert("Erro ao atualizar colaborador.");
        return;
      }
    } else {
      const { error } = await supabase.from("collaborators").insert({
        ...dados,
        user_id: user.id,
      });

      if (error) {
        console.error("Erro ao cadastrar colaborador:", error);
        alert("Erro ao cadastrar colaborador.");
        return;
      }
    }

    limparFormulario();
    carregarColaboradores();
  }

  function editarColaborador(colaborador: Colaborador) {
    setEditandoId(colaborador.id);
    setNome(colaborador.nome || "");
    setFuncao(colaborador.funcao || "");
    setCelular(colaborador.celular || "");
    setEmail(colaborador.email || "");
    setSenha("");
    setStatus(colaborador.status || "Ativo");
  }

  async function excluirColaborador(id: string) {
    const confirmar = confirm("Deseja excluir este colaborador?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();
    if (!user) return;

    const { error } = await supabase
      .from("collaborators")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir colaborador:", error);
      alert("Erro ao excluir colaborador.");
      return;
    }

    carregarColaboradores();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setFuncao("");
    setCelular("");
    setEmail("");
    setSenha("");
    setStatus("Ativo");
  }

  useEffect(() => {
    carregarColaboradores();
  }, []);

  return (
  <ProtectedRoute adminOnly>
    <PlanProtectedRoute modulo="colaboradores">
      <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Colaboradores
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Cadastre músicos, técnicos, produtores e demais profissionais que
          participam dos eventos.
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
              {editandoId ? "Editar Colaborador" : "Cadastrar Colaborador"}
            </h2>

            <form
              onSubmit={salvarColaborador}
              style={{ display: "grid", gap: "14px", marginTop: "20px" }}
            >
              <input
                style={inputStyle}
                placeholder="Nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />

              <input
                style={inputStyle}
                placeholder="Função. Ex: Baterista, Técnico de som..."
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="Celular"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder={
                  editandoId
                    ? "Nova senha do colaborador (opcional)"
                    : "Senha de acesso do colaborador"
                }
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required={!editandoId}
              />

              <select
                style={inputStyle}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Ativo</option>
                <option>Inativo</option>
              </select>

              <button type="submit" style={botaoPrincipal}>
                {editandoId ? "Salvar Alterações" : "Cadastrar Colaborador"}
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
            <h2 style={{ marginTop: 0 }}>Colaboradores cadastrados</h2>

            <div style={{ marginTop: "20px", display: "grid", gap: "14px" }}>
              {colaboradores.map((colaborador) => (
                <div key={colaborador.id} style={cardColaborador}>
                  <div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <h3 style={{ margin: "0 0 8px" }}>
                        {colaborador.nome}
                      </h3>

                      <span
                        style={{
                          ...statusBadge,
                          color:
                            colaborador.status === "Ativo"
                              ? "#37e884"
                              : "#ff7aa2",
                          background:
                            colaborador.status === "Ativo"
                              ? "rgba(55,232,132,0.14)"
                              : "rgba(255,91,138,0.14)",
                        }}
                      >
                        {colaborador.status}
                      </span>
                    </div>

                    <p style={textoMuted}>
                      <strong>Função:</strong> {colaborador.funcao || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>Celular:</strong> {colaborador.celular || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>E-mail:</strong> {colaborador.email || "-"}
                    </p>

                    <p style={textoMuted}>
                      <strong>Acesso:</strong> {colaborador.senha ? "Senha cadastrada" : "Sem senha cadastrada"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => editarColaborador(colaborador)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirColaborador(colaborador.id)}
                      style={botaoExcluir}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {colaboradores.length === 0 && (
                <p style={{ color: "#b8b8d8" }}>
                  Nenhum colaborador cadastrado ainda.
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

const cardColaborador: React.CSSProperties = {
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

const statusBadge: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "bold",
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

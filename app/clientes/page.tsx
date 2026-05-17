"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  celular: string;
  email: string;
  endereco_completo: string;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [enderecoCompleto, setEnderecoCompleto] = useState("");

  async function carregarClientes() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    setClientes(data || []);
  }

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();

    const dados = {
      nome,
      cpf_cnpj: cpfCnpj,
      celular,
      email,
      endereco_completo: enderecoCompleto,
    };

    if (editandoId) {
      await supabase.from("clients").update(dados).eq("id", editandoId);
    } else {
      await supabase.from("clients").insert(dados);
    }

    limparFormulario();
    carregarClientes();
  }

  function editarCliente(cliente: Cliente) {
    setEditandoId(cliente.id);
    setNome(cliente.nome || "");
    setCpfCnpj(cliente.cpf_cnpj || "");
    setCelular(cliente.celular || "");
    setEmail(cliente.email || "");
    setEnderecoCompleto(cliente.endereco_completo || "");
  }

  async function excluirCliente(id: string) {
    const confirmar = confirm("Deseja excluir este cliente?");

    if (!confirmar) return;

    await supabase.from("clients").delete().eq("id", id);
    carregarClientes();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setCpfCnpj("");
    setCelular("");
    setEmail("");
    setEnderecoCompleto("");
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  return (
  <ProtectedRoute adminOnly>
    <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Clientes GIBA
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Cadastre e gerencie seus contratantes.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "420px 1fr",
            gap: "24px",
          }}
        >
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Cadastro Cliente</h2>

            <form
              onSubmit={salvarCliente}
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
                placeholder="CPF/CNPJ"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
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

              <textarea
                style={{ ...inputStyle, minHeight: "100px" }}
                placeholder="Endereço completo"
                value={enderecoCompleto}
                onChange={(e) => setEnderecoCompleto(e.target.value)}
              />

              <button type="submit" style={botaoPrincipal}>
                {editandoId ? "Salvar Alterações" : "Cadastrar Cliente"}
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
            <h2 style={{ marginTop: 0 }}>Clientes cadastrados</h2>

            <div style={{ marginTop: "20px", display: "grid", gap: "14px" }}>
              {clientes.map((cliente) => (
                <div key={cliente.id} style={cardCliente}>
                  <div>
                    <h3 style={{ margin: "0 0 8px" }}>{cliente.nome}</h3>

                    <p style={textoMuted}>CPF/CNPJ: {cliente.cpf_cnpj || "-"}</p>
                    <p style={textoMuted}>Celular: {cliente.celular || "-"}</p>
                    <p style={textoMuted}>E-mail: {cliente.email || "-"}</p>
                    <p style={textoMuted}>
                      Endereço: {cliente.endereco_completo || "-"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => editarCliente(cliente)}
                      style={botaoEditar}
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirCliente(cliente.id)}
                      style={botaoExcluir}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {clientes.length === 0 && (
                <p style={{ color: "#b8b8d8" }}>
                  Nenhum cliente cadastrado ainda.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
        </AppLayout>
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
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  cursor: "pointer",
};

const cardCliente: React.CSSProperties = {
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
  margin: "5px 0",
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
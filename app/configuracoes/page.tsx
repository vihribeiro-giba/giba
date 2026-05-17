"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Empresa = {
  id: string;
  nome_artistico: string;
  razao_social: string;
  cnpj: string;
  responsavel: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco_completo: string;
  cidade: string;
  estado: string;
  pix: string;
  banco: string;
  observacoes: string;
  logo_url: string;
};

export default function ConfiguracoesPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const [nomeArtistico, setNomeArtistico] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [enderecoCompleto, setEnderecoCompleto] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [pix, setPix] = useState("");
  const [banco, setBanco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  async function carregarEmpresa() {
    const { data } = await supabase
      .from("company_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) return;

    const empresa = data as Empresa;

    setEmpresaId(empresa.id);
    setNomeArtistico(empresa.nome_artistico || "");
    setRazaoSocial(empresa.razao_social || "");
    setCnpj(empresa.cnpj || "");
    setResponsavel(empresa.responsavel || "");
    setCpf(empresa.cpf || "");
    setEmail(empresa.email || "");
    setTelefone(empresa.telefone || "");
    setEnderecoCompleto(empresa.endereco_completo || "");
    setCidade(empresa.cidade || "");
    setEstado(empresa.estado || "");
    setPix(empresa.pix || "");
    setBanco(empresa.banco || "");
    setObservacoes(empresa.observacoes || "");
    setLogoUrl(empresa.logo_url || "");
  }

  async function uploadLogo(file: File) {
    const extensao = file.name.split(".").pop();
    const nomeArquivo = `logo-${Date.now()}.${extensao}`;

    const { error } = await supabase.storage
      .from("company-logos")
      .upload(nomeArquivo, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      alert("Erro ao enviar logo.");
      return;
    }

    const { data } = supabase.storage
      .from("company-logos")
      .getPublicUrl(nomeArquivo);

    setLogoUrl(data.publicUrl);
  }

  async function salvarEmpresa(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);

    const dados = {
      nome_artistico: nomeArtistico,
      razao_social: razaoSocial,
      cnpj,
      responsavel,
      cpf,
      email,
      telefone,
      endereco_completo: enderecoCompleto,
      cidade,
      estado,
      pix,
      banco,
      observacoes,
      logo_url: logoUrl,
    };

    if (empresaId) {
      const { error } = await supabase
        .from("company_settings")
        .update(dados)
        .eq("id", empresaId);

      setCarregando(false);

      if (error) {
        alert("Erro ao atualizar dados da empresa.");
        return;
      }

      alert("Dados atualizados com sucesso.");
      return;
    }

    const { data, error } = await supabase
      .from("company_settings")
      .insert(dados)
      .select()
      .single();

    setCarregando(false);

    if (error) {
      alert("Erro ao salvar dados da empresa.");
      return;
    }

    setEmpresaId(data.id);
    alert("Dados salvos com sucesso.");
  }

  useEffect(() => {
    carregarEmpresa();
  }, []);

  return (
  <ProtectedRoute adminOnly>
    <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Configurações
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Cadastre os dados da empresa/artista para usar em contratos e documentos.
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
            <h2 style={{ marginTop: 0 }}>Logo da Empresa</h2>

            <div style={logoBox}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo da empresa"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "180px",
                    objectFit: "contain",
                  }}
                />
              ) : (
                <p style={{ color: "#b8b8d8" }}>Nenhuma logo cadastrada.</p>
              )}
            </div>

            <input
              style={inputStyle}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />

            <p style={{ color: "#94a3b8", fontSize: "13px" }}>
              Recomendado: PNG com fundo transparente.
            </p>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Dados da Empresa</h2>

            <form
              onSubmit={salvarEmpresa}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px",
                marginTop: "20px",
              }}
            >
              <input style={inputStyle} placeholder="Nome artístico" value={nomeArtistico} onChange={(e) => setNomeArtistico(e.target.value)} />
              <input style={inputStyle} placeholder="Razão social" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
              <input style={inputStyle} placeholder="CNPJ" value={cnpj} onChange={(e) => setCnpj(e.target.value)} />
              <input style={inputStyle} placeholder="Responsável" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
              <input style={inputStyle} placeholder="CPF" value={cpf} onChange={(e) => setCpf(e.target.value)} />
              <input style={inputStyle} placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input style={inputStyle} placeholder="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
              <input style={inputStyle} placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
              <input style={inputStyle} placeholder="Estado" value={estado} onChange={(e) => setEstado(e.target.value)} />
              <input style={inputStyle} placeholder="PIX" value={pix} onChange={(e) => setPix(e.target.value)} />
              <input style={inputStyle} placeholder="Banco" value={banco} onChange={(e) => setBanco(e.target.value)} />

              <textarea
                style={{ ...inputStyle, minHeight: "90px", gridColumn: "1 / -1" }}
                placeholder="Endereço completo"
                value={enderecoCompleto}
                onChange={(e) => setEnderecoCompleto(e.target.value)}
              />

              <textarea
                style={{ ...inputStyle, minHeight: "90px", gridColumn: "1 / -1" }}
                placeholder="Observações"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />

              <button
                type="submit"
                disabled={carregando}
                style={{
                  ...botaoPrincipal,
                  gridColumn: "1 / -1",
                  opacity: carregando ? 0.7 : 1,
                }}
              >
                {carregando ? "Salvando..." : "Salvar Configurações"}
              </button>
            </form>
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

const logoBox: React.CSSProperties = {
  width: "100%",
  height: "220px",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
  overflow: "hidden",
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
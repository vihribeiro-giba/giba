"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function CadastroPage() {
  const [nomeArtistico, setNomeArtistico] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function criarConta(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const emailTratado = email.trim().toLowerCase();
    const nomeTratado = nomeArtistico.trim();

    if (!nomeTratado) {
      setErro("Informe o nome artístico ou nome da empresa.");
      return;
    }

    if (!emailTratado) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
      email: emailTratado,
      password: senha,
      options: {
        data: {
          nome_artistico: nomeTratado,
        },
      },
    });

    if (error) {
      console.error("Erro ao criar usuário:", error);
      setErro(error.message || "Erro ao criar conta.");
      setCarregando(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErro("Não foi possível criar o usuário.");
      setCarregando(false);
      return;
    }

    const { error: erroEmpresa } = await supabase
      .from("company_settings")
      .insert({
        user_id: user.id,
        nome_artistico: nomeTratado,
        razao_social: "",
        cnpj: "",
        responsavel: "",
        cpf: "",
        email: emailTratado,
        telefone: "",
        endereco_completo: "",
        cidade: "",
        estado: "",
        pix: "",
        banco: "",
        observacoes: "",
        logo_url: "",
      });

    if (erroEmpresa) {
      console.error("Erro ao criar configurações iniciais:", erroEmpresa);
      setErro("Conta criada, mas houve erro ao criar as configurações iniciais.");
      setCarregando(false);
      return;
    }

    const dataInicioTrial = new Date();
    const dataFimTrial = new Date();
    dataFimTrial.setDate(dataFimTrial.getDate() + 7);

    const { error: erroAssinatura } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plano: "teste",
        status: "ativo",
        data_inicio: dataInicioTrial.toISOString(),
        data_fim: dataFimTrial.toISOString(),
        trial_dias: 7,
        trial_finalizado: false,
        mercadopago_subscription_id: null,
      });

    if (erroAssinatura) {
      console.error("Erro ao criar assinatura inicial:", erroAssinatura);
      setErro("Conta criada, mas houve erro ao criar a assinatura inicial.");
      setCarregando(false);
      return;
    }

    setSucesso("Conta criada com sucesso. Redirecionando...");

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  }

  return (
    <main style={pageStyle}>
      <div style={backgroundGlowOne} />
      <div style={backgroundGlowTwo} />

      <section style={cadastroCard}>
        <div style={logoArea}>
          <img
            src="/logo-giba-horizontal.png"
            alt="GIBA"
            style={{
              width: "260px",
              height: "auto",
              objectFit: "contain",
            }}
          />

          <p style={subtitle}>
            Crie sua conta na Gestão Inteligente para Bandas e Artistas
          </p>
        </div>

        <form onSubmit={criarConta} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label style={labelStyle}>Nome artístico ou empresa</label>
            <input
              type="text"
              placeholder="Ex: Banda GIBA, Vih Ribeiro..."
              value={nomeArtistico}
              onChange={(e) => setNomeArtistico(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>E-mail</label>
            <input
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Confirmar senha</label>
            <input
              type="password"
              placeholder="Digite a senha novamente"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {erro && <p style={errorStyle}>{erro}</p>}
          {sucesso && <p style={successStyle}>{sucesso}</p>}

          <button type="submit" disabled={carregando} style={buttonStyle}>
            {carregando ? "Criando conta..." : "Criar conta no GIBA"}
          </button>
        </form>

        <div style={loginBoxStyle}>
          <span style={{ color: "#b8b8d8", fontSize: "14px" }}>
            Já tem conta?
          </span>

          <Link href="/login" style={loginLinkStyle}>
            Entrar no GIBA
          </Link>
        </div>

        <p style={footerText}>
          Plataforma de gestão artística, agenda, clientes e financeiro.
        </p>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #35106b, #050510 35%, #00172f)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "Arial, sans-serif",
  position: "relative",
  overflow: "hidden",
  padding: "24px",
};

const backgroundGlowOne: React.CSSProperties = {
  position: "absolute",
  width: "380px",
  height: "380px",
  borderRadius: "50%",
  background: "rgba(139,53,255,0.35)",
  filter: "blur(90px)",
  top: "-80px",
  left: "-80px",
};

const backgroundGlowTwo: React.CSSProperties = {
  position: "absolute",
  width: "420px",
  height: "420px",
  borderRadius: "50%",
  background: "rgba(0,170,255,0.25)",
  filter: "blur(100px)",
  bottom: "-120px",
  right: "-100px",
};

const cadastroCard: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "28px",
  padding: "42px",
  boxShadow: "0 0 60px rgba(0,0,0,0.45)",
  backdropFilter: "blur(18px)",
  position: "relative",
  zIndex: 2,
};

const logoArea: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "34px",
};

const subtitle: React.CSSProperties = {
  color: "#b8b8d8",
  fontSize: "14px",
  marginTop: "10px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#dbeafe",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(0,0,0,0.35)",
  color: "#fff",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "8px",
};

const errorStyle: React.CSSProperties = {
  color: "#ff7aa2",
  fontSize: "14px",
  margin: 0,
};

const successStyle: React.CSSProperties = {
  color: "#37e884",
  fontSize: "14px",
  margin: 0,
};

const loginBoxStyle: React.CSSProperties = {
  marginTop: "22px",
  paddingTop: "20px",
  borderTop: "1px solid rgba(255,255,255,0.12)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const loginLinkStyle: React.CSSProperties = {
  color: "#38bdf8",
  fontSize: "14px",
  fontWeight: "bold",
  textDecoration: "none",
};

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "28px",
};

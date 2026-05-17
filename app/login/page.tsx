"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setCarregando(false);
      setErro("E-mail ou senha inválidos.");
      return;
    }

    const userEmail = data.user?.email;

    const { data: colaborador } = await supabase
      .from("collaborators")
      .select("*")
      .eq("email", userEmail)
      .eq("status", "Ativo")
      .maybeSingle();

    setCarregando(false);

    if (colaborador) {
      window.location.href = "/agenda-colaborador";
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main style={pageStyle}>
      <div style={backgroundGlowOne} />
      <div style={backgroundGlowTwo} />

      <section style={loginCard}>
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
            Gestão Inteligente para Bandas e Artistas
          </p>
        </div>

        <form onSubmit={fazerLogin} style={{ display: "grid", gap: "16px" }}>
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
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              style={inputStyle}
              required
            />
          </div>

          {erro && <p style={errorStyle}>{erro}</p>}

          <button type="submit" disabled={carregando} style={buttonStyle}>
            {carregando ? "Entrando..." : "Entrar no GIBA"}
          </button>
        </form>

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

const loginCard: React.CSSProperties = {
  width: "100%",
  maxWidth: "460px",
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

const footerText: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "13px",
  textAlign: "center",
  marginTop: "28px",
};
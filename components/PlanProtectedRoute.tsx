"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type PlanProtectedRouteProps = {
  children: React.ReactNode;
  modulo: string;
};

type Assinatura = {
  id: string;
  user_id: string;
  plano: string;
  status: string;
  data_inicio?: string | null;
  data_fim?: string | null;
};

type RecursoPlano = {
  id: string;
  plano: string;
  modulo: string;
  ativo: boolean;
};

export default function PlanProtectedRoute({
  children,
  modulo,
}: PlanProtectedRouteProps) {
  const [liberado, setLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    verificarPlano();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo]);

  async function verificarPlano() {
    setCarregando(true);
    setMensagem("");

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData.user) {
      window.location.href = "/login";
      return;
    }

    const user = authData.user;

    const { data: assinatura, error: erroAssinatura } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "ativo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (erroAssinatura) {
      console.error("Erro ao carregar assinatura:", erroAssinatura);
      setMensagem("Erro ao validar sua assinatura.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    if (!assinatura) {
      setMensagem("Nenhuma assinatura ativa encontrada para esta conta.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    const assinaturaAtual = assinatura as Assinatura;

    if (assinaturaAtual.data_fim) {
      const dataFim = new Date(assinaturaAtual.data_fim);
      const agora = new Date();

      if (dataFim < agora) {
        setMensagem("Sua assinatura expirou. Regularize seu plano para continuar.");
        setLiberado(false);
        setCarregando(false);
        return;
      }
    }

    const plano = assinaturaAtual.plano || "teste";

    if (plano === "teste") {
      const modulosLiberadosNoTeste = [
        "dashboard",
        "clientes",
        "agenda",
        "financeiro",
        "configuracoes",
      ];

      if (modulosLiberadosNoTeste.includes(modulo)) {
        setLiberado(true);
        setCarregando(false);
        return;
      }

      setMensagem("Este módulo não está disponível no plano de teste.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    const { data: recurso, error: erroRecurso } = await supabase
      .from("plan_features")
      .select("*")
      .eq("plano", plano)
      .eq("modulo", modulo)
      .eq("ativo", true)
      .maybeSingle();

    if (erroRecurso) {
      console.error("Erro ao validar recurso do plano:", erroRecurso);
      setMensagem("Erro ao validar acesso ao módulo.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    if (!recurso) {
      setMensagem("Este módulo não está disponível no seu plano atual.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    const recursoAtual = recurso as RecursoPlano;

    if (!recursoAtual.ativo) {
      setMensagem("Este módulo está desativado para o seu plano.");
      setLiberado(false);
      setCarregando(false);
      return;
    }

    setLiberado(true);
    setCarregando(false);
  }

  if (carregando) {
    return (
      <div style={loadingStyle}>
        Validando acesso ao módulo...
      </div>
    );
  }

  if (!liberado) {
    return (
      <div style={bloqueioContainerStyle}>
        <div style={bloqueioCardStyle}>
          <h1 style={tituloStyle}>Módulo bloqueado</h1>

          <p style={textoStyle}>
            {mensagem || "Seu plano atual não permite acessar este módulo."}
          </p>

          <p style={subTextoStyle}>
            Para liberar este recurso, será necessário atualizar sua assinatura.
          </p>

          <button
            type="button"
            onClick={() => (window.location.href = "/dashboard")}
            style={buttonStyle}
          >
            Voltar para o Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const loadingStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050510",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
};

const bloqueioContainerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, #35106b, #050510 35%, #00172f)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
};

const bloqueioCardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "28px",
  padding: "36px",
  boxShadow: "0 0 60px rgba(0,0,0,0.45)",
  textAlign: "center",
};

const tituloStyle: React.CSSProperties = {
  fontSize: "30px",
  marginBottom: "12px",
};

const textoStyle: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: "16px",
  lineHeight: 1.6,
};

const subTextoStyle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "14px",
  lineHeight: 1.6,
  marginTop: "12px",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "24px",
  padding: "14px 22px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

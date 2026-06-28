"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";

type ModoAuth = "login" | "recuperar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [modo, setModo] = useState<ModoAuth>("login");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "true") {
      setSucesso("E-mail confirmado com sucesso. Agora você já pode acessar o GIBA.");
    }
  }, []);

  async function fazerLogin(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setErro("Informe seu e-mail para entrar.");
      return;
    }

    if (!senha) {
      setErro("Informe sua senha.");
      return;
    }

    setCarregando(true);

    localStorage.removeItem("giba_colaborador_session");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailTratado,
      password: senha,
    });

    if (!error) {
      const userEmail = data.user?.email;

      const { data: colaborador } = await supabase
        .from("collaborators")
        .select("*")
        .eq("email", userEmail)
        .eq("status", "Ativo")
        .maybeSingle();

      setCarregando(false);

      if (colaborador) {
        localStorage.setItem(
          "giba_colaborador_session",
          JSON.stringify({
            id: colaborador.id,
            nome: colaborador.nome,
            email: colaborador.email,
            funcao: colaborador.funcao,
            user_id: colaborador.user_id,
            tipo: "colaborador",
          })
        );

        window.location.href = "/agenda-colaborador";
        return;
      }

      window.location.href = "/dashboard";
      return;
    }

    const { data: colaborador, error: erroColaborador } = await supabase
      .from("collaborators")
      .select("*")
      .eq("email", emailTratado)
      .eq("senha", senha)
      .eq("status", "Ativo")
      .maybeSingle();

    setCarregando(false);

    if (erroColaborador) {
      console.error("Erro ao buscar colaborador:", erroColaborador);
      setErro("Não foi possível validar o acesso do colaborador. Tente novamente.");
      return;
    }

    if (!colaborador) {
      setErro("E-mail ou senha inválidos. Confira os dados e tente novamente.");
      return;
    }

    localStorage.setItem(
      "giba_colaborador_session",
      JSON.stringify({
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        funcao: colaborador.funcao,
        user_id: colaborador.user_id,
        tipo: "colaborador",
      })
    );

    window.location.href = "/agenda-colaborador";
  }

  async function enviarRecuperacao(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setErro("Informe o e-mail cadastrado para receber o link.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(emailTratado, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setCarregando(false);

    if (error) {
      console.error("Erro ao enviar recuperação de senha:", error);
      setErro("Não foi possível enviar o link agora. Confira o e-mail e tente novamente.");
      return;
    }

    setSucesso("Enviamos um link de redefinição para o e-mail informado.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#050816,#071426,#0B1020)] px-5 py-8 text-white">
      <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/30 blur-[100px]" />
      <div className="absolute bottom-[-140px] right-[-120px] h-[420px] w-[420px] rounded-full bg-sky-500/25 blur-[110px]" />

      <section className="relative z-10 w-full max-w-[520px] rounded-[32px] border border-white/[0.12] bg-white/[0.06] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white">
          <ArrowLeft size={16} />
          Voltar para o site
        </Link>

        <div className="mb-7 rounded-[26px] border border-white/[0.08] bg-slate-950/25 p-5 text-center">
          <img src="/logo-giba-horizontal.png" alt="GIBA" className="mx-auto mb-5 h-auto w-[230px]" />
          <h1 className="text-3xl font-black tracking-[-0.03em] text-white">
            {modo === "login" ? "Bem-vindo ao GIBA" : "Recuperar senha"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-300">
            {modo === "login"
              ? "Acesse sua plataforma de gestão artística."
              : "Informe seu e-mail cadastrado para receber o link de redefinição de senha."}
          </p>
        </div>

        {modo === "login" ? (
          <form onSubmit={fazerLogin} className="grid gap-4">
            <AuthInput
              icon={<Mail size={18} />}
              label="E-mail"
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={setEmail}
              required
            />

            <div className="grid gap-2">
              <AuthInput
                icon={<Lock size={18} />}
                label="Senha"
                type={mostrarSenha ? "text" : "password"}
                placeholder="Digite sua senha"
                value={senha}
                onChange={setSenha}
                required
                action={
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((atual) => !atual)}
                    className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                    aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <button
                type="button"
                onClick={() => {
                  setErro("");
                  setSucesso("");
                  setModo("recuperar");
                }}
                className="w-fit text-sm font-bold text-sky-300 transition hover:text-sky-200"
              >
                Esqueceu sua senha?
              </button>
            </div>

            <Feedback erro={erro} sucesso={sucesso} />

            <button
              type="submit"
              disabled={carregando}
              className="mt-1 h-12 rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {carregando ? "Entrando..." : "Entrar no GIBA"}
            </button>
          </form>
        ) : (
          <form onSubmit={enviarRecuperacao} className="grid gap-4">
            <AuthInput
              icon={<Mail size={18} />}
              label="E-mail"
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={setEmail}
              required
            />

            <Feedback erro={erro} sucesso={sucesso} />

            <button
              type="submit"
              disabled={carregando}
              className="h-12 rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <button
              type="button"
              onClick={() => {
                setErro("");
                setSucesso("");
                setModo("login");
              }}
              className="h-12 rounded-[16px] border border-white/10 bg-white/[0.07] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
            >
              Voltar ao login
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5 text-sm">
          <span className="text-slate-400">Ainda não tem conta?</span>
          <Link href="/cadastro" className="font-black text-sky-300 transition hover:text-sky-200">
            Criar conta no GIBA
          </Link>
        </div>
      </section>
    </main>
  );
}

function AuthInput({
  icon,
  label,
  value,
  onChange,
  action,
  ...props
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  action?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-300">{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-3 transition focus-within:border-sky-400/60">
        <span className="text-slate-400">{icon}</span>
        <input
          {...props}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
        />
        {action}
      </div>
    </label>
  );
}

function Feedback({ erro, sucesso }: { erro: string; sucesso: string }) {
  if (!erro && !sucesso) return null;

  return (
    <div
      className={
        erro
          ? "rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
          : "rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200"
      }
    >
      {erro || sucesso}
    </div>
  );
}

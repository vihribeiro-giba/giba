"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function CadastroPage() {
  const [nomeArtistico, setNomeArtistico] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  async function criarRegistrosIniciais(userId: string, nomeTratado: string, emailTratado: string) {
    const { error: erroEmpresa } = await supabase.from("company_settings").insert({
      user_id: userId,
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
      return false;
    }

    const dataInicioTrial = new Date();
    const dataFimTrial = new Date();
    dataFimTrial.setDate(dataFimTrial.getDate() + 7);

    const { error: erroAssinatura } = await supabase.from("subscriptions").insert({
      user_id: userId,
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
      return false;
    }

    return true;
  }

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

    if (!emailTratado || !emailTratado.includes("@")) {
      setErro("Informe um e-mail válido.");
      return;
    }

    if (!senha) {
      setErro("Informe uma senha.");
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
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        data: {
          nome_artistico: nomeTratado,
          nome: nomeTratado,
        },
      },
    });

    if (error) {
      console.error("Erro ao criar usuário:", error);
      const mensagem = error.message.toLowerCase();
      if (mensagem.includes("already") || mensagem.includes("registered") || mensagem.includes("exists")) {
        setErro("Este e-mail já possui uma conta. Tente fazer login.");
      } else if (mensagem.includes("password")) {
        setErro("A senha precisa ter pelo menos 6 caracteres.");
      } else {
        setErro("Não foi possível criar sua conta agora. Tente novamente.");
      }
      setCarregando(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setErro("Não foi possível criar sua conta agora. Tente novamente.");
      setCarregando(false);
      return;
    }

    if (!data.session) {
      await criarRegistrosIniciais(user.id, nomeTratado, emailTratado);
      setAguardandoConfirmacao(true);
      setSucesso("Enviamos um link de confirmação para o seu e-mail.");
      setCarregando(false);
      return;
    }

    const registrosCriados = await criarRegistrosIniciais(user.id, nomeTratado, emailTratado);

    if (!registrosCriados) {
      setErro("Conta criada, mas houve erro ao preparar suas configurações iniciais.");
      setCarregando(false);
      return;
    }

    setSucesso("Conta criada com sucesso. Redirecionando...");
    setCarregando(false);

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  }

  async function reenviarConfirmacao() {
    setErro("");
    setSucesso("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setErro("Informe o e-mail cadastrado para reenviar a confirmação.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailTratado,
        options: {
          emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
        },
      });

      if (error) {
        setErro("Não foi possível reenviar automaticamente. Tente fazer login novamente ou entre em contato com o suporte.");
        setCarregando(false);
        return;
      }

      setSucesso("E-mail de confirmação reenviado.");
    } catch (error) {
      console.error("Erro ao reenviar confirmação:", error);
      setErro("Não foi possível reenviar automaticamente. Tente fazer login novamente ou entre em contato com o suporte.");
    }

    setCarregando(false);
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
            {aguardandoConfirmacao ? "Confirme seu e-mail" : "Crie sua conta no GIBA"}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-300">
            {aguardandoConfirmacao
              ? "Enviamos um link de confirmação para o seu e-mail. Acesse sua caixa de entrada para ativar sua conta."
              : "Comece a organizar sua carreira artística com mais profissionalismo."}
          </p>
        </div>

        {aguardandoConfirmacao ? (
          <div className="grid gap-4">
            <Feedback erro={erro} sucesso={sucesso} />

            <Link
              href="/login"
              className="flex h-12 items-center justify-center rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.24)] transition hover:-translate-y-0.5"
            >
              Ir para o login
            </Link>

            <button
              type="button"
              onClick={reenviarConfirmacao}
              disabled={carregando}
              className="h-12 rounded-[16px] border border-white/10 bg-white/[0.07] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {carregando ? "Reenviando..." : "Reenviar e-mail de confirmação"}
            </button>
          </div>
        ) : (
          <form onSubmit={criarConta} className="grid gap-4">
            <AuthInput
              icon={<User size={18} />}
              label="Nome artístico ou empresa"
              type="text"
              placeholder="Ex: Banda GIBA, Vih Ribeiro..."
              value={nomeArtistico}
              onChange={setNomeArtistico}
              required
            />

            <AuthInput
              icon={<Mail size={18} />}
              label="E-mail"
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={setEmail}
              required
            />

            <AuthInput
              icon={<Lock size={18} />}
              label="Senha"
              type={mostrarSenha ? "text" : "password"}
              placeholder="Mínimo de 6 caracteres"
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

            <AuthInput
              icon={<Lock size={18} />}
              label="Confirmar senha"
              type={mostrarConfirmacao ? "text" : "password"}
              placeholder="Digite a senha novamente"
              value={confirmarSenha}
              onChange={setConfirmarSenha}
              required
              action={
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacao((atual) => !atual)}
                  className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                  aria-label={mostrarConfirmacao ? "Ocultar confirmação" : "Mostrar confirmação"}
                >
                  {mostrarConfirmacao ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <Feedback erro={erro} sucesso={sucesso} />

            <button
              type="submit"
              disabled={carregando}
              className="mt-1 h-12 rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {carregando ? "Criando conta..." : "Criar conta no GIBA"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 border-t border-white/10 pt-5 text-sm">
          <span className="text-slate-400">Já tem conta?</span>
          <Link href="/login" className="font-black text-sky-300 transition hover:text-sky-200">
            Entrar no GIBA
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

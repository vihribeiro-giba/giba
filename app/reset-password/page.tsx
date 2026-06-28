"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function salvarNovaSenha(e: React.FormEvent) {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (!novaSenha) {
      setErro("Informe a nova senha.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    setCarregando(false);

    if (error) {
      console.error("Erro ao atualizar senha:", error);
      setErro("Não foi possível atualizar sua senha. Abra novamente o link recebido por e-mail.");
      return;
    }

    setSucesso("Senha atualizada com sucesso.");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#050816,#071426,#0B1020)] px-5 py-8 text-white">
      <div className="absolute left-[-140px] top-[-120px] h-[360px] w-[360px] rounded-full bg-violet-600/30 blur-[100px]" />
      <div className="absolute bottom-[-140px] right-[-120px] h-[420px] w-[420px] rounded-full bg-sky-500/25 blur-[110px]" />

      <section className="relative z-10 w-full max-w-[460px] rounded-[28px] border border-white/[0.12] bg-white/[0.06] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
        <div className="mb-7 text-center">
          <img src="/logo-giba-horizontal.png" alt="GIBA" className="mx-auto mb-5 h-auto w-[210px]" />
          <h1 className="text-3xl font-black tracking-[-0.03em] text-white">Redefinir senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">Crie uma nova senha para acessar sua conta GIBA.</p>
        </div>

        <form onSubmit={salvarNovaSenha} className="grid gap-4">
          <PasswordInput
            label="Nova senha"
            value={novaSenha}
            onChange={setNovaSenha}
            placeholder="Mínimo de 6 caracteres"
            type={mostrarSenha ? "text" : "password"}
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

          <PasswordInput
            label="Confirmar senha"
            value={confirmarSenha}
            onChange={setConfirmarSenha}
            placeholder="Digite a senha novamente"
            type={mostrarSenha ? "text" : "password"}
          />

          {(erro || sucesso) && (
            <div
              className={
                erro
                  ? "rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200"
                  : "rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200"
              }
            >
              {erro || sucesso}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="h-12 rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-5 flex h-12 items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.07] text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
        >
          Ir para o login
        </Link>
      </section>
    </main>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  action,
  ...props
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  action?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-300">{label}</span>
      <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-3 transition focus-within:border-sky-400/60">
        <span className="text-slate-400">
          <Lock size={18} />
        </span>
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

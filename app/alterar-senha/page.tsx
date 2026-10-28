"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

export default function AlterarSenhaPage() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setVerificando(false);
    });
    return () => { active = false; };
  }, []);

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (novaSenha.length < 6) {
      setErro("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("A confirmação não corresponde à nova senha.");
      return;
    }
    if (senhaAtual === novaSenha) {
      setErro("Escolha uma senha diferente da atual.");
      return;
    }

    setCarregando(true);
    const { data: userData } = await supabase.auth.getUser();
    const email = userData.user?.email;
    if (!email) {
      setErro("Não foi possível identificar o usuário conectado.");
      setCarregando(false);
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senhaAtual });
    if (loginError) {
      setErro("A senha atual está incorreta.");
      setCarregando(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
    if (updateError) {
      setErro(updateError.message || "Não foi possível alterar a senha.");
      setCarregando(false);
      return;
    }

    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");
    setMensagem("Senha alterada com sucesso.");
    setCarregando(false);
  }

  if (verificando) {
    return <div className="grid min-h-screen place-items-center bg-[#050510] text-white">Verificando acesso...</div>;
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-2xl text-white">
        <header className="mb-6 flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_14px_30px_rgba(139,53,255,0.30)]">
            <KeyRound size={24} />
          </div>
          <div>
            <h1 className="text-[28px] font-black leading-tight tracking-[-0.5px]">Alterar Senha</h1>
            <p className="mt-1 text-sm text-slate-400">Atualize sua senha de acesso à Plataforma GIBA.</p>
          </div>
        </header>

        <form onSubmit={salvar} className="grid gap-5 rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl sm:p-7">
          <div className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-slate-300">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-300" />
            A alteração é feita diretamente no seu acesso seguro. A nova senha não fica visível nem armazenada no cadastro do colaborador.
          </div>

          <PasswordField label="Senha Atual" value={senhaAtual} onChange={setSenhaAtual} />
          <PasswordField label="Nova Senha" value={novaSenha} onChange={setNovaSenha} />
          <PasswordField label="Confirmar Nova Senha" value={confirmacao} onChange={setConfirmacao} />

          {erro && <p className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{erro}</p>}
          {mensagem && <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{mensagem}</p>}

          <button type="submit" disabled={carregando} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 px-5 font-black shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={17} />
            {carregando ? "Alterando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-200">
      {label}
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={label === "Senha atual" ? "current-password" : "new-password"}
        required
        className="min-h-12 rounded-xl border border-white/15 bg-slate-950/40 px-4 font-normal text-white outline-none focus:border-sky-400/60"
      />
    </label>
  );
}

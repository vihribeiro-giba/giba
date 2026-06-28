"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useState } from "react";
import { BadgeCheck, Building2, FileText, ImageIcon, Save, Settings, UserRound, WalletCards } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Empresa = {
  id: string;
  user_id?: string;
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

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarEmpresa() {
    const user = await obterUsuarioLogado();
    if (!user) return;

    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar dados da empresa:", error);
      alert("Erro ao carregar dados da empresa.");
      return;
    }

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
    const user = await obterUsuarioLogado();
    if (!user) return;

    const extensao = file.name.split(".").pop();
    const nomeArquivo = `${user.id}/logo-${Date.now()}.${extensao}`;

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

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    const dados = {
      user_id: user.id,
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
        .eq("id", empresaId)
        .eq("user_id", user.id);

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
    <PlanProtectedRoute modulo="configuracoes">
      <AppLayout>
      <div className="min-h-screen text-white">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid h-[68px] w-[68px] shrink-0 place-items-center rounded-[22px] bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_18px_38px_rgba(59,130,246,0.2)]">
              <Settings size={31} />
            </div>
            <div>
              <h1 className="text-[34px] font-black leading-tight tracking-[-0.02em] text-white">Configurações</h1>
              <p className="mt-1 max-w-3xl text-base leading-7 text-slate-300">
                Gerencie os dados da sua conta, artista, empresa e preferências da plataforma.
              </p>
            </div>
          </div>

          <button
            type="submit"
            form="configuracoes-form"
            disabled={carregando}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-violet-600 to-sky-500 px-5 text-sm font-black text-white shadow-[0_18px_36px_rgba(139,53,255,0.22)] transition hover:-translate-y-0.5 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save size={17} />
            {carregando ? "Salvando..." : "Salvar Alterações"}
          </button>
        </header>

        <form id="configuracoes-form" onSubmit={salvarEmpresa} className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="grid gap-6">
            <ConfigCard icon={<UserRound size={18} />} title="Perfil do Artista" subtitle="Informações públicas e contatos principais.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Nome artístico" value={nomeArtistico} onChange={setNomeArtistico} placeholder="Nome artístico" />
                <Field label="Nome do responsável" value={responsavel} onChange={setResponsavel} placeholder="Responsável" />
                <Field label="CPF" value={cpf} onChange={setCpf} placeholder="CPF" />
                <Field label="Telefone" value={telefone} onChange={setTelefone} placeholder="Telefone" />
                <Field label="E-mail" value={email} onChange={setEmail} placeholder="E-mail" />
                <Field label="Cidade" value={cidade} onChange={setCidade} placeholder="Cidade" />
                <Field label="Estado" value={estado} onChange={setEstado} placeholder="Estado" />
              </div>
            </ConfigCard>

            <ConfigCard icon={<Building2 size={18} />} title="Dados da Empresa" subtitle="Dados fiscais e endereço usados em documentos.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Razão social" value={razaoSocial} onChange={setRazaoSocial} placeholder="Razão social" />
                <Field label="CNPJ" value={cnpj} onChange={setCnpj} placeholder="CNPJ" />
                <Field label="Cidade" value={cidade} onChange={setCidade} placeholder="Cidade" />
                <Field label="Estado" value={estado} onChange={setEstado} placeholder="Estado" />
                <div className="md:col-span-2">
                  <TextArea label="Endereço completo" value={enderecoCompleto} onChange={setEnderecoCompleto} placeholder="Endereço completo" />
                </div>
              </div>
            </ConfigCard>

            <ConfigCard icon={<WalletCards size={18} />} title="Contratos e Pagamentos" subtitle="Dados bancários e observações padrão para contratos e documentos.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="PIX" value={pix} onChange={setPix} placeholder="PIX" />
                <Field label="Banco" value={banco} onChange={setBanco} placeholder="Banco" />
              </div>
            </ConfigCard>

            <ConfigCard icon={<FileText size={18} />} title="Preferências" subtitle="Preferências operacionais da plataforma.">
              <div className="rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4 text-sm leading-6 text-slate-300">
                Os dados cadastrados são aplicados automaticamente a contratos, documentos e rotinas integradas da Plataforma GIBA.
              </div>
            </ConfigCard>
          </main>

          <aside className="grid gap-6 xl:sticky xl:top-6 xl:self-start">
            <ConfigCard icon={<ImageIcon size={18} />} title="Identidade Visual" subtitle="Logo usada nos documentos da plataforma.">
              <div className="grid gap-4">
                <div className="flex h-[220px] items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/35">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo da empresa" className="max-h-[180px] max-w-full object-contain" />
                  ) : (
                    <p className="text-sm text-slate-400">Nenhuma logo cadastrada.</p>
                  )}
                </div>

                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/45 p-3 text-sm font-semibold text-slate-200 file:mr-3 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-violet-600 file:to-sky-500 file:px-3 file:py-2 file:text-sm file:font-black file:text-white"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo(file);
                  }}
                />

                <p className="text-xs leading-5 text-slate-400">Recomendado: PNG com fundo transparente.</p>
              </div>
            </ConfigCard>

            <ResumoConfiguracoes
              logoUrl={logoUrl}
              empresaId={empresaId}
              preenchidos={[
                nomeArtistico,
                responsavel,
                telefone,
                email,
                cidade,
                estado,
                razaoSocial,
                cnpj,
                cpf,
                enderecoCompleto,
                pix,
                banco,
              ].filter((valor) => valor.trim()).length}
              total={12}
            />
          </aside>
        </form>
      </div>

      {false && (
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
      )}
      </AppLayout>
    </PlanProtectedRoute>
  </ProtectedRoute>
);
}

function ConfigCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/[0.10] bg-white/[0.05] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/15 text-violet-200">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[112px] w-full resize-y rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60"
      />
    </label>
  );
}

function ResumoConfiguracoes({
  logoUrl,
  empresaId,
  preenchidos,
  total,
}: {
  logoUrl: string;
  empresaId: string | null;
  preenchidos: number;
  total: number;
}) {
  const percentual = Math.round((preenchidos / total) * 100);
  const completo = percentual >= 85 && Boolean(logoUrl);

  return (
    <section className="rounded-3xl border border-white/[0.10] bg-white/[0.05] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-emerald-400/25 bg-emerald-500/15 text-emerald-200">
          <BadgeCheck size={18} />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-[-0.02em] text-white">Resumo</h2>
          <p className="text-sm text-slate-400">Saúde do cadastro.</p>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-slate-400">Dados completos</span>
            <strong className="text-white">{percentual}%</strong>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-sky-500" style={{ width: `${percentual}%` }} />
          </div>
        </div>

        <ResumoLinha label="Registro" value={empresaId ? "Existente" : "Novo"} />
        <ResumoLinha label="Logo" value={logoUrl ? "Cadastrada" : "Pendente"} />
        <ResumoLinha label="Status" value={completo ? "Dados completos" : "Revise informações essenciais"} />
      </div>
    </section>
  );
}

function ResumoLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/25 px-4 py-3">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <strong className="text-right text-sm font-black text-white">{value}</strong>
    </div>
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

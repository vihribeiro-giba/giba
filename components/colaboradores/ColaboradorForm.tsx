import type React from "react";
import { Check, LockKeyhole, ShieldCheck } from "lucide-react";
import type { PixTipo } from "./types";
import { placeholderPix } from "./utils";
import AvatarUpload from "./AvatarUpload";
import GibaSelect from "../GibaSelect";
import {
  ACCESS_MODULE_GROUPS,
  ACCESS_MODULES,
  buildAccessEmail,
  type AccessModuleKey,
} from "../../lib/access-modules";

type Props = {
  editandoId: string | null;
  salvando: boolean;
  enviandoFoto: boolean;
  nome: string; setNome: (v: string) => void;
  funcao: string; setFuncao: (v: string) => void;
  celular: string; setCelular: (v: string) => void;
  accessIdentifier: string; setAccessIdentifier: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  professionalDomain: string;
  domainError: string;
  instagram: string; setInstagram: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  pixTipo: PixTipo; setPixTipo: (v: PixTipo) => void;
  pixChave: string; setPixChave: (v: string) => void;
  observacoes: string; setObservacoes: (v: string) => void;
  allowedModules: AccessModuleKey[];
  setAllowedModules: (v: AccessModuleKey[]) => void;
  availableModules: AccessModuleKey[];
  photoUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelecionarFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoverFoto: () => void;
  formRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onCancelar: () => void;
};

function formatarCelular(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function ColaboradorForm(props: Props) {
  const available = new Set(props.availableModules);
  const selectableGroups = ACCESS_MODULE_GROUPS.filter((group) =>
    ACCESS_MODULES.some((item) => item.group === group.key && !item.ownerOnly),
  );

  function toggleModule(key: AccessModuleKey) {
    if (!available.has(key)) return;
    props.setAllowedModules(props.allowedModules.includes(key)
      ? props.allowedModules.filter((item) => item !== key)
      : [...props.allowedModules, key]);
  }

  const accessEmail = buildAccessEmail(props.accessIdentifier, props.professionalDomain);

  return (
    <div ref={props.formRef} className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-2xl sm:p-6">
      <div className="flex items-center justify-between gap-3 pr-12">
        <h2 className="text-xl font-black text-white">{props.editandoId ? "Editar colaborador" : "Cadastrar colaborador"}</h2>
        {props.editandoId && <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-300">Editando</span>}
      </div>

      <form onSubmit={props.onSubmit} className="mt-6 grid gap-5">
        <section className="grid gap-4">
          <SectionTitle title="Dados pessoais" subtitle="Informações profissionais e de contato." />
          <AvatarUpload photoUrl={props.photoUrl} nome={props.nome} enviandoFoto={props.enviandoFoto} fileInputRef={props.fileInputRef} onSelecionar={props.onSelecionarFoto} onRemover={props.onRemoverFoto} />
          <Field label="Nome completo" value={props.nome} onChange={props.setNome} required />
          <Field label="Função" value={props.funcao} onChange={props.setFuncao} placeholder="Ex.: Baterista, técnico de som, produtor" />
          <Field label="Celular" value={props.celular} onChange={(value) => props.setCelular(formatarCelular(value))} inputMode="numeric" />
          <Field label="Instagram" value={props.instagram} onChange={props.setInstagram} placeholder="@seuperfil" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Select label="Tipo de chave PIX" value={props.pixTipo} onChange={(value) => props.setPixTipo(value as PixTipo)} options={["CPF", "Telefone", "E-mail", "Chave Aleatória"]} />
            <Field label="Chave PIX" value={props.pixChave} onChange={props.setPixChave} placeholder={placeholderPix(props.pixTipo)} />
          </div>
          <TextArea label="Observações" value={props.observacoes} onChange={props.setObservacoes} />
        </section>

        <section className="grid gap-4 border-t border-white/10 pt-5">
          <SectionTitle title="Acesso à plataforma" subtitle="Defina o identificador e a senha usados pelo colaborador para entrar na plataforma." icon={<ShieldCheck size={18} />} />
          {props.domainError ? (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">{props.domainError}</div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-200">E-mail de acesso</label>
              <div className="flex min-h-12 overflow-hidden rounded-xl border border-white/15 bg-slate-950/40 focus-within:border-sky-400/60">
                <input className="min-w-0 flex-1 bg-transparent px-4 text-white outline-none" value={props.accessIdentifier} onChange={(event) => props.setAccessIdentifier(event.target.value)} placeholder="nome.sobrenome" autoCapitalize="none" spellCheck={false} />
                <span className="flex items-center border-l border-white/10 bg-white/[0.05] px-3 text-sm font-bold text-cyan-200">@{props.professionalDomain}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">E-mail completo: <strong className="text-slate-300">{accessEmail || "preencha o identificador"}</strong></p>
            </div>
          )}
          <Field
            label={props.editandoId ? "Nova senha (opcional)" : "Senha inicial"}
            value={props.password}
            onChange={props.setPassword}
            placeholder={props.editandoId ? "Preencha somente para alterar" : "Mínimo de 6 caracteres"}
            type="password"
            required={!props.editandoId && props.allowedModules.length > 0}
          />

          <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h3 className="font-black text-white">Acessos do colaborador</h3><p className="mt-1 text-xs text-slate-400">Selecione os módulos que este colaborador poderá acessar.</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => props.setAllowedModules([...props.availableModules])} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-200">Selecionar todos</button>
                <button type="button" onClick={() => props.setAllowedModules([])} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-400">Limpar</button>
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              {selectableGroups.map((group) => (
                <div key={group.key}>
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[.14em] text-cyan-300">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCESS_MODULES.filter((item) => item.group === group.key && !item.ownerOnly).map((item) => {
                      const enabled = available.has(item.key);
                      const checked = enabled && props.allowedModules.includes(item.key);
                      return <button key={item.key} type="button" disabled={!enabled} title={enabled ? item.label : "Não disponível no plano atual"} onClick={() => toggleModule(item.key)} className={`flex min-h-10 items-center gap-2.5 rounded-lg border px-3 py-1.5 text-left transition ${checked ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/[0.08] bg-white/[0.025]"} ${enabled ? "hover:border-white/20" : "cursor-not-allowed opacity-45"}`}>
                        <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded border ${checked ? "border-cyan-300 bg-cyan-400 text-slate-950" : "border-white/25"}`}>{checked && <Check size={12} strokeWidth={3} />}</span>
                        <strong className="whitespace-nowrap text-[13px] text-white">{item.label}</strong>
                      </button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Select label="Status" value={props.status} onChange={props.setStatus} options={["Ativo", "Inativo"]} />
          <div className="flex items-start gap-2 rounded-xl bg-violet-400/[0.08] p-3 text-xs leading-5 text-violet-100"><LockKeyhole size={15} className="mt-0.5 shrink-0" />Colaboradores inativos ou sem módulos liberados não conseguem acessar a plataforma.</div>
        </section>

        <button type="submit" disabled={props.salvando || props.enviandoFoto || Boolean(props.domainError)} className="min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 px-4 font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50">
          {props.salvando ? "Salvando..." : props.enviandoFoto ? "Enviando foto..." : props.editandoId ? "Salvar alterações" : "Cadastrar e enviar convite"}
        </button>
        {props.editandoId && <button type="button" onClick={props.onCancelar} className="min-h-12 rounded-xl border border-white/15 bg-white/[0.05] font-bold text-white">Cancelar edição</button>}
      </form>
    </div>
  );
}

function SectionTitle({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
  return <div className="flex items-start gap-2"><span className="mt-0.5 text-cyan-300">{icon}</span><div><h3 className="font-black text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p></div></div>;
}

function Field({ label, value, onChange, placeholder, type = "text", required, inputMode }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"] }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-200">{label}<input className="min-h-12 rounded-xl border border-white/15 bg-slate-950/40 px-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-sky-400/60" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type={type} required={required} inputMode={inputMode} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-bold text-slate-200">{label}<textarea rows={4} className="resize-y rounded-xl border border-white/15 bg-slate-950/40 p-4 font-normal text-white outline-none placeholder:text-slate-600 focus:border-sky-400/60" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { value: string; label: string }> }) {
  const normalizedOptions = options.map((option) => typeof option === "string" ? { value: option, label: option } : option);
  return <div className="grid gap-2 text-sm font-bold text-slate-200"><span>{label}</span><GibaSelect value={value} onChange={onChange} options={normalizedOptions} triggerClassName="min-h-12 font-normal" /></div>;
}

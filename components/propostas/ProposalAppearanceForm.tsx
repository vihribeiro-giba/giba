import { ImagePlus } from "lucide-react";
import { BUILT_IN_TEMPLATES } from "../../lib/proposals/defaults";
import type { ProposalVisualConfig } from "../../lib/proposals/types";

export default function ProposalAppearanceForm({ value, onChange, onUpload }: { value: ProposalVisualConfig; onChange: (value: ProposalVisualConfig) => void; onUpload: (field: keyof ProposalVisualConfig, file: File) => void }) {
  const update = <K extends keyof ProposalVisualConfig>(key: K, next: ProposalVisualConfig[K]) => onChange({ ...value, [key]: next });
  const uploadFields: Array<{ key: keyof ProposalVisualConfig; label: string }> = [
    { key: "coverBackgroundPath", label: "Fundo da capa" }, { key: "contentBackgroundPath", label: "Fundo das páginas" },
    { key: "mainPhotoPath", label: "Foto principal" }, { key: "logoPath", label: "Logo" }, { key: "signaturePath", label: "Assinatura" },
  ];
  const companyFields = [
    { key: "nome_artistico", label: "Nome artístico" }, { key: "razao_social", label: "Razão social" },
    { key: "cnpj", label: "CNPJ" }, { key: "cpf", label: "CPF" }, { key: "telefone", label: "Telefone" },
    { key: "email", label: "E-mail" }, { key: "instagram", label: "Instagram" }, { key: "endereco_completo", label: "Endereço" },
  ];
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">{BUILT_IN_TEMPLATES.map((template) => <button type="button" onClick={() => update("templateType", template.type)} key={template.type} className={`rounded-2xl border p-5 text-left ${value.templateType === template.type ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/[.035]"}`}><strong className="text-white">{template.name}</strong><p className="mt-1 text-sm text-slate-400">{template.description}</p></button>)}</div>
    <div className="grid gap-4 sm:grid-cols-2">{uploadFields.map((field) => <label key={field.key} className="flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/15 bg-white/[.025] p-4 hover:border-cyan-400/40"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><ImagePlus size={20} /></span><span><strong className="block text-sm text-white">{field.label}</strong><small className="text-slate-500">PNG, JPG ou WEBP • máx. 8 MB</small>{value[field.key] && <small className="block text-emerald-300">Arquivo selecionado</small>}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onUpload(field.key, file); }} /></label>)}</div>
    <div className="grid gap-4 sm:grid-cols-3">{([{ key: "primaryColor", label: "Cor principal" }, { key: "secondaryColor", label: "Cor secundária" }, { key: "textColor", label: "Cor do texto" }] as const).map((field) => <label key={field.key} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm font-bold text-slate-300">{field.label}<input type="color" value={value[field.key]} onChange={(event) => update(field.key, event.target.value)} className="mt-3 h-10 w-full cursor-pointer rounded-lg bg-transparent" /></label>)}</div>
    <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] p-4"><span><strong className="block text-white">Marca-d’água</strong><small className="text-slate-500">Exibe o logo suavemente nas páginas internas.</small></span><input type="checkbox" checked={value.watermark} onChange={(event) => update("watermark", event.target.checked)} className="h-5 w-5 accent-violet-500" /></label>
    <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5"><h3 className="font-black text-white">Informações Exibidas</h3><p className="mt-1 text-sm text-slate-500">Escolha os dados da empresa que podem aparecer na proposta.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{companyFields.map((field) => <label key={field.key} className="flex items-center gap-3 text-sm font-bold text-slate-300"><input type="checkbox" checked={(value.companyFields || []).includes(field.key)} onChange={(event) => update("companyFields", event.target.checked ? [...(value.companyFields || []), field.key] : (value.companyFields || []).filter((key) => key !== field.key))} className="h-4 w-4 accent-violet-500" />{field.label}</label>)}</div></div>
  </div>;
}

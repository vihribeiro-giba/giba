import { Check } from "lucide-react";

const STEPS = ["Informações", "Conteúdo", "Aparência", "Revisão"];
export default function ProposalStepper({ current, onChange }: { current: number; onChange: (step: number) => void }) {
  return <nav aria-label="Etapas da proposta" className="grid grid-cols-2 gap-2 rounded-[22px] border border-white/10 bg-[#091326]/85 p-2 lg:grid-cols-4">{STEPS.map((label, index) => { const number=index+1; const active=number===current; const done=number<current; return <button type="button" key={label} onClick={() => onChange(number)} className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-black transition ${active ? "bg-gradient-to-r from-violet-600 to-sky-500 text-white" : "text-slate-400 hover:bg-white/[.05]"}`}><span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${active || done ? "bg-white/15 text-white" : "bg-white/[.06]"}`}>{done ? <Check size={14} /> : number}</span>{label}</button>; })}</nav>;
}

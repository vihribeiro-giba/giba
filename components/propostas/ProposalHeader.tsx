import Link from "next/link";
import { FilePenLine, LayoutTemplate, Plus } from "lucide-react";

export default function ProposalHeader() {
  return (
    <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_14px_30px_rgba(139,53,255,.30)]"><FilePenLine size={24} /></div>
        <div>
          <p className="text-xs font-black tracking-[.18em] text-cyan-300">PROPOSTAS COMERCIAIS</p>
          <h1 className="mt-1 text-[28px] font-black leading-tight tracking-[-.5px] text-white">Propostas</h1>
          <p className="mt-1 text-sm text-slate-400">Crie, personalize e envie propostas profissionais para seus clientes.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/propostas/modelos" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-5 font-extrabold text-slate-200 hover:bg-white/10"><LayoutTemplate size={19} /> Modelos</Link>
        <Link href="/propostas/nova" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-sky-500 px-6 font-black text-white shadow-[0_12px_30px_rgba(91,76,255,.3)]"><Plus size={20} /> Nova proposta</Link>
      </div>
    </header>
  );
}

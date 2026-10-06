import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, UserRound } from "lucide-react";
import { formatProductionDate } from "../../lib/production/constants";
import type { Production, ProductionCollaborator, ProductionProgress } from "../../lib/production/types";
import { EmptyState, ProductionProgressBar, ProductionStatusBadge, productionPanelClass, productionSecondaryButtonClass } from "./ProductionUi";

export default function ProductionList({ productions, collaborators, progress }: {
  productions: Production[]; collaborators: ProductionCollaborator[]; progress: Record<string, ProductionProgress>;
}) {
  const managerName = (id: string | null) => collaborators.find((item) => item.id === id)?.nome || "Não definido";
  if (!productions.length) return <EmptyState title="Nenhuma produção encontrada" text="Crie uma produção ou ajuste os filtros para localizar uma operação." action={<Link href="/producao/nova" className={productionSecondaryButtonClass}>Nova produção</Link>} />;
  return (
    <>
      <div className={`${productionPanelClass} hidden overflow-hidden lg:block`}>
        <table className="w-full border-collapse text-left">
          <thead className="bg-white/[0.045] text-[11px] font-black uppercase tracking-[.12em] text-slate-400"><tr><th className="px-5 py-4">Evento</th><th className="px-4 py-4">Data / cidade</th><th className="px-4 py-4">Responsável</th><th className="px-4 py-4">Progresso</th><th className="px-4 py-4">Status</th><th className="px-5 py-4 text-right">Ação</th></tr></thead>
          <tbody>{productions.map((item) => <tr key={item.id} className="border-t border-white/[0.07] transition hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-black text-white">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.client_name || item.format_name || "Operação independente"}</p></td><td className="px-4 py-4 text-sm text-slate-300"><p>{formatProductionDate(item.event_date)}</p><p className="mt-1 text-xs text-slate-500">{item.city || item.venue || "Local a definir"}</p></td><td className="px-4 py-4 text-sm font-semibold text-slate-300">{managerName(item.manager_collaborator_id)}</td><td className="px-4 py-4"><ProductionProgressBar value={progress[item.id]?.percentage || 0} compact /></td><td className="px-4 py-4"><ProductionStatusBadge status={item.status} /></td><td className="px-5 py-4 text-right"><Link className={`${productionSecondaryButtonClass} min-h-9 px-3 py-2`} href={`/producao/${item.id}`}>Abrir <ArrowRight size={15} /></Link></td></tr>)}</tbody>
        </table>
      </div>
      <div className="grid gap-4 lg:hidden">{productions.map((item) => <Link key={item.id} href={`/producao/${item.id}`} className={`${productionPanelClass} block p-5 transition hover:border-cyan-400/30`}><div className="flex items-start justify-between gap-3"><div><h3 className="font-black text-white">{item.name}</h3><p className="mt-1 text-sm text-slate-500">{item.client_name || "Operação interna"}</p></div><ProductionStatusBadge status={item.status} /></div><div className="my-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-3"><span className="flex items-center gap-2"><CalendarDays size={14} />{formatProductionDate(item.event_date)}</span><span className="flex items-center gap-2"><MapPin size={14} />{item.city || item.venue || "A definir"}</span><span className="flex items-center gap-2"><UserRound size={14} />{managerName(item.manager_collaborator_id)}</span></div><ProductionProgressBar value={progress[item.id]?.percentage || 0} /></Link>)}</div>
    </>
  );
}

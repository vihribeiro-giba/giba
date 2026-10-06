import { Activity, CalendarClock, CheckCircle2, FileUp, ListChecks, UserPlus } from "lucide-react";
import { formatProductionDate } from "../../lib/production/constants";
import type { ProductionActivity } from "../../lib/production/types";
import { productionPanelClass } from "./ProductionUi";

const actionIcons = { production_created: CheckCircle2, status_changed: Activity, task_created: ListChecks, task_completed: ListChecks, task_deleted: ListChecks, member_added: UserPlus, member_removed: UserPlus, member_updated: UserPlus, document_uploaded: FileUp, document_deleted: FileUp, document_updated: FileUp, schedule_changed: CalendarClock };

export default function ProductionHistoryTab({ activities }: { activities: ProductionActivity[] }) {
  return <div><h2 className="text-xl font-black text-white">Histórico da produção</h2><p className="mb-5 text-sm text-slate-500">Registro cronológico das ações relevantes.</p><section className={`${productionPanelClass} p-5 sm:p-7`}>{activities.length ? <div className="relative space-y-0 before:absolute before:bottom-5 before:left-[19px] before:top-5 before:w-px before:bg-white/10">{activities.map((item) => { const Icon = actionIcons[item.action as keyof typeof actionIcons] || Activity; return <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0"><span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-400/25 bg-[#101827] text-violet-300"><Icon size={16} /></span><div className="min-w-0 pt-0.5"><p className="font-bold text-white">{item.description || item.action}</p><p className="mt-1 text-xs text-slate-500">{item.actor_name || "Usuário GIBA"} · {formatProductionDate(item.created_at, true)}</p></div></div>; })}</div> : <p className="py-12 text-center text-sm text-slate-500">Nenhuma atividade registrada.</p>}</section></div>;
}

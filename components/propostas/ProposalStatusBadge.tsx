import type { ProposalStatus } from "../../lib/proposals/types";

const STATUS: Record<ProposalStatus, { label: string; classes: string }> = {
  rascunho: { label: "Rascunho", classes: "border-slate-500/30 bg-slate-500/15 text-slate-300" },
  enviada: { label: "Enviada", classes: "border-sky-500/30 bg-sky-500/15 text-sky-300" },
  em_negociacao: { label: "Em negociação", classes: "border-amber-500/30 bg-amber-500/15 text-amber-300" },
  aprovada: { label: "Aprovada", classes: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300" },
  recusada: { label: "Recusada", classes: "border-rose-500/30 bg-rose-500/15 text-rose-300" },
  expirada: { label: "Expirada", classes: "border-orange-500/30 bg-orange-500/15 text-orange-300" },
};

export const PROPOSAL_STATUS_OPTIONS = Object.entries(STATUS).map(([value, config]) => ({ value: value as ProposalStatus, label: config.label }));

export default function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const config = STATUS[status] || STATUS.rascunho;
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-extrabold ${config.classes}`}>{config.label}</span>;
}

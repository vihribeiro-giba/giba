import { Search, SlidersHorizontal } from "lucide-react";
import GibaSelect from "../GibaSelect";
import { PROPOSAL_STATUS_OPTIONS } from "./ProposalStatusBadge";
import type { Proposal } from "../../lib/proposals/types";

export type ProposalFilterState = { search: string; status: string; format: string; client: string };

export default function ProposalFilters({ value, onChange, proposals, count }: { value: ProposalFilterState; onChange: (value: ProposalFilterState) => void; proposals: Proposal[]; count: number }) {
  const formats = [...new Set(proposals.map((item) => String(item.format_snapshot.nome || "")).filter(Boolean))].sort();
  const clients = [...new Set(proposals.map((item) => String(item.client_snapshot.nome || "")).filter(Boolean))].sort();
  const set = (key: keyof ProposalFilterState, next: string) => onChange({ ...value, [key]: next });
  return (
    <div className="grid gap-3 rounded-[22px] border border-white/10 bg-white/[.035] p-4 lg:grid-cols-[minmax(240px,1fr)_200px_200px_200px_auto]">
      <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 focus-within:border-cyan-400/50"><Search size={19} className="text-slate-500" /><input value={value.search} onChange={(e) => set("search", e.target.value)} placeholder="Buscar número, título ou cliente..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /></label>
      <GibaSelect value={value.status} onChange={(next) => set("status", next)} options={[{ value: "", label: "Todos os status" }, ...PROPOSAL_STATUS_OPTIONS]} triggerClassName="min-h-12 rounded-2xl" />
      <GibaSelect value={value.format} onChange={(next) => set("format", next)} options={[{ value: "", label: "Todos os formatos" }, ...formats.map((item) => ({ value: item, label: item }))]} triggerClassName="min-h-12 rounded-2xl" />
      <GibaSelect value={value.client} onChange={(next) => set("client", next)} options={[{ value: "", label: "Todos os clientes" }, ...clients.map((item) => ({ value: item, label: item }))]} searchable triggerClassName="min-h-12 rounded-2xl" />
      <span className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 text-sm font-extrabold text-slate-400"><SlidersHorizontal size={17} /> {count} resultados</span>
    </div>
  );
}

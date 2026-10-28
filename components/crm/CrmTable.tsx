import { CalendarClock, Eye, Landmark, MapPin, Users } from "lucide-react";

export type CrmTableRow = {
  oportunidade: {
    id: string;
    status: string;
  };
  municipio: {
    nome: string;
    estado: string | null;
    habitantes: number | null;
    distancia_bh: number | null;
  } | null;
  modeloContratacao: string;
  prioridade: string;
  proximoContato: string;
  ultimaAtualizacao: string | null;
};

type CrmTableProps = {
  rows: CrmTableRow[];
  loading: boolean;
  onOpen: (id: string) => void;
};

const statusLabels: Record<string, string> = {
  novo_lead: "Novo lead",
  contato_realizado: "Contato realizado",
  email_enviado: "E-mail enviado",
  proposta_enviada: "Proposta enviada",
  negociacao: "Negociação",
  aguardando_retorno: "Aguardando retorno",
  fechado: "Fechado",
  perdido: "Perdido",
};

export default function CrmTable({ rows, loading, onOpen }: CrmTableProps) {
  if (loading) {
    return (
      <div className="grid min-h-56 place-items-center rounded-[18px] border border-white/[0.08] bg-slate-950/20">
        <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
          Carregando CRM...
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-[18px] border border-dashed border-white/10 bg-slate-950/20 px-5 text-center">
        <div>
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] border border-violet-400/20 bg-violet-500/15 text-violet-200">
            <Landmark size={29} />
          </span>
          <h3 className="mt-4 text-lg font-black text-white">Nenhuma Prefeitura Encontrada</h3>
          <p className="mt-2 text-sm text-slate-400">Ajuste os filtros ou cadastre uma nova oportunidade.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-[18px] border border-white/[0.08] bg-slate-950/20 xl:block">
        <div className="grid grid-cols-[1.25fr_.9fr_.9fr_1fr_1fr_.85fr_.85fr_48px] items-center gap-2 border-b border-white/[0.08] bg-white/[0.035] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.11em] text-slate-500">
          <span>Prefeitura</span>
          <span>Status</span>
          <span>Modelo</span>
          <span>Prioridade</span>
          <span>Follow-up</span>
          <span>Habitantes</span>
          <span>Atualização</span>
          <span />
        </div>

        <div className="divide-y divide-white/[0.07]">
          {rows.map((row) => {
            const followUp = getFollowUp(row.proximoContato);
            return (
              <button
                key={row.oportunidade.id}
                type="button"
                onClick={() => onOpen(row.oportunidade.id)}
                className={`group grid w-full grid-cols-[1.25fr_.9fr_.9fr_1fr_1fr_.85fr_.85fr_48px] items-center gap-2 px-4 py-4 text-center transition hover:bg-white/[0.055] ${followUp.tone === "overdue" ? "bg-rose-500/[0.035]" : "bg-transparent"}`}
              >
                <span className="flex min-w-0 flex-col items-center">
                  <strong className="max-w-full truncate text-sm font-black text-white">
                    {row.municipio?.nome || "Município não informado"}
                  </strong>
                  <small className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                    <MapPin size={11} /> {row.municipio?.estado || "MG"} · {formatDistance(row.municipio?.distancia_bh)}
                  </small>
                </span>
                <span className="flex justify-center"><StatusBadge value={row.oportunidade.status} /></span>
                <span className="flex justify-center"><ModelBadge value={row.modeloContratacao} /></span>
                <span className="flex justify-center"><PriorityBadge value={row.prioridade} /></span>
                <span className="flex justify-center"><FollowUpBadge {...followUp} /></span>
                <span className="text-sm font-bold text-slate-200">{formatNumber(row.municipio?.habitantes)}</span>
                <span className="text-xs font-semibold text-slate-400">{formatDateTime(row.ultimaAtualizacao)}</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.055] text-slate-400 transition group-hover:border-cyan-400/30 group-hover:bg-cyan-400/10 group-hover:text-cyan-200">
                  <Eye size={16} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 xl:hidden">
        {rows.map((row) => {
          const followUp = getFollowUp(row.proximoContato);
          return (
            <button
              key={row.oportunidade.id}
              type="button"
              onClick={() => onOpen(row.oportunidade.id)}
              className={`group relative overflow-hidden rounded-[18px] border p-4 text-left transition hover:border-white/15 ${
                followUp.tone === "overdue"
                  ? "border-rose-400/20 bg-rose-500/[0.07]"
                  : followUp.tone === "today"
                    ? "border-amber-400/20 bg-amber-400/[0.06]"
                    : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-black text-white">
                    {row.municipio?.nome || "Município não informado"}
                  </h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <MapPin size={13} className="text-cyan-300" />
                    {row.municipio?.estado || "MG"} · {formatDistance(row.municipio?.distancia_bh)}
                  </p>
                </div>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 group-hover:text-cyan-200">
                  <Eye size={17} />
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge value={row.oportunidade.status} />
                <ModelBadge value={row.modeloContratacao} />
                <PriorityBadge value={row.prioridade} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <MobileMetric icon={<CalendarClock size={14} />} label="Follow-up" value={<FollowUpBadge {...followUp} />} />
                <MobileMetric icon={<Users size={14} />} label="Habitantes" value={formatNumber(row.municipio?.habitantes)} />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

function MobileMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <span className="rounded-2xl border border-white/[0.08] bg-slate-950/25 p-3">
      <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">{icon}{label}</span>
      <span className="mt-2 block text-sm font-black text-white">{value}</span>
    </span>
  );
}

function StatusBadge({ value }: { value: string }) {
  const closed = value === "fechado";
  const lost = value === "perdido";
  return <Badge className={closed ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : lost ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : "border-blue-400/20 bg-blue-500/10 text-blue-200"}>{statusLabels[value] || value || "Sem status"}</Badge>;
}

function ModelBadge({ value }: { value: string }) {
  return <Badge className="border-cyan-400/20 bg-cyan-400/10 text-cyan-200">{value || "Sem modelo"}</Badge>;
}

function PriorityBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const className = normalized.includes("máxima") || normalized.includes("maxima")
    ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
    : normalized.includes("urg")
      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
      : "border-violet-400/20 bg-violet-500/10 text-violet-200";
  return <Badge className={className}>{value && value !== "-" ? value : "Sem prioridade"}</Badge>;
}

function FollowUpBadge({ label, tone }: { label: string; tone: "overdue" | "today" | "upcoming" | "none" }) {
  const className = tone === "overdue"
    ? "border-rose-400/25 bg-rose-500/15 text-rose-200"
    : tone === "today"
      ? "border-amber-400/25 bg-amber-400/15 text-amber-100"
      : tone === "upcoming"
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
        : "border-white/10 bg-white/[0.04] text-slate-500";
  return <Badge className={className}>{label}</Badge>;
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return <span className={`inline-flex max-w-full items-center justify-center rounded-full border px-2.5 py-1 text-center text-[10px] font-black leading-4 ${className}`}>{children}</span>;
}

function getFollowUp(value: string) {
  if (!value) return { label: "Não definido", tone: "none" as const };
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return { label: "Não definido", tone: "none" as const };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Vencido há ${Math.abs(days)}d`, tone: "overdue" as const };
  if (days === 0) return { label: "Hoje", tone: "today" as const };
  if (days === 1) return { label: "Amanhã", tone: "upcoming" as const };
  return { label: `Em ${days} dias`, tone: "upcoming" as const };
}

function formatNumber(value?: number | null) {
  return typeof value === "number" ? value.toLocaleString("pt-BR") : "—";
}

function formatDistance(value?: number | null) {
  return typeof value === "number" ? `${value.toLocaleString("pt-BR")} km` : "distância não informada";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}


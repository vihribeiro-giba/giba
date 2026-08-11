import { CalendarDays, Trash2 } from "lucide-react";

export type CrmEventItem = {
  id: string;
  nome_evento: string;
  data_evento: string | null;
  modelo_contratacao: string | null;
  prioridade: string | null;
  observacoes: string | null;
};

type CrmEventTableProps = {
  events: CrmEventItem[];
  onDelete: (event: CrmEventItem) => void;
  formatDate: (value?: string | null) => string;
  normalizeModel: (value?: string | null) => string;
  formatBestContactMonth: (value: string) => string;
  calculateContactDate: (date: string, months: number) => string;
  getReminderMonths: (notes?: string | null) => number;
};

export default function CrmEventTable({
  events,
  onDelete,
  formatDate,
  normalizeModel,
  formatBestContactMonth,
  calculateContactDate,
  getReminderMonths,
}: CrmEventTableProps) {
  if (!events.length) {
    return (
      <div className="grid min-h-40 place-items-center rounded-[22px] border border-dashed border-white/10 bg-slate-950/25 px-4 text-center">
        <div>
          <CalendarDays size={26} className="mx-auto text-slate-500" />
          <p className="mt-3 text-sm font-bold text-slate-400">Nenhum evento cadastrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/25">
      <div className="hidden grid-cols-[1.2fr_.7fr_.9fr_1fr_.8fr_48px] items-center gap-2 border-b border-white/10 bg-white/[0.05] px-4 py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 lg:grid">
        <span>Evento</span><span>Data</span><span>Modelo</span><span>Melhor contato</span><span>Prioridade</span><span />
      </div>
      <div className="divide-y divide-white/[0.07]">
        {events.map((event) => {
          const bestContact = formatBestContactMonth(
            calculateContactDate(event.data_evento || "", getReminderMonths(event.observacoes)),
          );
          return (
            <div key={event.id} className="grid gap-3 p-4 lg:grid-cols-[1.2fr_.7fr_.9fr_1fr_.8fr_48px] lg:items-center lg:gap-2 lg:text-center">
              <strong className="text-sm font-black text-white">{event.nome_evento}</strong>
              <EventDetail label="Data" value={formatDate(event.data_evento)} />
              <EventDetail label="Modelo" value={normalizeModel(event.modelo_contratacao)} />
              <EventDetail label="Melhor contato" value={bestContact} accent />
              <span className="flex lg:justify-center"><PriorityBadge value={event.prioridade || "Sem prioridade"} /></span>
              <button
                type="button"
                onClick={() => onDelete(event)}
                className="grid h-10 w-10 place-items-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20"
                aria-label={`Excluir evento ${event.nome_evento}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventDetail({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex items-center justify-between gap-3 text-xs lg:block">
      <small className="font-black uppercase tracking-[0.08em] text-slate-600 lg:hidden">{label}</small>
      <span className={`font-bold ${accent ? "text-cyan-200" : "text-slate-300"}`}>{value}</span>
    </span>
  );
}

function PriorityBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const className = normalized.includes("máxima") || normalized.includes("maxima")
    ? "border-rose-400/20 bg-rose-500/10 text-rose-200"
    : normalized.includes("urg")
      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
      : "border-violet-400/20 bg-violet-500/10 text-violet-200";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-center text-[10px] font-black ${className}`}>{value}</span>;
}


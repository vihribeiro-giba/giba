import type { FormEvent } from "react";
import { History, MessageSquarePlus, Trash2 } from "lucide-react";

export type CrmHistoryItem = {
  id: string;
  tipo: string;
  descricao: string | null;
  data_interacao: string;
};

type CrmHistoryProps = {
  items: CrmHistoryItem[];
  note: string;
  eventNotes: string;
  saving: boolean;
  onNoteChange: (value: string) => void;
  onEventNotesChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: (item: CrmHistoryItem) => void;
  formatDateTime: (value?: string | null) => string;
};

export default function CrmHistory({
  items,
  note,
  eventNotes,
  saving,
  onNoteChange,
  onEventNotesChange,
  onSubmit,
  onDelete,
  formatDateTime,
}: CrmHistoryProps) {
  return (
    <div className="grid gap-5">
      <form onSubmit={onSubmit} className="rounded-[22px] border border-violet-400/15 bg-violet-500/[0.06] p-4">
        <label className="text-[11px] font-black uppercase tracking-[0.12em] text-violet-200">Nova observação</label>
        <textarea
          id="crm-nova-observacao"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/45 p-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40"
          placeholder="Registre uma ligação, retorno, decisão ou próximo passo..."
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-500 px-4 text-sm font-black text-white transition hover:brightness-110 disabled:opacity-60"
          >
            <MessageSquarePlus size={17} />
            {saving ? "Adicionando..." : "Adicionar observação"}
          </button>
        </div>
      </form>

      <label>
        <span className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">Observações do evento</span>
        <textarea
          value={eventNotes}
          onChange={(event) => onEventNotesChange(event.target.value)}
          className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/35 p-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/40"
        />
      </label>

      {!items.length ? (
        <div className="grid min-h-40 place-items-center rounded-[22px] border border-dashed border-white/10 bg-slate-950/25 text-center">
          <div><History size={25} className="mx-auto text-slate-500" /><p className="mt-3 text-sm font-bold text-slate-400">Nenhuma interação registrada.</p></div>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="flex items-start gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.045] p-4">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200"><History size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm font-black text-white">{item.tipo}</strong>
                  <time className="text-[11px] font-bold text-slate-500">{formatDateTime(item.data_interacao)}</time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.descricao || "—"}</p>
              </div>
              <button type="button" onClick={() => onDelete(item)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-rose-400/15 bg-rose-500/10 text-rose-200 transition hover:bg-rose-500/20" aria-label="Excluir observação">
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}


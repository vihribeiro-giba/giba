"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, Search } from "lucide-react";

export type ContractEventOption = {
  id: string;
  date: string;
  client: string;
  event: string;
  format: string;
  city: string;
};

type Props = {
  value: string;
  events: ContractEventOption[];
  onChange: (id: string) => void;
  disabled?: boolean;
};

const normalize = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

const dateValue = (date: string) => {
  const value = date ? new Date(`${date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

const formatDate = (date: string) => {
  if (!date) return "Data não informada";
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
};

export default function ContractEventSelect({ value, events, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nearestRef = useRef<HTMLButtonElement>(null);
  const today = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current.getTime();
  }, []);

  const ordered = useMemo(
    () => [...events].sort((a, b) => dateValue(a.date) - dateValue(b.date)),
    [events],
  );

  const nearestId = useMemo(() => {
    return ordered.reduce<{ id: string; distance: number } | null>((nearest, event) => {
      const distance = Math.abs(dateValue(event.date) - today);
      return !nearest || distance < nearest.distance ? { id: event.id, distance } : nearest;
    }, null)?.id;
  }, [ordered, today]);

  const filtered = useMemo(() => {
    const query = normalize(term.trim());
    if (!query) return ordered;
    return ordered.filter((event) =>
      normalize([event.client, event.event, event.format, event.city, event.date, formatDate(event.date)].join(" ")).includes(query),
    );
  }, [ordered, term]);

  const selected = events.find((event) => event.id === value);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!open || term) return;
    const timer = window.setTimeout(() => {
      nearestRef.current?.scrollIntoView({ block: "center" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open, term]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setTerm("");
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setTerm("");
          setOpen((current) => !current);
        }}
        className="flex min-h-[50px] w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#071122] px-4 text-left text-sm font-bold text-white outline-none transition hover:border-cyan-400/35 focus-visible:border-cyan-400/60 focus-visible:ring-4 focus-visible:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <CalendarDays size={17} className="shrink-0 text-cyan-300" />
          <span className={selected ? "min-w-0" : "truncate text-slate-400"}>
            {selected ? (
              <span className="grid min-w-0">
                <span className="truncate">{formatDate(selected.date)} · {selected.client || "Cliente não informado"}</span>
                <span className="truncate text-xs font-medium text-slate-400">{selected.format || selected.event || "Evento sem formato"}{selected.city ? ` · ${selected.city}` : ""}</span>
              </span>
            ) : "Selecione um evento"}
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[120] w-[min(560px,calc(100vw-48px))] overflow-hidden rounded-2xl border border-white/15 bg-[#0b1424] p-2 shadow-[0_28px_70px_rgba(0,0,0,.58)]">
          <label className="mb-2 flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.055] px-3 focus-within:border-cyan-400/50">
            <Search size={16} className="shrink-0 text-slate-500" />
            <input autoFocus value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Buscar evento..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>

          <div ref={listRef} role="listbox" className="max-h-80 overflow-y-auto overscroll-contain pr-1">
            {!filtered.length && <p className="m-0 px-3 py-4 text-sm text-slate-400">Nenhum evento encontrado.</p>}
            {filtered.map((event, index) => {
              const previous = filtered[index - 1];
              const isFuture = dateValue(event.date) >= today;
              const previousFuture = previous ? dateValue(previous.date) >= today : false;
              const showPastHeading = index === 0 && !isFuture;
              const showCurrentHeading = isFuture && (index === 0 || !previousFuture);
              const active = event.id === value;
              return (
                <div key={event.id}>
                  {(showPastHeading || showCurrentHeading) && (
                    <div className="sticky top-0 z-10 bg-[#0b1424]/95 px-3 py-2 text-[10px] font-black uppercase tracking-[.15em] text-cyan-300 backdrop-blur">
                      {showPastHeading ? "Eventos anteriores" : "Hoje / próximos eventos"}
                    </div>
                  )}
                  <button
                    ref={event.id === nearestId ? nearestRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(event.id)}
                    className={`mb-1 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-gradient-to-r from-violet-500/30 to-sky-400/20" : event.id === nearestId ? "bg-cyan-400/[.07] hover:bg-cyan-400/[.12]" : "hover:bg-white/[.065]"}`}
                  >
                    <span className="grid min-w-0 gap-0.5">
                      <strong className="truncate text-sm text-white">{formatDate(event.date)} · {event.client || "Cliente não informado"}</strong>
                      <span className="truncate text-xs text-slate-400">{event.format || event.event || "Evento sem formato"}{event.city ? ` · ${event.city}` : ""}</span>
                    </span>
                    {active && <Check size={16} className="shrink-0 text-cyan-300" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

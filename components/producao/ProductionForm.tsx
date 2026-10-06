"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Link2, Sparkles } from "lucide-react";
import { PRODUCTION_STATUSES } from "../../lib/production/constants";
import { productionErrorMessage, reportProductionError } from "../../lib/production/errors";
import type { ProductionInput } from "../../lib/production/repository";
import type { Production, ProductionAgendaEvent, ProductionCollaborator } from "../../lib/production/types";
import { FieldLabel, productionInputClass, productionPanelClass, productionPrimaryButtonClass, productionSecondaryButtonClass, productionTextareaClass } from "./ProductionUi";

const emptyInput: ProductionInput = {
  event_id: null, contract_id: null, name: "", client_name: "", event_type: "Show", event_date: null,
  start_time: null, end_time: null, venue: "", address: "", city: "", estimated_audience: null,
  format_name: "", manager_collaborator_id: null, status: "planejamento", internal_notes: "",
};

function fromProduction(value?: Production | null): ProductionInput {
  if (!value) return emptyInput;
  return {
    event_id: value.event_id, contract_id: value.contract_id, name: value.name, client_name: value.client_name,
    event_type: value.event_type, event_date: value.event_date, start_time: value.start_time, end_time: value.end_time,
    venue: value.venue, address: value.address, city: value.city, estimated_audience: value.estimated_audience,
    format_name: value.format_name, manager_collaborator_id: value.manager_collaborator_id, status: value.status,
    internal_notes: value.internal_notes,
  };
}

export default function ProductionForm({ events, collaborators, initial, onSubmit, saving, submitLabel = "Salvar produção" }: {
  events: ProductionAgendaEvent[]; collaborators: ProductionCollaborator[]; initial?: Production | null;
  onSubmit: (value: ProductionInput) => Promise<void>; saving: boolean; submitLabel?: string;
}) {
  const [mode, setMode] = useState<"agenda" | "independent">(initial?.event_id ? "agenda" : "independent");
  const [value, setValue] = useState<ProductionInput>(() => fromProduction(initial));
  const [error, setError] = useState("");
  const upcomingEvents = useMemo(() => [...events].sort((a, b) => a.event_date.localeCompare(b.event_date)), [events]);

  function patch<K extends keyof ProductionInput>(key: K, next: ProductionInput[K]) { setValue((current) => ({ ...current, [key]: next })); }
  function chooseEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (!event) { setValue((current) => ({ ...current, event_id: null })); return; }
    setValue((current) => ({
      ...current, event_id: event.id, name: event.title || `${event.event_type} - ${event.client_name}`,
      client_name: event.client_name || "", event_type: event.event_type || "Show", event_date: event.event_date || null,
      start_time: event.event_time || null, venue: event.location || "", format_name: event.show_format || "",
      internal_notes: event.notes || current.internal_notes,
    }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!value.name.trim()) return setError("Informe o nome do evento.");
    if (!value.event_date) return setError("Informe a data da produção.");
    try { await onSubmit({ ...value, name: value.name.trim(), client_name: value.client_name.trim(), city: value.city.trim() }); }
    catch (submitError) { reportProductionError("Falha ao salvar", submitError); setError(productionErrorMessage(submitError, "Não foi possível salvar a produção.")); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {!initial && <section className={`${productionPanelClass} p-5 sm:p-6`}><div className="mb-4"><h2 className="text-lg font-black text-white">Origem da produção</h2><p className="text-sm text-slate-500">Use um evento da Agenda ou comece uma operação independente.</p></div><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setMode("agenda")} className={`${mode === "agenda" ? productionPrimaryButtonClass : productionSecondaryButtonClass} justify-start`}><CalendarDays size={18} /> Importar da Agenda</button><button type="button" onClick={() => { setMode("independent"); patch("event_id", null); }} className={`${mode === "independent" ? productionPrimaryButtonClass : productionSecondaryButtonClass} justify-start`}><Sparkles size={18} /> Produção independente</button></div></section>}

      <section className={`${productionPanelClass} p-5 sm:p-6`}>
        <div className="mb-5 flex items-center gap-3"><Link2 className="text-cyan-300" size={20} /><div><h2 className="text-lg font-black text-white">Dados essenciais</h2><p className="text-sm text-slate-500">Informações operacionais utilizadas pela equipe.</p></div></div>
        {mode === "agenda" && <div className="mb-5"><FieldLabel>Evento da Agenda</FieldLabel><select className={productionInputClass} value={value.event_id || ""} onChange={(event) => chooseEvent(event.target.value)} required><option value="">Selecione um evento</option>{upcomingEvents.map((item) => <option key={item.id} value={item.id}>{new Date(`${item.event_date}T12:00:00`).toLocaleDateString("pt-BR")} · {item.client_name || item.title}</option>)}</select></div>}
        <div className="grid gap-4 md:grid-cols-2">
          <div><FieldLabel>Nome do evento *</FieldLabel><input className={productionInputClass} value={value.name} onChange={(event) => patch("name", event.target.value)} required /></div>
          <div><FieldLabel>Cliente ou contratante</FieldLabel><input className={productionInputClass} value={value.client_name} onChange={(event) => patch("client_name", event.target.value)} /></div>
          <div><FieldLabel>Tipo de evento</FieldLabel><input className={productionInputClass} value={value.event_type} onChange={(event) => patch("event_type", event.target.value)} /></div>
          <div><FieldLabel>Formato</FieldLabel><input className={productionInputClass} value={value.format_name} onChange={(event) => patch("format_name", event.target.value)} /></div>
          <div><FieldLabel>Data *</FieldLabel><input type="date" className={productionInputClass} value={value.event_date || ""} onChange={(event) => patch("event_date", event.target.value || null)} required /></div>
          <div className="grid grid-cols-2 gap-3"><div><FieldLabel>Início</FieldLabel><input type="time" className={productionInputClass} value={value.start_time || ""} onChange={(event) => patch("start_time", event.target.value || null)} /></div><div><FieldLabel>Término</FieldLabel><input type="time" className={productionInputClass} value={value.end_time || ""} onChange={(event) => patch("end_time", event.target.value || null)} /></div></div>
          <div><FieldLabel>Local</FieldLabel><input className={productionInputClass} value={value.venue} onChange={(event) => patch("venue", event.target.value)} /></div>
          <div><FieldLabel>Cidade</FieldLabel><input className={productionInputClass} value={value.city} onChange={(event) => patch("city", event.target.value)} /></div>
          <div className="md:col-span-2"><FieldLabel>Endereço</FieldLabel><input className={productionInputClass} value={value.address} onChange={(event) => patch("address", event.target.value)} /></div>
          <div><FieldLabel>Público estimado</FieldLabel><input type="number" min="0" className={productionInputClass} value={value.estimated_audience ?? ""} onChange={(event) => patch("estimated_audience", event.target.value ? Number(event.target.value) : null)} /></div>
          <div><FieldLabel>Responsável pela produção</FieldLabel><select className={productionInputClass} value={value.manager_collaborator_id || ""} onChange={(event) => patch("manager_collaborator_id", event.target.value || null)}><option value="">Não definido</option>{collaborators.map((item) => <option key={item.id} value={item.id}>{item.nome} · {item.funcao}</option>)}</select></div>
          <div><FieldLabel>Status</FieldLabel><select className={productionInputClass} value={value.status} onChange={(event) => patch("status", event.target.value as ProductionInput["status"])}>{PRODUCTION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div>
          <div className="md:col-span-2"><FieldLabel>Observações internas</FieldLabel><textarea className={productionTextareaClass} value={value.internal_notes} onChange={(event) => patch("internal_notes", event.target.value)} /></div>
        </div>
      </section>
      {error && <p role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={saving} className={productionPrimaryButtonClass}>{saving ? "Salvando..." : submitLabel}</button></div>
    </form>
  );
}

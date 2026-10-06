"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ClipboardList, Search } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import ProtectedRoute from "../../components/ProtectedRoute";
import ProductionList from "../../components/producao/ProductionList";
import { ProductionHeader, ProductionMetric, productionInputClass, productionPanelClass } from "../../components/producao/ProductionUi";
import { calculateProgress, PRODUCTION_STATUSES } from "../../lib/production/constants";
import { productionErrorMessage, reportProductionError } from "../../lib/production/errors";
import { listProductionCollaborators, listProductions, listProductionTasks } from "../../lib/production/repository";
import type { Production, ProductionCollaborator, ProductionProgress, ProductionTask } from "../../lib/production/types";

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [collaborators, setCollaborators] = useState<ProductionCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [manager, setManager] = useState("");
  const [format, setFormat] = useState("");

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true); setError("");
    try {
      const [productionRows, collaboratorRows] = await Promise.all([listProductions(), listProductionCollaborators()]);
      const taskRows = await listProductionTasks(productionRows.map((item) => item.id));
      setProductions(productionRows); setCollaborators(collaboratorRows); setTasks(taskRows);
    } catch (loadError) {
      reportProductionError("Falha ao carregar o painel", loadError);
      setError(productionErrorMessage(loadError, "Não foi possível carregar o módulo Produção."));
    }
    finally { setLoading(false); }
  }

  const progress = useMemo(() => productions.reduce<Record<string, ProductionProgress>>((result, production) => {
    result[production.id] = calculateProgress(tasks.filter((task) => task.production_id === production.id)); return result;
  }, {}), [productions, tasks]);
  const normalized = (value: string) => value.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filtered = useMemo(() => productions.filter((item) => {
    const managerName = collaborators.find((collaborator) => collaborator.id === item.manager_collaborator_id)?.nome || "";
    const haystack = normalized(`${item.name} ${item.client_name} ${item.city} ${item.venue} ${managerName} ${item.format_name}`);
    return (!search.trim() || haystack.includes(normalized(search.trim()))) && (!status || item.status === status) && (!manager || item.manager_collaborator_id === manager) && (!format || item.format_name === format);
  }), [collaborators, format, manager, productions, search, status]);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nextLimit = new Date(today); nextLimit.setDate(nextLimit.getDate() + 30);
  const metrics = {
    organizing: productions.filter((item) => !["finalizado", "cancelado"].includes(item.status)).length,
    upcoming: productions.filter((item) => item.event_date && new Date(`${item.event_date}T00:00:00`) >= today && new Date(`${item.event_date}T00:00:00`) <= nextLimit).length,
    overdue: Object.values(progress).reduce((sum, item) => sum + item.overdue, 0),
    ready: productions.filter((item) => item.status === "pronto").length,
  };
  const formats = [...new Set(productions.map((item) => item.format_name).filter(Boolean))].sort();

  return <ProtectedRoute><PlanProtectedRoute modulo="producao"><AppLayout><div className="mx-auto w-full max-w-[1500px] space-y-7 pb-10">
    <ProductionHeader title="Produção" subtitle="Organize sua equipe e acompanhe cada etapa dos eventos." actionHref="/producao/nova" />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ProductionMetric label="Em organização" value={metrics.organizing} helper="operações ativas" icon={ClipboardList} /><ProductionMetric label="Próximos eventos" value={metrics.upcoming} helper="nos próximos 30 dias" icon={CalendarClock} tone="cyan" /><ProductionMetric label="Tarefas atrasadas" value={metrics.overdue} helper="precisam de atenção" icon={AlertTriangle} tone="amber" /><ProductionMetric label="Produções prontas" value={metrics.ready} helper="liberadas para realização" icon={CheckCircle2} tone="green" /></section>
    <section className={`${productionPanelClass} p-4 sm:p-5`}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(170px,.7fr))]"><div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} /><input className={`${productionInputClass} pl-11`} placeholder="Buscar evento, cliente, cidade ou responsável..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><select className={productionInputClass} value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{PRODUCTION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select className={productionInputClass} value={manager} onChange={(event) => setManager(event.target.value)}><option value="">Todos os responsáveis</option>{collaborators.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><select className={productionInputClass} value={format} onChange={(event) => setFormat(event.target.value)}><option value="">Todos os formatos</option>{formats.map((item) => <option key={item}>{item}</option>)}</select></div></section>
    {loading ? <div className="grid gap-4 sm:grid-cols-2">{[0,1,2,3].map((item) => <div key={item} className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />)}</div> : error ? <div role="alert" className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6 text-rose-100">{error}</div> : <ProductionList productions={filtered} collaborators={collaborators} progress={progress} />}
  </div></AppLayout></PlanProtectedRoute></ProtectedRoute>;
}

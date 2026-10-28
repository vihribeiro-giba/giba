"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "../../../components/AppLayout";
import PlanProtectedRoute from "../../../components/PlanProtectedRoute";
import ProtectedRoute from "../../../components/ProtectedRoute";
import ProductionForm from "../../../components/producao/ProductionForm";
import { ProductionHeader } from "../../../components/producao/ProductionUi";
import { createProduction, listAgendaEvents, listProductionCollaborators, type ProductionInput } from "../../../lib/production/repository";
import { productionErrorMessage, reportProductionError } from "../../../lib/production/errors";
import type { ProductionAgendaEvent, ProductionCollaborator } from "../../../lib/production/types";

export default function NewProductionPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ProductionAgendaEvent[]>([]);
  const [collaborators, setCollaborators] = useState<ProductionCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([listAgendaEvents(), listProductionCollaborators()]).then(([eventRows, collaboratorRows]) => { setEvents(eventRows); setCollaborators(collaboratorRows); }).catch((loadError) => { reportProductionError("Falha ao preparar o formulário", loadError); setError(productionErrorMessage(loadError, "Não foi possível preparar o formulário.")); }).finally(() => setLoading(false)); }, []);
  async function save(value: ProductionInput) { setSaving(true); try { const production = await createProduction(value); router.push(`/producao/${production.id}`); } finally { setSaving(false); } }
  return <ProtectedRoute><PlanProtectedRoute modulo="producao"><AppLayout><div className="mx-auto w-full max-w-5xl space-y-7 pb-10"><ProductionHeader backHref="/producao" title="Nova Produção" subtitle="Importe um evento da Agenda ou organize uma operação independente." />{error ? <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-5 text-rose-100">{error}</div> : loading ? <div className="h-96 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" /> : <ProductionForm events={events} collaborators={collaborators} onSubmit={save} saving={saving} />}</div></AppLayout></PlanProtectedRoute></ProtectedRoute>;
}

import { resolveAccessContext } from "../access-session";
import { supabase } from "../supabase";
import type {
  Production,
  ProductionActivity,
  ProductionAgendaEvent,
  ProductionCollaborator,
  ProductionDocument,
  ProductionMember,
  ProductionPermissions,
  ProductionScheduleItem,
  ProductionTask,
} from "./types";

export type ProductionInput = Pick<Production,
  "event_id" | "contract_id" | "name" | "client_name" | "event_type" | "event_date" |
  "start_time" | "end_time" | "venue" | "address" | "city" | "estimated_audience" |
  "format_name" | "manager_collaborator_id" | "status" | "internal_notes"
>;

async function requireContext() {
  const context = await resolveAccessContext();
  if (!context?.authUser) throw new Error("Entre novamente com um acesso autenticado para usar o módulo Produção.");
  return { ...context, authUser: context.authUser };
}

function actorName(context: Awaited<ReturnType<typeof requireContext>>) {
  return context.collaborator?.nome || context.authUser.user_metadata?.name || context.authUser.email || "Usuário GIBA";
}

export async function getProductionAccount() {
  const context = await requireContext();
  return { accountUserId: context.accountUserId, actorName: actorName(context), actor: context.actor };
}

export async function listProductions() {
  const context = await requireContext();
  const { data, error } = await supabase.from("productions").select("*").eq("user_id", context.accountUserId).order("event_date", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data || []) as Production[];
}

export async function getProduction(id: string) {
  await requireContext();
  const { data, error } = await supabase.from("productions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Production | null;
}

export async function listProductionTasks(productionIds?: string[]) {
  await requireContext();
  let query = supabase.from("production_tasks").select("*").order("due_at", { ascending: true, nullsFirst: false });
  if (productionIds) {
    if (!productionIds.length) return [];
    query = query.in("production_id", productionIds);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ProductionTask[];
}

export async function listAgendaEvents() {
  const context = await requireContext();
  const { data, error } = await supabase.from("events").select("id,title,event_type,show_format,client_name,location,event_date,event_time,show_duration,fee,status,notes").eq("user_id", context.accountUserId).order("event_date", { ascending: true });
  if (error) throw error;
  return (data || []) as ProductionAgendaEvent[];
}

export async function listProductionCollaborators() {
  const context = await requireContext();
  const { data, error } = await supabase.from("collaborators").select("id,nome,funcao,celular,email,auth_user_id").eq("user_id", context.accountUserId).eq("status", "Ativo").order("nome");
  if (error) throw error;
  return (data || []) as ProductionCollaborator[];
}

export async function createProduction(input: ProductionInput) {
  const context = await requireContext();
  const { data, error } = await supabase
    .rpc("giba_create_production", { production_payload: input })
    .single();
  if (error) {
    console.groupCollapsed("[Produção] Criação recusada pelo Supabase");
    console.warn("Mensagem:", error.message);
    console.warn("Detalhes:", error.details);
    console.warn("Hint:", error.hint);
    console.warn("Código:", error.code);
    console.groupEnd();
    throw error;
  }
  const production = data as Production;
  if (context.actor === "collaborator" && context.collaborator) {
    const memberPayload = {
      production_id: production.id, user_id: production.user_id, collaborator_id: context.collaborator.id,
      event_role: context.collaborator.funcao || "Responsável pela produção", phone: "", notes: "Criador da produção",
      can_view: true, can_edit: true, can_manage_tasks: true, can_manage_schedule: true,
      can_manage_team: true, can_manage_documents: true, can_view_financial: false, can_finalize: true,
    };
    const { error: memberError } = await supabase.from("production_members").insert(memberPayload);
    if (memberError) console.warn("A produção foi criada, mas o vínculo do responsável falhou:", memberError.message);
  }
  try {
    await addProductionActivity(production.id, "production_created", "Produção criada.");
  } catch (activityError) {
    console.warn("A produção foi criada, mas o histórico inicial não pôde ser registrado:", activityError);
  }
  return production;
}

export async function updateProduction(id: string, values: Partial<ProductionInput>) {
  await requireContext();
  const { data, error } = await supabase.from("productions").update(values).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Production;
}

export async function deleteProduction(id: string) {
  await requireContext();
  const { error } = await supabase.from("productions").delete().eq("id", id);
  if (error) throw error;
}

export async function getProductionPermissions(id: string): Promise<ProductionPermissions> {
  const context = await requireContext();
  if (context.actor === "owner") return { view: true, edit: true, tasks: true, schedule: true, team: true, documents: true, financial: true, finalize: true };
  const keys: Array<keyof ProductionPermissions> = ["view", "edit", "tasks", "schedule", "team", "documents", "financial", "finalize"];
  const results = await Promise.all(keys.map(async (key) => {
    const { data, error } = await supabase.rpc("giba_production_permission", { production_uuid: id, permission_name: key });
    return [key, !error && Boolean(data)] as const;
  }));
  return Object.fromEntries(results) as ProductionPermissions;
}

export async function listProductionSchedule(id: string) {
  await requireContext();
  const { data, error } = await supabase.from("production_schedule_items").select("*").eq("production_id", id).order("scheduled_date").order("start_time");
  if (error) throw error;
  return (data || []) as ProductionScheduleItem[];
}

export async function listProductionMembers(id: string) {
  await requireContext();
  const { data, error } = await supabase.from("production_members").select("*").eq("production_id", id).order("created_at");
  if (error) throw error;
  return (data || []) as ProductionMember[];
}

export async function listProductionDocuments(id: string) {
  await requireContext();
  const { data, error } = await supabase.from("production_documents").select("*").eq("production_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ProductionDocument[];
}

export async function listProductionActivity(id: string) {
  await requireContext();
  const { data, error } = await supabase.from("production_activity_logs").select("*").eq("production_id", id).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as ProductionActivity[];
}

export async function addProductionActivity(productionId: string, action: string, description: string) {
  const context = await requireContext();
  const { error } = await supabase.from("production_activity_logs").insert({
    production_id: productionId, user_id: context.accountUserId, actor_id: context.authUser.id,
    actor_name: actorName(context), action, description,
  });
  if (error) console.warn("Erro ao registrar histórico da produção:", error.message);
}

export async function createProductionTask(productionId: string, values: Omit<ProductionTask, "id" | "production_id" | "user_id" | "created_at" | "updated_at">) {
  const context = await requireContext();
  const { data, error } = await supabase.from("production_tasks").insert({ ...values, production_id: productionId, user_id: context.accountUserId, created_by: context.authUser.id }).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "task_created", `Tarefa criada: ${values.title}.`);
  return data as ProductionTask;
}

export async function updateProductionTask(id: string, productionId: string, values: Partial<ProductionTask>) {
  await requireContext();
  const safeValues = { ...values };
  delete safeValues.id; delete safeValues.production_id; delete safeValues.user_id; delete safeValues.created_at; delete safeValues.updated_at;
  const { data, error } = await supabase.from("production_tasks").update(safeValues).eq("id", id).select("*").single();
  if (error) throw error;
  if (values.status === "concluida") await addProductionActivity(productionId, "task_completed", `Tarefa concluída: ${(data as ProductionTask).title}.`);
  return data as ProductionTask;
}

export async function deleteProductionTask(id: string, productionId: string, title: string) {
  await requireContext();
  const { error } = await supabase.from("production_tasks").delete().eq("id", id);
  if (error) throw error;
  await addProductionActivity(productionId, "task_deleted", `Tarefa excluída: ${title}.`);
}

export async function createScheduleItem(productionId: string, values: Omit<ProductionScheduleItem, "id" | "production_id" | "user_id" | "created_at" | "updated_at">) {
  const context = await requireContext();
  const { data, error } = await supabase.from("production_schedule_items").insert({ ...values, production_id: productionId, user_id: context.accountUserId, created_by: context.authUser.id }).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "schedule_changed", `Etapa adicionada ao cronograma: ${values.title}.`);
  return data as ProductionScheduleItem;
}

export async function deleteScheduleItem(id: string, productionId: string, title: string) {
  await requireContext();
  const { error } = await supabase.from("production_schedule_items").delete().eq("id", id);
  if (error) throw error;
  await addProductionActivity(productionId, "schedule_changed", `Etapa removida do cronograma: ${title}.`);
}

export async function updateScheduleItem(id: string, productionId: string, values: Partial<ProductionScheduleItem>) {
  await requireContext();
  const safeValues = { ...values };
  delete safeValues.id; delete safeValues.production_id; delete safeValues.user_id; delete safeValues.created_at; delete safeValues.updated_at;
  const { data, error } = await supabase.from("production_schedule_items").update(safeValues).eq("id", id).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "schedule_changed", `Cronograma atualizado: ${(data as ProductionScheduleItem).title}.`);
  return data as ProductionScheduleItem;
}

export async function addProductionMember(productionId: string, values: Omit<ProductionMember, "id" | "production_id" | "user_id" | "created_at" | "updated_at">) {
  const context = await requireContext();
  const { data, error } = await supabase.from("production_members").insert({ ...values, production_id: productionId, user_id: context.accountUserId }).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "member_added", "Integrante adicionado à produção.");
  return data as ProductionMember;
}

export async function removeProductionMember(id: string, productionId: string, name: string) {
  await requireContext();
  const { error } = await supabase.from("production_members").delete().eq("id", id);
  if (error) throw error;
  await addProductionActivity(productionId, "member_removed", `Integrante removido: ${name}.`);
}

export async function updateProductionMember(id: string, productionId: string, values: Partial<ProductionMember>) {
  await requireContext();
  const safeValues = { ...values };
  delete safeValues.id; delete safeValues.production_id; delete safeValues.user_id; delete safeValues.created_at; delete safeValues.updated_at;
  const { data, error } = await supabase.from("production_members").update(safeValues).eq("id", id).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "member_updated", "Permissões ou informações de integrante atualizadas.");
  return data as ProductionMember;
}

export async function addProductionDocument(values: Omit<ProductionDocument, "id" | "user_id" | "uploaded_by" | "created_at" | "updated_at">) {
  const context = await requireContext();
  const { data, error } = await supabase.from("production_documents").insert({ ...values, user_id: context.accountUserId, uploaded_by: context.authUser.id }).select("*").single();
  if (error) throw error;
  await addProductionActivity(values.production_id, "document_uploaded", `Documento enviado: ${values.name}.`);
  return data as ProductionDocument;
}

export async function deleteProductionDocumentRecord(id: string, productionId: string, name: string) {
  await requireContext();
  const { error } = await supabase.from("production_documents").delete().eq("id", id);
  if (error) throw error;
  await addProductionActivity(productionId, "document_deleted", `Documento excluído: ${name}.`);
}

export async function updateProductionDocumentRecord(id: string, productionId: string, values: Pick<ProductionDocument, "name" | "category" | "notes">) {
  await requireContext();
  const { data, error } = await supabase.from("production_documents").update(values).eq("id", id).select("*").single();
  if (error) throw error;
  await addProductionActivity(productionId, "document_updated", `Documento atualizado: ${values.name}.`);
  return data as ProductionDocument;
}

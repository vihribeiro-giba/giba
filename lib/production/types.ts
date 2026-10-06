export type ProductionStatus =
  | "planejamento"
  | "em_producao"
  | "aguardando_confirmacao"
  | "pronto"
  | "em_execucao"
  | "finalizado"
  | "cancelado";

export type ProductionPriority = "baixa" | "normal" | "alta" | "urgente";
export type ProductionTaskStatus = "pendente" | "em_andamento" | "concluida";
export type ProductionScheduleStatus = "pendente" | "em_andamento" | "concluido" | "cancelado";

export type Production = {
  id: string;
  user_id: string;
  event_id: string | null;
  contract_id: string | null;
  name: string;
  client_name: string;
  event_type: string;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  city: string;
  estimated_audience: number | null;
  format_name: string;
  manager_collaborator_id: string | null;
  status: ProductionStatus;
  internal_notes: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ProductionTask = {
  id: string;
  production_id: string;
  user_id: string;
  title: string;
  category: string;
  assignee_collaborator_id: string | null;
  due_at: string | null;
  priority: ProductionPriority;
  status: ProductionTaskStatus;
  notes: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductionScheduleItem = {
  id: string;
  production_id: string;
  user_id: string;
  title: string;
  scheduled_date: string;
  start_time: string;
  end_time: string | null;
  location: string;
  responsible_collaborator_id: string | null;
  notes: string;
  status: ProductionScheduleStatus;
  created_at: string;
  updated_at: string;
};

export type ProductionMember = {
  id: string;
  production_id: string;
  user_id: string;
  collaborator_id: string;
  event_role: string;
  phone: string;
  notes: string;
  can_view: boolean;
  can_edit: boolean;
  can_manage_tasks: boolean;
  can_manage_schedule: boolean;
  can_manage_team: boolean;
  can_manage_documents: boolean;
  can_view_financial: boolean;
  can_finalize: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductionDocument = {
  id: string;
  production_id: string;
  user_id: string;
  name: string;
  category: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  notes: string;
  uploaded_by: string;
  uploader_name: string;
  created_at: string;
  updated_at: string;
};

export type ProductionActivity = {
  id: string;
  production_id: string;
  user_id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  description: string;
  created_at: string;
};

export type ProductionCollaborator = {
  id: string;
  nome: string;
  funcao: string;
  celular?: string | null;
  email?: string | null;
  auth_user_id?: string | null;
};

export type ProductionAgendaEvent = {
  id: string;
  title: string;
  event_type: string;
  show_format: string;
  client_name: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  fee: number | string;
  status: string;
  notes: string;
};

export type ProductionProgress = { total: number; completed: number; percentage: number; overdue: number };

export type ProductionPermissions = {
  view: boolean;
  edit: boolean;
  tasks: boolean;
  schedule: boolean;
  team: boolean;
  documents: boolean;
  financial: boolean;
  finalize: boolean;
};

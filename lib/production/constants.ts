import type { ProductionStatus } from "./types";

export const PRODUCTION_STATUSES: Array<{ value: ProductionStatus; label: string; color: string }> = [
  { value: "planejamento", label: "Planejamento", color: "#a78bfa" },
  { value: "em_producao", label: "Em produção", color: "#22d3ee" },
  { value: "aguardando_confirmacao", label: "Aguardando confirmação", color: "#fbbf24" },
  { value: "pronto", label: "Pronto para realização", color: "#34d399" },
  { value: "em_execucao", label: "Em execução", color: "#38bdf8" },
  { value: "finalizado", label: "Finalizado", color: "#10b981" },
  { value: "cancelado", label: "Cancelado", color: "#fb7185" },
];

export const TASK_CATEGORIES = [
  "Contrato e documentação", "Equipe artística", "Equipe técnica", "Transporte", "Hospedagem",
  "Alimentação", "Camarim", "Palco", "Som", "Iluminação e LED", "Segurança",
  "Comunicação e divulgação", "Pagamentos", "Prestação de contas", "Outros",
];

export const DOCUMENT_CATEGORIES = [
  "Contrato", "Rider técnico", "Mapa de palco", "Lista da equipe", "Rooming list",
  "Autorizações", "Notas fiscais", "Comprovantes", "Artes de divulgação", "Fotos do local",
  "Orçamentos", "Outros",
];

export const SCHEDULE_SUGGESTIONS = [
  "Saída da equipe", "Chegada à cidade", "Check-in", "Montagem", "Passagem de som",
  "Alimentação", "Abertura dos portões", "Início do show", "Término do show", "Desmontagem", "Retorno",
];

export function productionStatusLabel(status: ProductionStatus) {
  return PRODUCTION_STATUSES.find((item) => item.value === status)?.label || status;
}
export function productionStatusColor(status: ProductionStatus) {
  return PRODUCTION_STATUSES.find((item) => item.value === status)?.color || "#94a3b8";
}

export function formatProductionDate(value?: string | null, withTime = false) {
  if (!value) return "Data não definida";
  const date = new Date(withTime || value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR", withTime
    ? { dateStyle: "short", timeStyle: "short" }
    : { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function calculateProgress(statuses: Array<{ status: string; due_at?: string | null }>) {
  const completed = statuses.filter((item) => item.status === "concluida").length;
  const now = Date.now();
  const overdue = statuses.filter((item) => item.status !== "concluida" && item.due_at && new Date(item.due_at).getTime() < now).length;
  return { total: statuses.length, completed, overdue, percentage: statuses.length ? Math.round((completed / statuses.length) * 100) : 0 };
}

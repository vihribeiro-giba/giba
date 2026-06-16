export type EventStatus = "realizado" | "hoje" | "proximo";

export function getEventStatus(eventDate: string): EventStatus {
  const hoje = new Date();
  const evento = new Date(eventDate);

  hoje.setHours(0, 0, 0, 0);
  evento.setHours(0, 0, 0, 0);

  if (evento.getTime() < hoje.getTime()) {
    return "realizado";
  }

  if (evento.getTime() === hoje.getTime()) {
    return "hoje";
  }

  return "proximo";
}

export function getEventStatusLabel(status: EventStatus) {
  switch (status) {
    case "realizado":
      return "Realizado";
    case "hoje":
      return "Hoje";
    case "proximo":
      return "Próximo";
    default:
      return "";
  }
}

export function getEventStatusColor(status: EventStatus) {
  switch (status) {
    case "realizado":
      return "#22c55e";
    case "hoje":
      return "#f59e0b";
    case "proximo":
      return "#3b82f6";
    default:
      return "#ffffff";
  }
}

export type EventStage = "pendente" | "proximo" | "realizado";

type StageConfig = {
  label: string;
  color: string;
  text: string;
  soft: string;
};

export const EVENT_STAGES: Record<EventStage, StageConfig> = {
  pendente: {
    label: "Pendente",
    color: "#F59E0B",
    text: "#241A03",
    soft: "rgba(245,158,11,0.20)",
  },
  proximo: {
    label: "Próximo",
    color: "#3B82F6",
    text: "#FFFFFF",
    soft: "rgba(59,130,246,0.18)",
  },
  realizado: {
    label: "Realizado",
    color: "#22C55E",
    text: "#04210F",
    soft: "rgba(34,197,94,0.18)",
  },
};

export function getStageConfig(stage?: string): StageConfig {
  const key = (stage || "").toLowerCase() as EventStage;
  return EVENT_STAGES[key] || EVENT_STAGES.pendente;
}

export const EVENT_STAGE_ORDER: EventStage[] = [
  "pendente",
  "proximo",
  "realizado",
];

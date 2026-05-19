export type EventStatus =
  | "realizado"
  | "hoje"
  | "proximo";

export function getEventStatus(eventDate: string): EventStatus {
  const hoje = new Date();
  const evento = new Date(eventDate);

  // Remove horário para comparar apenas data
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
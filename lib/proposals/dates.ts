const TIME_ZONE = "America/Sao_Paulo";

function partsInSaoPaulo(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

function ymd(year: number, month: number, day: number) {
  return String(year).padStart(4, "0") + "-" + String(month).padStart(2, "0") + "-" + String(day).padStart(2, "0");
}

export function proposalCreationDates(now = new Date()) {
  const current = partsInSaoPaulo(now);
  const emission = new Date(Date.UTC(current.year, current.month - 1, current.day, 12));
  const expiration = new Date(emission);
  expiration.setUTCDate(expiration.getUTCDate() + 15);
  return {
    issueDate: ymd(emission.getUTCFullYear(), emission.getUTCMonth() + 1, emission.getUTCDate()),
    expirationDate: ymd(expiration.getUTCFullYear(), expiration.getUTCMonth() + 1, expiration.getUTCDate()),
  };
}

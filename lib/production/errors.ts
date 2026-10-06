type SupabaseErrorShape = {
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  code?: unknown;
};

function errorShape(error: unknown): SupabaseErrorShape {
  return typeof error === "object" && error !== null ? error as SupabaseErrorShape : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function productionErrorInfo(error: unknown) {
  const shape = errorShape(error);
  return {
    message: error instanceof Error ? error.message : text(shape.message),
    details: text(shape.details),
    hint: text(shape.hint),
    code: text(shape.code),
  };
}

export function productionErrorMessage(error: unknown, fallback: string) {
  const info = productionErrorInfo(error);
  const combined = `${info.message} ${info.details} ${info.hint}`.toLocaleLowerCase("pt-BR");

  if (["PGRST205", "42P01"].includes(info.code) || combined.includes("could not find the table") || combined.includes("relation") && combined.includes("does not exist")) {
    return "A estrutura do módulo Produção ainda não foi criada no Supabase. Execute a migration 20260816120000_create_production_module.sql e atualize a página.";
  }
  if (["42501", "PGRST301"].includes(info.code) || combined.includes("row-level security") || combined.includes("permission denied")) {
    const diagnostic = [info.code, info.message, info.details].filter(Boolean).join(" · ");
    return `O Supabase recusou a gravação no módulo Produção${diagnostic ? ` (${diagnostic})` : ""}.`;
  }
  if (info.code === "42703" || combined.includes("column") && combined.includes("does not exist")) {
    return `A estrutura do Supabase está desatualizada${info.message ? `: ${info.message}` : "."}`;
  }
  return info.message || fallback;
}

export function reportProductionError(context: string, error: unknown) {
  const info = productionErrorInfo(error);
  console.groupCollapsed(`[Produção] ${context}`);
  console.warn("Mensagem:", info.message || "Não informada");
  console.warn("Detalhes:", info.details || "Não informados");
  console.warn("Hint:", info.hint || "Não informado");
  console.warn("Código:", info.code || "Não informado");
  console.groupEnd();
}

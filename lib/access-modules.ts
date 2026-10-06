export const ACCESS_MODULE_KEYS = [
  "dashboard",
  "agenda",
  "agenda_colaborador",
  "producao",
  "clientes",
  "crm",
  "propostas",
  "contratos",
  "formatos",
  "calculadora_show",
  "financeiro",
  "relatorios",
  "colaboradores",
  "configuracoes",
  "assinatura",
] as const;

export type AccessModuleKey = (typeof ACCESS_MODULE_KEYS)[number];
export type AccessProfileKey = "musico_tecnico" | "producao" | "vendas" | "financeiro" | "administrador" | "personalizado";
export type AccessModuleGroupKey = "operacao" | "comercial" | "financeiro" | "administracao";

export type AccessModuleDefinition = {
  key: AccessModuleKey;
  label: string;
  description: string;
  href: string;
  group: AccessModuleGroupKey;
  planFeature: string | null;
  ownerOnly?: boolean;
};

export const ACCESS_MODULE_GROUPS: Array<{ key: AccessModuleGroupKey; label: string }> = [
  { key: "operacao", label: "Operação" },
  { key: "comercial", label: "Comercial" },
  { key: "financeiro", label: "Financeiro" },
  { key: "administracao", label: "Administração" },
];

export const ACCESS_MODULES: AccessModuleDefinition[] = [
  { key: "dashboard", label: "Dashboard", description: "Visão geral da operação.", href: "/dashboard", group: "operacao", planFeature: "dashboard" },
  { key: "agenda", label: "Agenda", description: "Agenda completa e gestão dos eventos.", href: "/agenda", group: "operacao", planFeature: "agenda" },
  { key: "agenda_colaborador", label: "Agenda do Colaborador", description: "Escalas e eventos atribuídos ao colaborador.", href: "/agenda-colaborador", group: "operacao", planFeature: "agenda" },
  { key: "producao", label: "Produção", description: "Equipe, tarefas e operação dos eventos.", href: "/producao", group: "operacao", planFeature: "producao" },
  { key: "clientes", label: "Clientes", description: "Cadastro e relacionamento com clientes.", href: "/clientes", group: "operacao", planFeature: "clientes" },
  { key: "crm", label: "CRM", description: "Prefeituras e oportunidades comerciais.", href: "/crm", group: "comercial", planFeature: "crm" },
  { key: "propostas", label: "Propostas", description: "Modelos e propostas comerciais.", href: "/propostas", group: "comercial", planFeature: "propostas" },
  { key: "contratos", label: "Contratos", description: "Contratos e modelos contratuais.", href: "/contratos", group: "comercial", planFeature: "contratos" },
  { key: "formatos", label: "Formatos", description: "Formatos de show disponíveis.", href: "/formatos", group: "comercial", planFeature: "formatos" },
  { key: "calculadora_show", label: "Calculadora de Show", description: "Cálculos e orçamentos de apresentações.", href: "/calculadora-show", group: "comercial", planFeature: "calculadora-show" },
  { key: "financeiro", label: "Financeiro", description: "Receitas, despesas e cobranças.", href: "/financeiro", group: "financeiro", planFeature: "financeiro" },
  { key: "relatorios", label: "Relatórios", description: "Indicadores e relatórios da conta.", href: "/relatorios", group: "financeiro", planFeature: "relatorios" },
  { key: "colaboradores", label: "Colaboradores", description: "Equipe e permissões de acesso.", href: "/colaboradores", group: "administracao", planFeature: "colaboradores", ownerOnly: true },
  { key: "configuracoes", label: "Configurações", description: "Dados críticos da conta e da empresa.", href: "/configuracoes", group: "administracao", planFeature: "configuracoes", ownerOnly: true },
  { key: "assinatura", label: "Assinatura", description: "Plano e cobrança da conta.", href: "/assinatura", group: "administracao", planFeature: null, ownerOnly: true },
];

export const ACCESS_PROFILES: Array<{ key: AccessProfileKey; label: string; modules: AccessModuleKey[] }> = [
  { key: "musico_tecnico", label: "Músico ou técnico", modules: ["agenda_colaborador"] },
  { key: "producao", label: "Produção", modules: ["dashboard", "clientes", "agenda", "agenda_colaborador", "producao", "contratos"] },
  { key: "vendas", label: "Venda de shows", modules: ["dashboard", "clientes", "crm", "propostas", "contratos", "formatos", "calculadora_show"] },
  { key: "financeiro", label: "Financeiro", modules: ["dashboard", "financeiro", "relatorios"] },
  { key: "administrador", label: "Administrador", modules: ACCESS_MODULES.filter((item) => !item.ownerOnly).map((item) => item.key) },
  { key: "personalizado", label: "Personalizado", modules: [] },
];

const PUBLIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "hotmail.com", "hotmail.com.br", "outlook.com", "outlook.com.br",
  "live.com", "live.com.br", "yahoo.com", "yahoo.com.br", "icloud.com", "uol.com.br", "bol.com.br",
  "terra.com.br", "proton.me", "protonmail.com",
]);

export function isAccessModuleKey(value: unknown): value is AccessModuleKey {
  return typeof value === "string" && (ACCESS_MODULE_KEYS as readonly string[]).includes(value);
}

export function sanitizeAllowedModules(value: unknown): AccessModuleKey[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(isAccessModuleKey))];
}

export function getAccessModule(key: AccessModuleKey) {
  return ACCESS_MODULES.find((item) => item.key === key);
}

export function getModuleForPath(pathname: string): AccessModuleKey | null {
  const candidates = ACCESS_MODULES.filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return candidates.sort((a, b) => b.href.length - a.href.length)[0]?.key || null;
}

export function getFirstAllowedRoute(modules: AccessModuleKey[]) {
  const priority: AccessModuleKey[] = ["dashboard", "agenda", "agenda_colaborador", "crm", "propostas"];
  const selected = [...priority, ...ACCESS_MODULE_KEYS].find((key) => modules.includes(key) && !getAccessModule(key)?.ownerOnly);
  return selected ? getAccessModule(selected)?.href || "/login" : "/login";
}

export function summarizeAllowedModules(modules: AccessModuleKey[]) {
  const labels = sanitizeAllowedModules(modules).map((key) => getAccessModule(key)?.label).filter(Boolean) as string[];
  if (!labels.length) return "Sem módulos liberados";
  if (labels.length <= 3) return `Acessos: ${labels.join(", ")}`;
  return `Acessos: ${labels.slice(0, 2).join(", ")} e +${labels.length - 2} módulos`;
}

export function normalizeEmailIdentifier(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "");
}

export function isValidEmailIdentifier(value: string) {
  return /^[a-z0-9](?:[a-z0-9._-]{0,62}[a-z0-9])?$/.test(value);
}

export function normalizeProfessionalDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/^@/, "").split("/")[0];
}

export function extractProfessionalDomain(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = String(value || "").trim().toLowerCase();
    const candidate = normalizeProfessionalDomain(normalized.includes("@") ? normalized.split("@").pop() || "" : normalized);
    if (candidate.includes(".") && !PUBLIC_EMAIL_DOMAINS.has(candidate)) return candidate;
  }
  return "";
}

export function buildAccessEmail(identifier: string, domain: string) {
  const local = normalizeEmailIdentifier(identifier);
  const normalizedDomain = normalizeProfessionalDomain(domain);
  return local && normalizedDomain ? `${local}@${normalizedDomain}` : "";
}

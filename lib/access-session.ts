"use client";

import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { getFirstAllowedRoute, sanitizeAllowedModules, type AccessModuleKey, type AccessProfileKey } from "./access-modules";

export const COLLABORATOR_SESSION_KEY = "giba_colaborador_session";

export type CollaboratorAccessSession = {
  id: string;
  nome: string;
  email: string;
  funcao: string;
  user_id: string;
  auth_user_id?: string | null;
  status: string;
  allowed_modules: AccessModuleKey[];
  access_profile?: AccessProfileKey | null;
  tipo: "colaborador";
};

export type AccessContext =
  | { actor: "owner"; authUser: User; accountUserId: string; allowedModules: AccessModuleKey[]; collaborator: null }
  | { actor: "collaborator"; authUser: User | null; accountUserId: string; allowedModules: AccessModuleKey[]; collaborator: CollaboratorAccessSession };

export function readCollaboratorSession(): CollaboratorAccessSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COLLABORATOR_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CollaboratorAccessSession>;
    if (!parsed.id || !parsed.user_id || parsed.tipo !== "colaborador") return null;
    return {
      id: parsed.id,
      nome: parsed.nome || "Colaborador",
      email: parsed.email || "",
      funcao: parsed.funcao || "",
      user_id: parsed.user_id,
      auth_user_id: parsed.auth_user_id || null,
      status: parsed.status || "Ativo",
      allowed_modules: sanitizeAllowedModules(parsed.allowed_modules),
      access_profile: parsed.access_profile || null,
      tipo: "colaborador",
    };
  } catch {
    return null;
  }
}

export function storeCollaboratorSession(row: Record<string, unknown>) {
  const legacyModules = row.senha ? ["agenda_colaborador" as AccessModuleKey] : [];
  const session: CollaboratorAccessSession = {
    id: String(row.id || ""),
    nome: String(row.nome || "Colaborador"),
    email: String(row.email || ""),
    funcao: String(row.funcao || ""),
    user_id: String(row.user_id || ""),
    auth_user_id: row.auth_user_id ? String(row.auth_user_id) : null,
    status: String(row.status || "Ativo"),
    allowed_modules: sanitizeAllowedModules(row.allowed_modules).length ? sanitizeAllowedModules(row.allowed_modules) : legacyModules,
    access_profile: (row.access_profile as AccessProfileKey | null) || null,
    tipo: "colaborador",
  };
  localStorage.setItem(COLLABORATOR_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearCollaboratorSession() {
  if (typeof window !== "undefined") localStorage.removeItem(COLLABORATOR_SESSION_KEY);
}

async function loadCollaboratorByAuthUser(user: User) {
  if (user.user_metadata?.giba_role !== "collaborator") return null;
  const email = String(user.email || "").toLowerCase();
  const filters = [`auth_user_id.eq.${user.id}`];
  if (email) filters.push(`email.eq.${email}`);
  const { data } = await supabase.from("collaborators").select("*").or(filters.join(",")).maybeSingle();
  return data as Record<string, unknown> | null;
}

async function refreshLegacySession(session: CollaboratorAccessSession) {
  const { data } = await supabase
    .from("collaborators")
    .select("*")
    .eq("id", session.id)
    .eq("user_id", session.user_id)
    .maybeSingle();
  return data ? storeCollaboratorSession(data as Record<string, unknown>) : null;
}

export async function resolveAccessContext(): Promise<AccessContext | null> {
  const { data, error } = await supabase.auth.getUser();
  const authUser = error ? null : data.user;

  if (authUser) {
    const collaboratorRow = await loadCollaboratorByAuthUser(authUser);
    if (collaboratorRow) {
      const collaborator = storeCollaboratorSession(collaboratorRow);
      if (collaborator.status !== "Ativo") return null;
      return { actor: "collaborator", authUser, accountUserId: collaborator.user_id, allowedModules: collaborator.allowed_modules, collaborator };
    }
    clearCollaboratorSession();
    return { actor: "owner", authUser, accountUserId: authUser.id, allowedModules: [], collaborator: null };
  }

  const stored = readCollaboratorSession();
  if (!stored) return null;
  const collaborator = await refreshLegacySession(stored);
  if (!collaborator || collaborator.status !== "Ativo") {
    clearCollaboratorSession();
    return null;
  }
  return { actor: "collaborator", authUser: null, accountUserId: collaborator.user_id, allowedModules: collaborator.allowed_modules, collaborator };
}

export async function getAccountAuthUser() {
  const context = await resolveAccessContext();
  if (!context) return { data: { user: null }, error: new Error("Usuário não autenticado.") };
  const base = context.authUser || ({ id: context.accountUserId, email: context.collaborator?.email } as User);
  return { data: { user: { ...base, id: context.accountUserId } as User }, error: null };
}

export function collaboratorHome(session: CollaboratorAccessSession) {
  return getFirstAllowedRoute(session.allowed_modules);
}

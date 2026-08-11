import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ACCESS_MODULES,
  buildAccessEmail,
  extractProfessionalDomain,
  isValidEmailIdentifier,
  normalizeEmailIdentifier,
  sanitizeAllowedModules,
  type AccessProfileKey,
} from "../../../../lib/access-modules";

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Configuração administrativa do Supabase indisponível.");
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getErrorMessage(error: unknown, fallback = "Erro ao salvar o acesso do colaborador.") {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const details = error as { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };
    const message = typeof details.message === "string" ? details.message : "";
    const hint = typeof details.hint === "string" ? details.hint : "";
    const detail = typeof details.details === "string" ? details.details : "";
    const code = typeof details.code === "string" ? details.code : "";
    const combined = [message, detail, hint].filter(Boolean).join(" ");

    if (/allowed_modules|access_profile|auth_user_id|contact_email/i.test(combined)) {
      return "A estrutura de acesso dos colaboradores ainda não foi atualizada no Supabase. Execute a migração 20260722100000_collaborator_module_access.sql e tente novamente.";
    }

    if (combined) return code ? `${combined} (${code})` : combined;
  }
  return fallback;
}

async function authenticateOwner(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const admin = adminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: collaborator } = await admin.from("collaborators").select("id").eq("auth_user_id", data.user.id).maybeSingle();
  return collaborator ? null : { admin, owner: data.user };
}

async function getOwnerConfiguration(admin: ReturnType<typeof adminClient>, ownerId: string, ownerEmail?: string) {
  const [{ data: company }, { data: subscription }] = await Promise.all([
    admin.from("company_settings").select("*").eq("user_id", ownerId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("subscriptions").select("plano,status,data_fim").eq("user_id", ownerId).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const professionalDomain = extractProfessionalDomain(
    company?.professional_domain,
    company?.email,
    ownerEmail,
  );
  const plan = String(subscription?.plano || "teste");
  let available = ACCESS_MODULES.filter((item) => !item.ownerOnly).map((item) => item.key);
  if (plan !== "owner") {
    const { data: features } = await admin.from("plan_features").select("modulo").eq("plano", plan).eq("ativo", true);
    const planFeatures = new Set((features || []).map((item) => String(item.modulo)));
    available = ACCESS_MODULES
      .filter((item) => !item.ownerOnly && (!item.planFeature || planFeatures.has(item.planFeature)))
      .map((item) => item.key);
  }
  return { professionalDomain, available };
}

async function findAuthUserByEmail(admin: ReturnType<typeof adminClient>, email: string) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found || data.users.length < 1000) return found || null;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth) return NextResponse.json({ error: "Somente o titular pode administrar acessos." }, { status: 403 });
    const payload = await request.json();
    const identifier = normalizeEmailIdentifier(String(payload.access_identifier || ""));
    if (!isValidEmailIdentifier(identifier)) {
      return NextResponse.json({ error: "Informe um identificador de acesso válido." }, { status: 400 });
    }

    const { professionalDomain, available } = await getOwnerConfiguration(auth.admin, auth.owner.id, auth.owner.email);
    if (!professionalDomain) {
      return NextResponse.json({ error: "Configure um domínio profissional na conta antes de criar o acesso." }, { status: 400 });
    }
    const email = buildAccessEmail(identifier, professionalDomain);
    const allowedModules = sanitizeAllowedModules(payload.allowed_modules).filter((key) => available.includes(key));
    const password = String(payload.password || "");
    if (sanitizeAllowedModules(payload.allowed_modules).some((key) => !available.includes(key))) {
      return NextResponse.json({ error: "Um ou mais módulos selecionados não estão disponíveis no plano atual." }, { status: 400 });
    }

    const collaboratorId = payload.id ? String(payload.id) : null;
    let current: Record<string, unknown> | null = null;
    if (collaboratorId) {
      const { data } = await auth.admin.from("collaborators").select("*").eq("id", collaboratorId).eq("user_id", auth.owner.id).maybeSingle();
      current = data as Record<string, unknown> | null;
      if (!current) return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    let duplicateQuery = auth.admin.from("collaborators").select("id").eq("email", email).eq("user_id", auth.owner.id);
    if (collaboratorId) duplicateQuery = duplicateQuery.neq("id", collaboratorId);
    const { data: duplicate } = await duplicateQuery.maybeSingle();
    if (duplicate) return NextResponse.json({ error: "Este e-mail de acesso já está sendo utilizado." }, { status: 409 });

    const authUserWithEmail = await findAuthUserByEmail(auth.admin, email);
    const currentAuthUserId = current?.auth_user_id ? String(current.auth_user_id) : null;
    if (password && password.length < 6) {
      return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }
    if (allowedModules.length && !currentAuthUserId && !password) {
      return NextResponse.json({ error: "Informe uma senha inicial para criar o acesso do colaborador." }, { status: 400 });
    }
    if (authUserWithEmail && authUserWithEmail.id !== currentAuthUserId) {
      return NextResponse.json({ error: "Este e-mail de acesso já está sendo utilizado." }, { status: 409 });
    }

    const row = {
      user_id: auth.owner.id,
      nome: String(payload.nome || "").trim(),
      funcao: String(payload.funcao || "").trim(),
      celular: String(payload.celular || "").trim(),
      email,
      contact_email: String(payload.contact_email || "").trim().toLowerCase() || null,
      status: payload.status === "Inativo" ? "Inativo" : "Ativo",
      photo_url: payload.photo_url || null,
      pix_key: String(payload.pix_key || "").trim() || null,
      pix_type: String(payload.pix_type || "").trim() || null,
      instagram: String(payload.instagram || "").trim() || null,
      pix_favorecido: String(payload.pix_favorecido || "").trim() || null,
      observacoes: String(payload.observacoes || "").trim() || null,
      access_profile: String(payload.access_profile || "personalizado") as AccessProfileKey,
      allowed_modules: allowedModules,
    };
    if (!row.nome) return NextResponse.json({ error: "Informe o nome do colaborador." }, { status: 400 });

    const saveResult = collaboratorId
      ? await auth.admin.from("collaborators").update(row).eq("id", collaboratorId).eq("user_id", auth.owner.id).select("*").single()
      : await auth.admin.from("collaborators").insert(row).select("*").single();
    if (saveResult.error || !saveResult.data) throw saveResult.error || new Error("Não foi possível salvar o colaborador.");

    const saved = saveResult.data as Record<string, unknown>;
    let authUserId = currentAuthUserId;
    if (allowedModules.length) {
      if (authUserId) {
        const { error } = await auth.admin.auth.admin.updateUserById(authUserId, {
          email,
          email_confirm: true,
          ...(password ? { password } : {}),
          user_metadata: { giba_role: "collaborator", owner_user_id: auth.owner.id, collaborator_id: saved.id },
        });
        if (error) throw error;
      } else {
        const { data: created, error } = await auth.admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { giba_role: "collaborator", owner_user_id: auth.owner.id, collaborator_id: saved.id },
        });
        if (error || !created.user) {
          if (!collaboratorId) await auth.admin.from("collaborators").delete().eq("id", saved.id);
          throw error || new Error("Não foi possível criar o acesso no Supabase Auth.");
        }
        authUserId = created.user.id;
      }
    }

    const { data: finalRow, error: finalError } = await auth.admin
      .from("collaborators")
      .update({ auth_user_id: authUserId, senha: null })
      .eq("id", saved.id)
      .select("*")
      .single();
    if (finalError) throw finalError;
    return NextResponse.json({
      collaborator: finalRow,
      access_email: email,
      account_created: Boolean(!currentAuthUserId && authUserId),
      password_updated: Boolean(currentAuthUserId && password),
    });
  } catch (error) {
    console.error("Erro ao administrar acesso do colaborador:", error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateOwner(request);
    if (!auth) return NextResponse.json({ error: "Somente o titular pode excluir colaboradores." }, { status: 403 });
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Colaborador não informado." }, { status: 400 });
    const { data: row } = await auth.admin.from("collaborators").select("auth_user_id").eq("id", id).eq("user_id", auth.owner.id).maybeSingle();
    if (!row) return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    const { error } = await auth.admin.from("collaborators").delete().eq("id", id).eq("user_id", auth.owner.id);
    if (error) throw error;
    if (row.auth_user_id) await auth.admin.auth.admin.deleteUser(row.auth_user_id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Erro ao excluir colaborador.") }, { status: 500 });
  }
}

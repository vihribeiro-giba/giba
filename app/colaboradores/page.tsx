"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { Users, UserCheck, UserX, KeyRound, Plus, X } from "lucide-react";

import type { Colaborador, FiltroStatus, PixTipo } from "../../components/colaboradores/types";
import {
  BUCKET_FOTOS,
  caminhoDaUrlPublica,
  processarImagem,
} from "../../components/colaboradores/utils";
import ResumoCard from "../../components/colaboradores/ResumoCard";
import EstadoVazio from "../../components/colaboradores/EstadoVazio";
import ColaboradorForm from "../../components/colaboradores/ColaboradorForm";
import ColaboradorFilters from "../../components/colaboradores/ColaboradorFilters";
import ColaboradorCard from "../../components/colaboradores/ColaboradorCard";
import WhatsAppMessageModal from "../../components/whatsapp/WhatsAppMessageModal";
import {
  ACCESS_MODULES,
  extractProfessionalDomain,
  isValidEmailIdentifier,
  normalizeEmailIdentifier,
  sanitizeAllowedModules,
  type AccessModuleKey,
} from "../../lib/access-modules";

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [whatsappColaborador, setWhatsappColaborador] = useState<Colaborador | null>(null);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [celular, setCelular] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [accessIdentifier, setAccessIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [professionalDomain, setProfessionalDomain] = useState("");
  const [domainError, setDomainError] = useState("");
  const [allowedModules, setAllowedModules] = useState<AccessModuleKey[]>([]);
  const [availableModules, setAvailableModules] = useState<AccessModuleKey[]>([]);
  const [instagram, setInstagram] = useState("");
  const [status, setStatus] = useState("Ativo");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [pixTipo, setPixTipo] = useState<PixTipo>("CPF");
  const [pixChave, setPixChave] = useState("");
  const [pixFavorecido, setPixFavorecido] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Busca / filtros
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");

  // Feedback "copiar acesso"
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /* ---------- autenticação / carregamento (mantido) ---------- */
  async function obterUsuarioLogado() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      alert("Usuário não autenticado. Faça login novamente.");
      return null;
    }

    return user;
  }

  async function carregarConfiguracaoAcesso(userId: string, authEmail?: string) {
    const [{ data: company }, { data: subscription }] = await Promise.all([
      supabase.from("company_settings").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("subscriptions").select("plano").eq("user_id", userId).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const domain = extractProfessionalDomain(company?.professional_domain, company?.email, authEmail);
    setProfessionalDomain(domain);
    setDomainError(domain ? "" : "Configure um domínio profissional em Configurações. E-mails públicos como Gmail, Hotmail e Outlook não podem ser usados como domínio de acesso.");

    const selectable = ACCESS_MODULES.filter((item) => !item.ownerOnly);
    if (subscription?.plano === "owner") {
      const modules = selectable.map((item) => item.key);
      setAvailableModules(modules);
      return;
    }
    const { data: features } = await supabase.from("plan_features").select("modulo").eq("plano", subscription?.plano || "teste").eq("ativo", true);
    const enabledFeatures = new Set((features || []).map((item) => String(item.modulo)));
    const modules = selectable.filter((item) => !item.planFeature || enabledFeatures.has(item.planFeature)).map((item) => item.key);
    setAvailableModules(modules);
  }

  async function carregarColaboradores() {
    setCarregando(true);
    const user = await obterUsuarioLogado();
    if (!user) {
      setCarregando(false);
      return;
    }

    await carregarConfiguracaoAcesso(user.id, user.email);

    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[v0] Erro ao carregar colaboradores:", error);
      alert("Erro ao carregar colaboradores.");
      setCarregando(false);
      return;
    }

    setColaboradores(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarColaboradores();
  }, []);

  useEffect(() => {
    if (!modalAberto) return;

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const fecharComEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !salvando && !enviandoFoto) {
        limparFormulario();
      }
    };

    window.addEventListener("keydown", fecharComEsc);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEsc);
    };
  }, [modalAberto, salvando, enviandoFoto]);

  /* ---------- salvar (mantém CRUD + novos campos) ---------- */
  async function salvarColaborador(e: React.FormEvent) {
    e.preventDefault();
    const identifier = normalizeEmailIdentifier(accessIdentifier);
    if (!professionalDomain) {
      alert("Configure um domínio profissional antes de criar o acesso.");
      return;
    }
    if (!isValidEmailIdentifier(identifier)) {
      alert("Informe um identificador de e-mail válido usando letras, números, ponto, hífen ou sublinhado.");
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      alert("Sua sessão expirou. Entre novamente para administrar colaboradores.");
      return;
    }

    setSalvando(true);
    try {
      const response = await fetch("/api/collaborators/access", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: editandoId,
          nome,
          funcao,
          celular,
          contact_email: contactEmail,
          access_identifier: identifier,
          password,
          status,
          photo_url: photoUrl,
          pix_key: pixChave,
          pix_type: pixChave.trim() ? pixTipo : null,
          instagram,
          pix_favorecido: pixFavorecido,
          observacoes,
          access_profile: "personalizado",
          allowed_modules: allowedModules,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Erro ao salvar colaborador.");
      alert(result.account_created
        ? `Colaborador salvo. O acesso foi criado para ${result.access_email} com a senha inicial informada.`
        : result.password_updated
          ? "Colaborador e senha atualizados com sucesso."
          : "Colaborador atualizado com sucesso.");
      limparFormulario();
      await carregarColaboradores();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao salvar colaborador.");
    } finally {
      setSalvando(false);
    }
  }

  function editarColaborador(colaborador: Colaborador) {
    setEditandoId(colaborador.id);
    setNome(colaborador.nome || "");
    setFuncao(colaborador.funcao || "");
    setCelular(colaborador.celular || "");
    const currentEmail = colaborador.email || "";
    const currentEmailDomain = currentEmail.split("@")[1]?.toLowerCase() || "";
    setContactEmail(colaborador.contact_email || (currentEmailDomain && currentEmailDomain !== professionalDomain ? currentEmail : ""));
    setAccessIdentifier(normalizeEmailIdentifier(currentEmail.split("@")[0] || ""));
    setPassword("");
    const savedModules = sanitizeAllowedModules(colaborador.allowed_modules).length
      ? sanitizeAllowedModules(colaborador.allowed_modules)
      : colaborador.senha ? ["agenda_colaborador" as AccessModuleKey] : [];
    setAllowedModules(savedModules.filter((key) => availableModules.includes(key)));
    setInstagram(colaborador.instagram || "");
    setStatus(colaborador.status || "Ativo");
    setPhotoUrl(colaborador.photo_url || null);
    setPixTipo((colaborador.pix_type as PixTipo) || "CPF");
    setPixChave(colaborador.pix_key || "");
    setPixFavorecido(colaborador.pix_favorecido || "");
    setObservacoes(colaborador.observacoes || "");
    setModalAberto(true);
  }

  async function excluirColaborador(id: string) {
    const confirmar = confirm("Deseja excluir este colaborador?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();
    if (!user) return;

    const alvo = colaboradores.find((c) => c.id === id);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return alert("Sua sessão expirou. Entre novamente.");
    const response = await fetch(`/api/collaborators/access?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) return alert(result.error || "Erro ao excluir colaborador.");

    // Limpa a foto associada no Storage (se existir).
    const caminhoFoto = caminhoDaUrlPublica(alvo?.photo_url);
    if (caminhoFoto) {
      await supabase.storage.from(BUCKET_FOTOS).remove([caminhoFoto]);
    }

    carregarColaboradores();
  }

  function limparFormulario() {
    setModalAberto(false);
    setEditandoId(null);
    setNome("");
    setFuncao("");
    setCelular("");
    setContactEmail("");
    setAccessIdentifier("");
    setPassword("");
    setAllowedModules([]);
    setInstagram("");
    setStatus("Ativo");
    setPhotoUrl(null);
    setPixTipo("CPF");
    setPixChave("");
    setPixFavorecido("");
    setObservacoes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ---------- upload de foto (Supabase Storage) ---------- */
  async function aoSelecionarFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem válido.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const user = await obterUsuarioLogado();
    if (!user) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setEnviandoFoto(true);
    try {
      const blob = await processarImagem(file);
      const caminho = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_FOTOS)
        .upload(caminho, blob, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.error("[v0] Erro ao enviar foto:", uploadError);
        alert(
          'Não foi possível enviar a foto. Verifique se o bucket "' +
            BUCKET_FOTOS +
            '" existe e está público no Supabase Storage.'
        );
        setEnviandoFoto(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      // Remove a foto anterior do Storage (se houver) para não acumular lixo.
      const caminhoAntigo = caminhoDaUrlPublica(photoUrl);
      if (caminhoAntigo) {
        await supabase.storage.from(BUCKET_FOTOS).remove([caminhoAntigo]);
      }

      const { data } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);
      setPhotoUrl(data.publicUrl);
    } catch (erro) {
      console.error("[v0] Erro ao processar imagem:", erro);
      alert("Não foi possível processar a imagem.");
    } finally {
      setEnviandoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function removerFoto() {
    const caminho = caminhoDaUrlPublica(photoUrl);
    if (caminho) {
      await supabase.storage.from(BUCKET_FOTOS).remove([caminho]);
    }
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ---------- ações dos cards ---------- */
  function abrirWhatsApp(colaborador: Colaborador) {
    setWhatsappColaborador(colaborador);
  }

  async function copiarAcesso(colaborador: Colaborador) {
    const mensagem = `Olá, ${colaborador.nome}.

Seu acesso à Plataforma GIBA foi liberado.

Link:
https://www.plataformagiba.com.br/login

E-mail de acesso:
${colaborador.email || "-"}

Use a senha inicial definida pelo titular. Depois de entrar, você poderá alterá-la pela opção "Alterar senha" no menu.`;

    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiadoId(colaborador.id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch (erro) {
      console.error("[v0] Erro ao copiar acesso:", erro);
      alert("Não foi possível copiar. Copie manualmente:\n\n" + mensagem);
    }
  }

  /* ---------- métricas ---------- */
  function possuiAcesso(colaborador: Colaborador) {
    const modules = sanitizeAllowedModules(colaborador.allowed_modules);
    const effectiveModules = modules.length ? modules : colaborador.senha ? ["agenda_colaborador"] : [];
    return colaborador.status === "Ativo" && Boolean(colaborador.auth_user_id || colaborador.senha) && effectiveModules.length > 0;
  }

  const metricas = useMemo(() => {
    const total = colaboradores.length;
    const ativos = colaboradores.filter((c) => c.status === "Ativo").length;
    const inativos = colaboradores.filter((c) => c.status !== "Ativo").length;
    const semAcesso = colaboradores.filter((c) => !possuiAcesso(c)).length;
    return { total, ativos, inativos, semAcesso };
  }, [colaboradores]);

  /* ---------- busca + filtro ---------- */
  const colaboradoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return colaboradores.filter((c) => {
      const passaFiltro =
        filtro === "todos"
          ? true
          : filtro === "ativos"
          ? c.status === "Ativo"
          : filtro === "inativos"
          ? c.status !== "Ativo"
          : !possuiAcesso(c);

      if (!passaFiltro) return false;
      if (!termo) return true;

      return (
        (c.nome || "").toLowerCase().includes(termo) ||
        (c.funcao || "").toLowerCase().includes(termo) ||
        (c.celular || "").toLowerCase().includes(termo) ||
        (c.email || "").toLowerCase().includes(termo) ||
        (c.contact_email || "").toLowerCase().includes(termo) ||
        (c.instagram || "").toLowerCase().includes(termo) ||
        (c.pix_favorecido || "").toLowerCase().includes(termo)
      );
    });
  }, [colaboradores, busca, filtro]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="colaboradores">
        <AppLayout>
          <style>{`
            .col-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
            .col-scroll { scrollbar-width: none; -ms-overflow-style: none; }
            .col-input::placeholder { color: #6B7280; }
            .col-card-anim { animation: colFade .25s ease; }
            @keyframes colFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes colSpin { to { transform: rotate(360deg); } }
          `}</style>

          <div style={pageStyle}>
            {/* ---------- HEADER ---------- */}
            <header style={headerStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={headerIconBoxStyle}>
                  <Users size={24} />
                </div>
                <div>
                  <h1 style={titleStyle}>Colaboradores</h1>
                  <p style={subtitleStyle}>
                    Cadastre músicos, técnicos, produtores e demais profissionais que participam dos eventos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  limparFormulario();
                  setModalAberto(true);
                }}
                style={novoBotaoStyle}
              >
                <Plus size={18} />
                Novo Colaborador
              </button>
            </header>

            {/* ---------- CARDS DE RESUMO ---------- */}
            <section style={metricsGridStyle}>
              <ResumoCard
                icon={<Users size={22} />}
                color="#8B35FF"
                label="Total de Colaboradores"
                value={metricas.total}
                detail="Cadastrados na conta"
              />
              <ResumoCard
                icon={<UserCheck size={22} />}
                color="#37E884"
                label="Ativos"
                value={metricas.ativos}
                detail="Disponíveis para escala"
              />
              <ResumoCard
                icon={<UserX size={22} />}
                color="#FF5B8A"
                label="Inativos"
                value={metricas.inativos}
                detail="Fora de operação"
              />
              <ResumoCard
                icon={<KeyRound size={22} />}
                color="#F59E0B"
                label="Sem Acesso"
                value={metricas.semAcesso}
                detail="Sem conta ativa ou módulos"
              />
            </section>

            {/* ---------- LISTA PRINCIPAL ---------- */}
            <section>
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <h2 style={panelTitleStyle}>Colaboradores Cadastrados</h2>
                  <span style={contadorStyle}>{colaboradoresFiltrados.length}</span>
                </div>

                <ColaboradorFilters
                  busca={busca}
                  setBusca={setBusca}
                  filtro={filtro}
                  setFiltro={setFiltro}
                />

                {/* Lista de cards */}
                <div style={listaColaboradoresScrollStyle} className="col-scroll">
                  {carregando && (
                    <EstadoVazio
                      titulo="Carregando colaboradores..."
                      texto="Buscando os dados da sua equipe."
                    />
                  )}

                  {!carregando &&
                    colaboradoresFiltrados.map((colaborador) => (
                      <ColaboradorCard
                        key={colaborador.id}
                        colaborador={colaborador}
                        copiado={copiadoId === colaborador.id}
                        onWhatsApp={abrirWhatsApp}
                        onCopiar={copiarAcesso}
                        onEditar={editarColaborador}
                        onExcluir={excluirColaborador}
                      />
                    ))}

                  {!carregando && colaboradoresFiltrados.length === 0 && (
                    <EstadoVazio
                      titulo={
                        colaboradores.length === 0
                          ? "Nenhum colaborador cadastrado ainda."
                          : "Nenhum resultado encontrado."
                      }
                      texto={
                        colaboradores.length === 0
                          ? "Use o botão Novo Colaborador para cadastrar o primeiro profissional."
                          : "Ajuste a busca ou os filtros para ver mais resultados."
                      }
                    />
                  )}
                </div>


              </div>
            </section>
          </div>

          {modalAberto && (
            <div
              className="fixed inset-0 z-[1000] overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-8"
              onMouseDown={() => {
                if (!salvando && !enviandoFoto) limparFormulario();
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={editandoId ? "Editar colaborador" : "Cadastrar colaborador"}
                className="relative mx-auto w-full max-w-3xl"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={limparFormulario}
                  disabled={salvando || enviandoFoto}
                  className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-slate-900/90 text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Fechar formulário de colaborador"
                >
                  <X size={18} />
                </button>

                <ColaboradorForm
                  editandoId={editandoId}
                  salvando={salvando}
                  enviandoFoto={enviandoFoto}
                  nome={nome}
                  setNome={setNome}
                  funcao={funcao}
                  setFuncao={setFuncao}
                  celular={celular}
                  setCelular={setCelular}
                  accessIdentifier={accessIdentifier}
                  setAccessIdentifier={(value) => setAccessIdentifier(normalizeEmailIdentifier(value))}
                  password={password}
                  setPassword={setPassword}
                  professionalDomain={professionalDomain}
                  domainError={domainError}
                  instagram={instagram}
                  setInstagram={setInstagram}
                  status={status}
                  setStatus={setStatus}
                  pixTipo={pixTipo}
                  setPixTipo={setPixTipo}
                  pixChave={pixChave}
                  setPixChave={setPixChave}
                  observacoes={observacoes}
                  setObservacoes={setObservacoes}
                  allowedModules={allowedModules}
                  setAllowedModules={setAllowedModules}
                  availableModules={availableModules}
                  photoUrl={photoUrl}
                  fileInputRef={fileInputRef}
                  onSelecionarFoto={aoSelecionarFoto}
                  onRemoverFoto={removerFoto}
                  formRef={formRef}
                  onSubmit={salvarColaborador}
                  onCancelar={limparFormulario}
                />
              </div>
            </div>
          )}

          <WhatsAppMessageModal
            open={Boolean(whatsappColaborador)}
            onOpenChange={(open) => !open && setWhatsappColaborador(null)}
            contextType="colaborador"
            messageType="mensagem_personalizada"
            recipient={whatsappColaborador ? {
              id: whatsappColaborador.id,
              name: whatsappColaborador.nome,
              phone: whatsappColaborador.celular,
              email: whatsappColaborador.email,
            } : undefined}
            extraVariables={{ tipo: whatsappColaborador?.funcao, status: whatsappColaborador?.status }}
          />
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

/* ============================================================
   ESTILOS DA PÁGINA
   ============================================================ */
const pageStyle: React.CSSProperties = {
  color: "#FFFFFF",
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  marginBottom: 24,
  flexWrap: "wrap",
};

const headerIconBoxStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  minWidth: 48,
  borderRadius: 16,
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  boxShadow: "0 18px 36px rgba(139,53,255,0.28)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  lineHeight: 1.1,
  letterSpacing: "-0.5px",
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#94A3B8",
  fontSize: 14,
  maxWidth: 560,
};

const novoBotaoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 20px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: 14,
  cursor: "pointer",
  boxShadow: "0 16px 32px rgba(139,53,255,0.28)",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
  marginBottom: 24,
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 0 40px rgba(0,0,0,0.25)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 19,
  fontWeight: 800,
  color: "#FFFFFF",
};

const contadorStyle: React.CSSProperties = {
  minWidth: 30,
  height: 30,
  padding: "0 10px",
  borderRadius: 999,
  background: "rgba(139,53,255,0.18)",
  color: "#C4A0FF",
  fontSize: 13,
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const listaColaboradoresScrollStyle: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 10,
  maxHeight: 720,
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: 4,
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};


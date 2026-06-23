"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useMemo, useRef, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { Users, UserCheck, UserX, KeyRound, Plus } from "lucide-react";

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

export default function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [funcao, setFuncao] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [senha, setSenha] = useState("");
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

  /* ---------- responsividade (mesmo padrão dos módulos) ---------- */
  useEffect(() => {
    const verificarTela = () => setIsMobile(window.innerWidth <= 1100);
    verificarTela();
    window.addEventListener("resize", verificarTela);
    return () => window.removeEventListener("resize", verificarTela);
  }, []);

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

  async function carregarColaboradores() {
    setCarregando(true);
    const user = await obterUsuarioLogado();
    if (!user) {
      setCarregando(false);
      return;
    }

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

  /* ---------- salvar (mantém CRUD + novos campos) ---------- */
  async function salvarColaborador(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();
    if (!user) return;

    if (!editandoId && !senha.trim()) {
      alert("Informe uma senha para o colaborador.");
      return;
    }

    setSalvando(true);

    const dados: {
      user_id?: string;
      nome: string;
      funcao: string;
      celular: string;
      email: string;
      senha?: string;
      status: string;
      photo_url: string | null;
      pix_key: string | null;
      pix_type: string | null;
      instagram: string | null;
      pix_favorecido: string | null;
      observacoes: string | null;
    } = {
      nome,
      funcao,
      celular,
      email,
      status,
      photo_url: photoUrl,
      pix_key: pixChave.trim() ? pixChave.trim() : null,
      pix_type: pixChave.trim() ? pixTipo : null,
      instagram: instagram.trim() ? instagram.trim() : null,
      pix_favorecido: pixFavorecido.trim() ? pixFavorecido.trim() : null,
      observacoes: observacoes.trim() ? observacoes.trim() : null,
    };

    if (senha.trim()) {
      dados.senha = senha;
    }

    if (editandoId) {
      const { error } = await supabase
        .from("collaborators")
        .update(dados)
        .eq("id", editandoId)
        .eq("user_id", user.id);

      if (error) {
        console.error("[v0] Erro ao atualizar colaborador:", error);
        alert("Erro ao atualizar colaborador.");
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from("collaborators").insert({
        ...dados,
        user_id: user.id,
      });

      if (error) {
        console.error("[v0] Erro ao cadastrar colaborador:", error);
        alert("Erro ao cadastrar colaborador.");
        setSalvando(false);
        return;
      }
    }

    limparFormulario();
    setSalvando(false);
    carregarColaboradores();
  }

  function editarColaborador(colaborador: Colaborador) {
    setEditandoId(colaborador.id);
    setNome(colaborador.nome || "");
    setFuncao(colaborador.funcao || "");
    setCelular(colaborador.celular || "");
    setEmail(colaborador.email || "");
    setInstagram(colaborador.instagram || "");
    setSenha("");
    setStatus(colaborador.status || "Ativo");
    setPhotoUrl(colaborador.photo_url || null);
    setPixTipo((colaborador.pix_type as PixTipo) || "CPF");
    setPixChave(colaborador.pix_key || "");
    setPixFavorecido(colaborador.pix_favorecido || "");
    setObservacoes(colaborador.observacoes || "");

    if (isMobile && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function excluirColaborador(id: string) {
    const confirmar = confirm("Deseja excluir este colaborador?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();
    if (!user) return;

    const alvo = colaboradores.find((c) => c.id === id);

    const { error } = await supabase
      .from("collaborators")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[v0] Erro ao excluir colaborador:", error);
      alert("Erro ao excluir colaborador.");
      return;
    }

    // Limpa a foto associada no Storage (se existir).
    const caminhoFoto = caminhoDaUrlPublica(alvo?.photo_url);
    if (caminhoFoto) {
      await supabase.storage.from(BUCKET_FOTOS).remove([caminhoFoto]);
    }

    carregarColaboradores();
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setFuncao("");
    setCelular("");
    setEmail("");
    setInstagram("");
    setSenha("");
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
    const numero = (colaborador.celular || "").replace(/\D/g, "");
    if (!numero) {
      alert("Este colaborador não possui celular cadastrado.");
      return;
    }
    const comDDI = numero.length <= 11 ? `55${numero}` : numero;
    const texto = encodeURIComponent(`Olá, ${colaborador.nome}! Tudo bem?`);
    window.open(`https://wa.me/${comDDI}?text=${texto}`, "_blank");
  }

  async function copiarAcesso(colaborador: Colaborador) {
    const mensagem = `Olá, ${colaborador.nome}.

Seu acesso à Agenda do Colaborador GIBA foi liberado.

Link:
https://plataformagiba.com.br/login-colaborador

E-mail:
${colaborador.email || "-"}

Senha:
${colaborador.senha || "(senha cadastrada no sistema)"}`;

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
  const metricas = useMemo(() => {
    const total = colaboradores.length;
    const ativos = colaboradores.filter((c) => c.status === "Ativo").length;
    const inativos = colaboradores.filter((c) => c.status !== "Ativo").length;
    const semAcesso = colaboradores.filter((c) => !c.senha).length;
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
          : !c.senha; // sem-acesso

      if (!passaFiltro) return false;
      if (!termo) return true;

      return (
        (c.nome || "").toLowerCase().includes(termo) ||
        (c.funcao || "").toLowerCase().includes(termo) ||
        (c.celular || "").toLowerCase().includes(termo) ||
        (c.email || "").toLowerCase().includes(termo) ||
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
                  <Users size={26} />
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
                  if (isMobile && formRef.current) {
                    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
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
                label="Sem acesso"
                value={metricas.semAcesso}
                detail="Sem senha cadastrada"
              />
            </section>

            {/* ---------- GRID PRINCIPAL ---------- */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "420px 1fr",
                gap: 22,
                alignItems: "start",
              }}
            >
              {/* ===== FORMULÁRIO ===== */}
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
                email={email}
                setEmail={setEmail}
                instagram={instagram}
                setInstagram={setInstagram}
                senha={senha}
                setSenha={setSenha}
                status={status}
                setStatus={setStatus}
                pixTipo={pixTipo}
                setPixTipo={setPixTipo}
                pixChave={pixChave}
                setPixChave={setPixChave}
                pixFavorecido={pixFavorecido}
                setPixFavorecido={setPixFavorecido}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
                photoUrl={photoUrl}
                fileInputRef={fileInputRef}
                onSelecionarFoto={aoSelecionarFoto}
                onRemoverFoto={removerFoto}
                formRef={formRef}
                onSubmit={salvarColaborador}
                onCancelar={limparFormulario}
              />

              {/* ===== LISTA ===== */}
              <div style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <h2 style={panelTitleStyle}>Colaboradores cadastrados</h2>
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
                          ? "Cadastre seu primeiro colaborador no formulário ao lado."
                          : "Ajuste a busca ou os filtros para ver mais resultados."
                      }
                    />
                  )}
                </div>


              </div>
            </section>
          </div>
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
  width: 54,
  height: 54,
  minWidth: 54,
  borderRadius: 18,
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  boxShadow: "0 18px 36px rgba(139,53,255,0.28)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
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
  gap: 14,
  maxHeight: 620,
  overflowY: "auto",
  overflowX: "hidden",
  paddingRight: 4,
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};


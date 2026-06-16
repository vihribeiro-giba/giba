"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  Users,
  Cake,
  CheckCircle2,
  Sparkles,
  Gift,
  Search,
  Bell,
  Plus,
  UserPlus,
  Pencil,
  Trash2,
  MessageCircle,
  CalendarPlus,
  MapPin,
  Mail,
  Phone,
  X,
  Filter,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

type Cliente = {
  id: string;
  user_id?: string;
  nome: string;
  cpf_cnpj: string;
  celular: string;
  email: string;
  endereco_completo: string;
  created_at?: string;
  // Novos campos (opcionais)
  data_aniversario?: string | null;
  tipo_cliente?: string | null;
  origem_cliente?: string | null;
  status_cliente?: string | null;
  observacoes?: string | null;
};

/* ============================================================
   OPÇÕES DE FORMULÁRIO
   ============================================================ */
const tipoClienteOptions = [
  "Pessoa Física",
  "Pessoa Jurídica",
  "Prefeitura",
  "Produtor",
  "Empresa",
  "Casa de eventos",
];

const origemClienteOptions = [
  "Instagram",
  "Indicação",
  "Prefeitura",
  "Site",
  "WhatsApp",
  "Evento anterior",
  "Outro",
];

const statusClienteOptions = [
  "Novo",
  "Em negociação",
  "Cliente ativo",
  "Recorrente",
  "Inativo",
];

/* ============================================================
   FUNÇÕES UTILITÁRIAS / MÁSCARAS
   ============================================================ */
function apenasNumeros(valor: string) {
  return (valor || "").replace(/\D/g, "");
}

function formatarCpfCnpj(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 14);

  // CPF: 000.000.000-00
  if (numeros.length <= 11) {
    return numeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  // CNPJ: 00.000.000/0000-00
  return numeros
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatarCelular(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 11);

  // Celular com 11 dígitos: (31) 99357-5969
  if (numeros.length > 10) {
    return numeros.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
  }

  // Telefone com 10 dígitos: (31) 3333-3333
  if (numeros.length > 6) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  }

  if (numeros.length > 2) {
    return numeros.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
  }

  if (numeros.length > 0) {
    return numeros.replace(/^(\d{0,2}).*/, "($1");
  }

  return numeros;
}

function formatarDataBR(data?: string | null) {
  if (!data) return "";
  // Aceita formato yyyy-mm-dd ou ISO
  const apenasData = data.split("T")[0];
  const partes = apenasData.split("-");
  if (partes.length !== 3) return data;
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

function formatarAniversarioDiaMes(data?: string | null) {
  if (!data) return "";

  // Se vier do banco como yyyy-mm-dd, exibe apenas dd/mm.
  if (data.includes("-")) {
    const apenasData = data.split("T")[0];
    const partes = apenasData.split("-");
    if (partes.length === 3) return `${partes[2]}/${partes[1]}`;
  }

  const numeros = apenasNumeros(data).slice(0, 4);
  if (numeros.length <= 2) return numeros;
  return `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
}

function aniversarioParaBanco(valor: string) {
  const numeros = apenasNumeros(valor).slice(0, 4);
  if (numeros.length !== 4) return null;

  const dia = Number(numeros.slice(0, 2));
  const mes = Number(numeros.slice(2, 4));

  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) return null;

  // Ano fixo para preservar privacidade: usamos somente dia/mês na experiência.
  return `2000-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function normalizarTexto(valor: string) {
  return (valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarTelefoneWhatsApp(telefone: string) {
  let limpo = apenasNumeros(telefone);
  if (limpo.startsWith("0")) limpo = limpo.replace(/^0+/, "");
  if (limpo.startsWith("55") && limpo.length >= 12) return limpo;
  if (!limpo.startsWith("55") && (limpo.length === 10 || limpo.length === 11)) {
    return `55${limpo}`;
  }
  return "";
}

function iniciais(nome: string) {
  const partes = (nome || "").trim().split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const avatarPalette = ["#8B35FF", "#00AAFF", "#38BDF8", "#37E884", "#FF5B8A", "#F59E0B"];

function corAvatar(nome: string) {
  const texto = nome || "?";
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma += texto.charCodeAt(i);
  return avatarPalette[soma % avatarPalette.length];
}

function mesDaData(data?: string | null) {
  if (!data) return -1;
  const partes = data.split("T")[0].split("-");
  if (partes.length !== 3) return -1;
  return Number(partes[1]) - 1;
}

/* Cor por status / tipo para os badges */
function corStatus(status?: string | null) {
  switch (status) {
    case "Cliente ativo":
      return "#37E884";
    case "Recorrente":
      return "#38BDF8";
    case "Em negociação":
      return "#F59E0B";
    case "Inativo":
      return "#FF5B8A";
    default:
      return "#8B35FF"; // Novo / fallback
  }
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [apenasAniversariantes, setApenasAniversariantes] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [tipoCliente, setTipoCliente] = useState("Pessoa Física");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [dataAniversario, setDataAniversario] = useState("");
  const [enderecoCompleto, setEnderecoCompleto] = useState("");
  const [origemCliente, setOrigemCliente] = useState("");
  const [statusCliente, setStatusCliente] = useState("Novo");
  const [observacoes, setObservacoes] = useState("");
  const [whatsappCliente, setWhatsappCliente] = useState<Cliente | null>(null);
  const [whatsappTelefone, setWhatsappTelefone] = useState("");
  const [whatsappMensagem, setWhatsappMensagem] = useState("");
  const [whatsappAviso, setWhatsappAviso] = useState("");

  useEffect(() => {
    const verificarTela = () => setIsMobile(window.innerWidth <= 980);
    verificarTela();
    window.addEventListener("resize", verificarTela);
    return () => window.removeEventListener("resize", verificarTela);
  }, []);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function obterUsuarioLogado() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("[v0] Erro ao buscar usuário:", error);
      return null;
    }
    return user;
  }

  async function carregarClientes() {
    setCarregando(true);
    const user = await obterUsuarioLogado();

    if (!user) {
      setClientes([]);
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[v0] Erro ao carregar clientes:", error);
      setClientes([]);
      setCarregando(false);
      return;
    }

    setClientes(data || []);
    setCarregando(false);
  }

  function limparFormulario() {
    setEditandoId(null);
    setNome("");
    setTipoCliente("Pessoa Física");
    setCpfCnpj("");
    setCelular("");
    setEmail("");
    setDataAniversario("");
    setEnderecoCompleto("");
    setOrigemCliente("");
    setStatusCliente("Novo");
    setObservacoes("");
  }

  /* Detecta erro de coluna inexistente para fazer fallback seguro */
  function erroDeColunaInexistente(error: any) {
    if (!error) return false;
    const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
    return (
      error.code === "PGRST204" ||
      error.code === "42703" ||
      msg.includes("column") ||
      msg.includes("schema cache")
    );
  }

  async function salvarCliente(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    setSalvando(true);

    // Campos atuais obrigatórios da tabela
    const dadosBase = {
      nome,
      cpf_cnpj: cpfCnpj,
      celular,
      email,
      endereco_completo: enderecoCompleto,
      user_id: user.id,
    };

    // Novos campos (aplicados com fallback se não existirem no banco)
    const dadosExtras = {
      data_aniversario: aniversarioParaBanco(dataAniversario),
      tipo_cliente: tipoCliente || null,
      origem_cliente: origemCliente || null,
      status_cliente: statusCliente || null,
      observacoes: observacoes || null,
    };

    const persistir = async (payload: Record<string, any>) => {
      if (editandoId) {
        return supabase
          .from("clients")
          .update(payload)
          .eq("id", editandoId)
          .eq("user_id", user.id);
      }
      return supabase.from("clients").insert(payload);
    };

    // 1ª tentativa: com todos os campos
    let { error } = await persistir({ ...dadosBase, ...dadosExtras });

    // 2ª tentativa (fallback): só com os campos atuais garantidos
    if (error && erroDeColunaInexistente(error)) {
      console.warn(
        "[v0] Colunas novas ainda não existem no Supabase. Salvando apenas campos atuais. Rode o SQL indicado no final do arquivo."
      );
      const retry = await persistir(dadosBase);
      error = retry.error;
    }

    setSalvando(false);

    if (error) {
      console.error("[v0] Erro ao salvar cliente:", error);
      alert("Erro ao salvar cliente.");
      return;
    }

    limparFormulario();
    carregarClientes();
  }

  function editarCliente(cliente: Cliente) {
    setEditandoId(cliente.id);
    setNome(cliente.nome || "");
    setTipoCliente(cliente.tipo_cliente || "Pessoa Física");
    setCpfCnpj(formatarCpfCnpj(cliente.cpf_cnpj || ""));
    setCelular(formatarCelular(cliente.celular || ""));
    setEmail(cliente.email || "");
    setDataAniversario(formatarAniversarioDiaMes(cliente.data_aniversario));
    setEnderecoCompleto(cliente.endereco_completo || "");
    setOrigemCliente(cliente.origem_cliente || "");
    setStatusCliente(cliente.status_cliente || "Novo");
    setObservacoes(cliente.observacoes || "");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function excluirCliente(id: string) {
    if (!confirm("Deseja excluir este cliente?")) return;

    const user = await obterUsuarioLogado();
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[v0] Erro ao excluir cliente:", error);
      alert("Erro ao excluir cliente.");
      return;
    }

    if (editandoId === id) limparFormulario();
    carregarClientes();
  }

  function modeloWhatsappSalvo() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("giba_clientes_whatsapp_modelo") || "";
  }

  function montarMensagemAniversario(cliente: Cliente, modelo?: string) {
    const modeloBase =
      modelo ||
      modeloWhatsappSalvo() ||
      `Olá, {nome}! Tudo bem? Passando para te desejar um feliz aniversário e deixar uma condição especial para seu próximo evento com a GIBA/Vih Ribeiro. Se quiser, posso te enviar uma proposta personalizada.`;

    return modeloBase
      .replaceAll("{nome}", cliente.nome || "")
      .replaceAll("{telefone}", cliente.celular || "")
      .replaceAll("{email}", cliente.email || "")
      .replaceAll("{aniversario}", formatarAniversarioDiaMes(cliente.data_aniversario) || "")
      .replaceAll("{tipo}", cliente.tipo_cliente || "")
      .replaceAll("{status}", cliente.status_cliente || "");
  }

  function enviarMensagemAniversario(cliente: Cliente) {
    const telefoneBruto = cliente.celular || "";
    const telefoneComDdi = normalizarTelefoneWhatsApp(telefoneBruto);

    setWhatsappCliente(cliente);
    setWhatsappTelefone(telefoneComDdi || apenasNumeros(telefoneBruto));
    setWhatsappMensagem(montarMensagemAniversario(cliente));
    setWhatsappAviso(
      telefoneComDdi
        ? ""
        : "Telefone não encontrado ou incompleto. Digite o WhatsApp com DDD antes de enviar."
    );
  }

  function fecharModalWhatsapp() {
    setWhatsappCliente(null);
    setWhatsappTelefone("");
    setWhatsappMensagem("");
    setWhatsappAviso("");
  }

  function salvarModeloWhatsapp() {
    if (typeof window === "undefined") return;
    localStorage.setItem("giba_clientes_whatsapp_modelo", whatsappMensagem);
    alert("Modelo de mensagem salvo neste navegador.");
  }

  function confirmarEnvioWhatsapp() {
    if (!whatsappCliente) return;

    const telefoneComDdi = normalizarTelefoneWhatsApp(whatsappTelefone);

    if (!telefoneComDdi) {
      setWhatsappAviso("Telefone inválido. Digite com DDD, por exemplo: 31999999999.");
      return;
    }

    if (!whatsappMensagem.trim()) {
      setWhatsappAviso("A mensagem não pode ficar vazia.");
      return;
    }

    window.open(
      `https://wa.me/${telefoneComDdi}?text=${encodeURIComponent(whatsappMensagem)}`,
      "_blank"
    );

    fecharModalWhatsapp();
  }

  function criarEvento(cliente: Cliente) {
    const params = new URLSearchParams({
      cliente: cliente.nome || "",
      telefone: cliente.celular || "",
      endereco: cliente.endereco_completo || "",
      email: cliente.email || "",
    });

    window.location.href = `/agenda?${params.toString()}`;
  }

  /* ============================================================
     DADOS DERIVADOS
     ============================================================ */
  const mesAtual = new Date().getMonth();

  const aniversariantesMes = useMemo(
    () => clientes.filter((c) => mesDaData(c.data_aniversario) === mesAtual),
    [clientes, mesAtual]
  );

  const clientesAtivos = useMemo(
    () =>
      clientes.filter(
        (c) =>
          c.status_cliente === "Cliente ativo" ||
          c.status_cliente === "Recorrente"
      ).length,
    [clientes]
  );

  const clientesFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return clientes.filter((cliente) => {
      const correspondeBusca =
        termo === "" ||
        normalizarTexto(cliente.nome).includes(termo) ||
        normalizarTexto(cliente.cpf_cnpj).includes(termo) ||
        normalizarTexto(cliente.celular).includes(termo) ||
        normalizarTexto(cliente.email).includes(termo) ||
        normalizarTexto(cliente.endereco_completo).includes(termo);

      const correspondeTipo =
        filtroTipo === "todos" || cliente.tipo_cliente === filtroTipo;

      const correspondeStatus =
        filtroStatus === "todos" || cliente.status_cliente === filtroStatus;

      const correspondeAniversario =
        !apenasAniversariantes || mesDaData(cliente.data_aniversario) === mesAtual;

      return (
        correspondeBusca &&
        correspondeTipo &&
        correspondeStatus &&
        correspondeAniversario
      );
    });
  }, [clientes, busca, filtroTipo, filtroStatus, apenasAniversariantes, mesAtual]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="clientes">
        <AppLayout>
          <style>{`
            .clientes-scroll::-webkit-scrollbar { display: none; width: 0; height: 0; }
            .clientes-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          `}</style>
          <div style={pageStyle}>
            {/* HEADER */}
            <header style={headerStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={headerIconBoxStyle}>
                  <Users size={24} />
                </div>

                <div>
                  <h1 style={titleStyle}>Clientes</h1>
                  <p style={subtitleStyle}>
                    Cadastre, acompanhe e fortaleça o relacionamento com seus
                    contratantes.
                  </p>
                </div>
              </div>

              <div style={headerActionsStyle}>
                <button style={iconButtonStyle} aria-label="Notificações de aniversário">
                  <Bell size={18} />
                </button>
              </div>
            </header>

            {/* CARDS DE RESUMO */}
            <section style={metricsGridStyle}>
              <ResumoCard
                icon={<Users size={22} />}
                color="#8B35FF"
                label="Total de Clientes"
                value={clientes.length}
                detail="Base cadastrada"
              />
              <ResumoCard
                icon={<Cake size={22} />}
                color="#F59E0B"
                label="Aniversariantes do mês"
                value={aniversariantesMes.length}
                detail="Oportunidade de contato"
              />
              <ResumoCard
                icon={<CheckCircle2 size={22} />}
                color="#37E884"
                label="Clientes ativos"
                value={clientesAtivos}
                detail="Ativos + recorrentes"
              />
              <ResumoCard
                icon={<Sparkles size={22} />}
                color="#00AAFF"
                label="Potencial de relacionamento"
                value={Math.max(0, clientes.length - clientesAtivos)}
                detail="Para reativar / nutrir"
              />
            </section>

            {/* BANNER ANIVERSARIANTES */}
            {aniversariantesMes.length > 0 && (
              <section style={birthdayBannerStyle}>
                <div style={birthdayLeftStyle}>
                  <div style={birthdayIconStyle}>
                    <Gift size={26} />
                  </div>
                  <div>
                    <h2 style={birthdayTitleStyle}>Aniversariantes do mês</h2>
                    <p style={birthdayTextStyle}>
                      {aniversariantesMes.length}{" "}
                      {aniversariantesMes.length === 1
                        ? "cliente faz"
                        : "clientes fazem"}{" "}
                      aniversário este mês. Que tal enviar uma mensagem especial?
                    </p>
                  </div>
                </div>
                <button
                  style={birthdayButtonStyle}
                  onClick={() => {
                    setApenasAniversariantes(true);
                    setMostrarFiltros(true);
                  }}
                >
                  Ver aniversariantes
                  <ArrowRight size={16} />
                </button>
              </section>
            )}

            {/* LAYOUT PRINCIPAL */}
            <div
              style={{
                ...mainGridStyle,
                gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 420px) 1fr",
              }}
            >
              {/* FORMULÁRIO */}
              <section style={panelStyle}>
                <div style={panelHeaderStyle}>
                  <span style={panelIconStyle}>
                    <UserPlus size={18} />
                  </span>
                  <h2 style={panelTitleStyle}>
                    {editandoId ? "Editar Cliente" : "Cadastro Cliente"}
                  </h2>
                </div>

                <form onSubmit={salvarCliente} style={formStyle}>
                  <Campo label="Nome completo" obrigatorio>
                    <input
                      style={inputStyle}
                      placeholder="Digite o nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                    />
                  </Campo>

                  <Campo label="Tipo de cliente">
                    <div style={chipsRowStyle}>
                      {tipoClienteOptions.map((opcao) => {
                        const ativo = tipoCliente === opcao;
                        return (
                          <button
                            key={opcao}
                            type="button"
                            onClick={() => setTipoCliente(opcao)}
                            style={{
                              ...chipStyle,
                              ...(ativo ? chipAtivoStyle : {}),
                            }}
                          >
                            {opcao}
                          </button>
                        );
                      })}
                    </div>
                  </Campo>

                  <Campo label="CPF / CNPJ">
                    <input
                      style={inputStyle}
                      placeholder="000.000.000-00"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(formatarCpfCnpj(e.target.value))}
                      inputMode="numeric"
                    />
                  </Campo>

                  <Campo label="Celular">
                    <div style={celularRowStyle}>
                      <input
                        style={inputStyle}
                        placeholder="(31) 99357-5969"
                        value={celular}
                        onChange={(e) => setCelular(formatarCelular(e.target.value))}
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        aria-label="Testar WhatsApp"
                        style={whatsappMiniStyle}
                        onClick={() => {
                          const tel = normalizarTelefoneWhatsApp(celular);
                          if (!tel) {
                            alert("Digite um celular válido com DDD.");
                            return;
                          }
                          window.open(`https://wa.me/${tel}`, "_blank");
                        }}
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  </Campo>

                  <Campo label="E-mail">
                    <input
                      style={inputStyle}
                      type="email"
                      placeholder="email@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Campo>

                  <Campo label="Data de aniversário">
                    <input
                      style={inputStyle}
                      placeholder="dd/mm"
                      value={dataAniversario}
                      onChange={(e) =>
                        setDataAniversario(formatarAniversarioDiaMes(e.target.value))
                      }
                      inputMode="numeric"
                      maxLength={5}
                    />
                  </Campo>

                  <Campo label="Endereço completo">
                    <input
                      style={inputStyle}
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={enderecoCompleto}
                      onChange={(e) => setEnderecoCompleto(e.target.value)}
                    />
                  </Campo>

                  <Campo label="Origem do cliente">
                    <DropdownSelect
                      value={origemCliente}
                      placeholder="Selecione a origem"
                      options={origemClienteOptions.map((opcao) => ({ value: opcao, label: opcao }))}
                      onChange={setOrigemCliente}
                    />
                  </Campo>

                  <Campo label="Status">
                    <DropdownSelect
                      value={statusCliente}
                      placeholder="Selecione o status"
                      options={statusClienteOptions.map((opcao) => ({ value: opcao, label: opcao }))}
                      onChange={setStatusCliente}
                    />
                  </Campo>

                  <Campo label="Observações">
                    <textarea
                      style={{ ...inputStyle, minHeight: "92px", resize: "vertical" }}
                      placeholder="Observações internas..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </Campo>

                  <button type="submit" style={submitButtonStyle} disabled={salvando}>
                    <UserPlus size={18} />
                    {salvando
                      ? "Salvando..."
                      : editandoId
                      ? "Salvar Alterações"
                      : "Salvar Cliente"}
                  </button>

                  {editandoId && (
                    <button
                      type="button"
                      onClick={limparFormulario}
                      style={cancelButtonStyle}
                    >
                      Cancelar edição
                    </button>
                  )}
                </form>
              </section>

              {/* LISTA */}
              <section style={clientesColumnStyle}>
                {/* Busca + filtros */}
                <div style={searchPanelStyle}>
                  <div style={searchInputWrapStyle}>
                    <Search size={18} color="#94A3B8" />
                    <input
                      style={searchInputStyle}
                      placeholder="Buscar por nome, CPF/CNPJ, telefone ou e-mail..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                    />
                  </div>
                  <button
                    style={{
                      ...filterButtonStyle,
                      ...(mostrarFiltros ? filterButtonAtivoStyle : {}),
                    }}
                    onClick={() => setMostrarFiltros((v) => !v)}
                  >
                    <Filter size={16} />
                    Filtros
                  </button>
                </div>

                {mostrarFiltros && (
                  <div style={filtersBoxStyle}>
                    <div style={filterFieldStyle}>
                      <label style={filterLabelStyle}>Tipo</label>
                      <DropdownSelect
                        value={filtroTipo}
                        placeholder="Todos os tipos"
                        options={[
                          { value: "todos", label: "Todos os tipos" },
                          ...tipoClienteOptions.map((opcao) => ({ value: opcao, label: opcao })),
                        ]}
                        onChange={setFiltroTipo}
                      />
                    </div>

                    <div style={filterFieldStyle}>
                      <label style={filterLabelStyle}>Status</label>
                      <DropdownSelect
                        value={filtroStatus}
                        placeholder="Todos os status"
                        options={[
                          { value: "todos", label: "Todos os status" },
                          ...statusClienteOptions.map((opcao) => ({ value: opcao, label: opcao })),
                        ]}
                        onChange={setFiltroStatus}
                      />
                    </div>

                    <label style={checkboxRowStyle}>
                      <input
                        type="checkbox"
                        checked={apenasAniversariantes}
                        onChange={(e) => setApenasAniversariantes(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: "#8B35FF" }}
                      />
                      <span style={{ color: "#CBD5E1", fontSize: "14px" }}>
                        Apenas aniversariantes do mês
                      </span>
                    </label>

                    {(filtroTipo !== "todos" ||
                      filtroStatus !== "todos" ||
                      apenasAniversariantes) && (
                      <button
                        style={limparFiltrosStyle}
                        onClick={() => {
                          setFiltroTipo("todos");
                          setFiltroStatus("todos");
                          setApenasAniversariantes(false);
                        }}
                      >
                        <X size={14} />
                        Limpar filtros
                      </button>
                    )}
                  </div>
                )}

                {/* Cards de clientes */}
                <div className="clientes-scroll" style={clientesListContainerStyle}>
                  {carregando ? (
                    <div style={emptyStateStyle}>Carregando clientes...</div>
                  ) : clientesFiltrados.length === 0 ? (
                    <div style={emptyStateStyle}>
                      {clientes.length === 0
                        ? "Nenhum cliente cadastrado ainda. Cadastre o primeiro ao lado."
                        : "Nenhum cliente encontrado com os filtros atuais."}
                    </div>
                  ) : (
                    clientesFiltrados.map((cliente) => {
                      const aniversariante =
                        mesDaData(cliente.data_aniversario) === mesAtual;
                      return (
                        <article key={cliente.id} style={clienteCardStyle}>
                          <div style={clienteTopStyle}>
                            <div style={clienteIdentidadeStyle}>
                              <div
                                style={{
                                  ...avatarStyle,
                                  background: corAvatar(cliente.nome),
                                }}
                              >
                                {iniciais(cliente.nome)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={nomeLinhaStyle}>
                                  <h3 style={clienteNomeStyle}>{cliente.nome}</h3>
                                  {cliente.status_cliente && (
                                    <span
                                      style={{
                                        ...badgeStyle,
                                        color: corStatus(cliente.status_cliente),
                                        background: `${corStatus(
                                          cliente.status_cliente
                                        )}22`,
                                        border: `1px solid ${corStatus(
                                          cliente.status_cliente
                                        )}55`,
                                      }}
                                    >
                                      {cliente.status_cliente}
                                    </span>
                                  )}
                                  {cliente.tipo_cliente && (
                                    <span style={tipoBadgeStyle}>
                                      {cliente.tipo_cliente}
                                    </span>
                                  )}
                                </div>

                                <div style={infoLinhaStyle}>
                                  {cliente.cpf_cnpj && (
                                    <span style={infoItemStyle}>
                                      {cliente.cpf_cnpj}
                                    </span>
                                  )}
                                  {cliente.celular && (
                                    <span style={infoItemStyle}>
                                      <Phone size={13} /> {cliente.celular}
                                    </span>
                                  )}
                                  {cliente.email && (
                                    <span style={infoItemStyle}>
                                      <Mail size={13} /> {cliente.email}
                                    </span>
                                  )}
                                </div>

                                <div style={infoLinhaStyle}>
                                  {cliente.endereco_completo && (
                                    <span style={infoItemStyle}>
                                      <MapPin size={13} /> {cliente.endereco_completo}
                                    </span>
                                  )}
                                  {cliente.data_aniversario && (
                                    <span
                                      style={{
                                        ...infoItemStyle,
                                        color: aniversariante ? "#37E884" : "#94A3B8",
                                      }}
                                    >
                                      <Cake size={13} /> Aniversário:{" "}
                                      {formatarAniversarioDiaMes(cliente.data_aniversario)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={clienteAcoesStyle}>
                            <button
                              style={{ ...acaoButtonStyle, ...acaoWhatsappStyle }}
                              title="Enviar mensagem de aniversário/oferta"
                              onClick={() => enviarMensagemAniversario(cliente)}
                            >
                              <MessageCircle size={16} />
                            </button>
                            <button
                              style={{ ...acaoButtonStyle, ...acaoEventoStyle }}
                              title="Criar evento"
                              onClick={() => criarEvento(cliente)}
                            >
                              <CalendarPlus size={16} />
                            </button>
                            <button
                              style={{ ...acaoButtonStyle, ...acaoEditarStyle }}
                              title="Editar"
                              onClick={() => editarCliente(cliente)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              style={{ ...acaoButtonStyle, ...acaoExcluirStyle }}
                              title="Excluir"
                              onClick={() => excluirCliente(cliente.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>

                {!carregando && clientesFiltrados.length > 0 && (
                  <p style={contadorStyle}>
                    Mostrando {clientesFiltrados.length} de {clientes.length}{" "}
                    {clientes.length === 1 ? "cliente" : "clientes"}
                  </p>
                )}
              </section>
            </div>
          </div>


            {whatsappCliente && (
              <div style={modalOverlayStyle} onClick={fecharModalWhatsapp}>
                <div style={whatsappModalStyle} onClick={(e) => e.stopPropagation()}>
                  <div style={whatsappModalHeaderStyle}>
                    <div>
                      <p style={whatsappEyebrowStyle}>MENSAGEM AO CLIENTE</p>
                      <h2 style={whatsappTitleStyle}>Enviar WhatsApp</h2>
                      <p style={whatsappSubtitleStyle}>
                        Revise a mensagem antes de abrir o WhatsApp.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={fecharModalWhatsapp}
                      style={modalCloseButtonStyle}
                      aria-label="Fechar"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {whatsappAviso && (
                    <div style={whatsappWarningStyle}>{whatsappAviso}</div>
                  )}

                  <Campo label="WhatsApp do cliente">
                    <input
                      style={inputStyle}
                      value={whatsappTelefone}
                      onChange={(e) => setWhatsappTelefone(e.target.value)}
                      placeholder="Ex: 31999999999"
                      inputMode="numeric"
                    />
                  </Campo>

                  <Campo label="Mensagem">
                    <textarea
                      style={whatsappTextareaStyle}
                      value={whatsappMensagem}
                      onChange={(e) => setWhatsappMensagem(e.target.value)}
                      rows={9}
                    />
                  </Campo>

                  <div style={whatsappHelpStyle}>
                    Variáveis disponíveis para salvar no modelo: <strong>{"{nome}"}</strong>, <strong>{"{telefone}"}</strong>, <strong>{"{email}"}</strong>, <strong>{"{aniversario}"}</strong>, <strong>{"{tipo}"}</strong>, <strong>{"{status}"}</strong>.
                  </div>

                  <div style={whatsappActionsStyle}>
                    <button type="button" onClick={salvarModeloWhatsapp} style={cancelButtonStyle}>
                      Salvar modelo
                    </button>
                    <button type="button" onClick={fecharModalWhatsapp} style={cancelButtonStyle}>
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmarEnvioWhatsapp}
                      style={{ ...submitButtonStyle, marginTop: 0 }}
                    >
                      <MessageCircle size={18} />
                      Enviar WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            )}
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

/* ============================================================
   COMPONENTES AUXILIARES
   ============================================================ */
function Campo({
  label,
  obrigatorio,
  children,
}: {
  label: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: "7px" }}>
      <label style={campoLabelStyle}>
        {label}
        {obrigatorio && <span style={{ color: "#FF5B8A" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function DropdownSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selecionado = options.find((option) => option.value === value);

  return (
    <div style={dropdownContainerStyle}>
      <button
        type="button"
        onClick={() => setOpen((atual) => !atual)}
        style={dropdownTriggerStyle}
      >
        <span style={{ color: selecionado ? "#FFFFFF" : "#94A3B8" }}>
          {selecionado?.label || placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" />
      </button>

      {open && (
        <div style={dropdownMenuStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              style={{
                ...dropdownOptionStyle,
                ...(option.value === value ? dropdownOptionActiveStyle : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResumoCard({
  icon,
  color,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div style={resumoCardStyle}>
      <div
        style={{
          ...resumoIconStyle,
          background: `${color}22`,
          color,
          border: `1px solid ${color}44`,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={resumoLabelStyle}>{label}</p>
        <p style={resumoValorStyle}>{value}</p>
        <p style={resumoDetailStyle}>{detail}</p>
      </div>
    </div>
  );
}

/* ============================================================
   ESTILOS
   ============================================================ */
const pageStyle: React.CSSProperties = {
  color: "#FFFFFF",
  width: "100%",
  maxWidth: "1440px",
  margin: "0 auto",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px",
  marginBottom: "22px",
  flexWrap: "wrap",
};

const headerIconBoxStyle: React.CSSProperties = {
  width: "58px",
  height: "58px",
  minWidth: "58px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  color: "#fff",
  boxShadow: "0 14px 30px rgba(139,53,255,0.30)",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
  color: "#FFFFFF",
};

const subtitleStyle: React.CSSProperties = {
  margin: "9px 0 0",
  color: "#94A3B8",
  fontSize: "15px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};

const iconButtonStyle: React.CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#FFFFFF",
  fontWeight: 800,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 18px",
  cursor: "pointer",
  boxShadow: "0 15px 32px rgba(139,53,255,0.28)",
};

const metricsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const resumoCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "20px",
  padding: "18px",
  display: "flex",
  alignItems: "center",
  gap: "14px",
  boxShadow: "0 18px 40px rgba(0,0,0,0.22)",
};

const resumoIconStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  minWidth: "50px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const resumoLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#94A3B8",
  fontSize: "13px",
};

const resumoValorStyle: React.CSSProperties = {
  margin: "3px 0",
  fontSize: "26px",
  fontWeight: 800,
  color: "#FFFFFF",
  lineHeight: 1,
};

const resumoDetailStyle: React.CSSProperties = {
  margin: 0,
  color: "#64748B",
  fontSize: "12px",
};

const birthdayBannerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  background:
    "linear-gradient(90deg, rgba(245,158,11,0.16), rgba(139,53,255,0.10))",
  border: "1px solid rgba(245,158,11,0.32)",
  borderRadius: "20px",
  padding: "18px 22px",
  marginBottom: "22px",
};

const birthdayLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const birthdayIconStyle: React.CSSProperties = {
  width: "54px",
  height: "54px",
  minWidth: "54px",
  borderRadius: "16px",
  background: "rgba(245,158,11,0.20)",
  color: "#F59E0B",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const birthdayTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
  color: "#F59E0B",
};

const birthdayTextStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#CBD5E1",
  fontSize: "14px",
};

const birthdayButtonStyle: React.CSSProperties = {
  minHeight: "44px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.06)",
  color: "#FFFFFF",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 18px",
  cursor: "pointer",
};

const mainGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "20px",
  alignItems: "stretch",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "22px",
  boxShadow: "0 20px 45px rgba(0,0,0,0.25)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
};

const panelIconStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "rgba(139,53,255,0.18)",
  color: "#A974FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "15px",
};

const campoLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#CBD5E1",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.30)",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
};

const chipsRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
};

const chipStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)",
  color: "#CBD5E1",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const chipAtivoStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  border: "1px solid rgba(255,255,255,0.22)",
  color: "#FFFFFF",
  boxShadow: "0 10px 22px rgba(139,53,255,0.28)",
};

const celularRowStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
};

const whatsappMiniStyle: React.CSSProperties = {
  width: "48px",
  minWidth: "48px",
  borderRadius: "12px",
  border: "1px solid rgba(55,232,132,0.40)",
  background: "rgba(55,232,132,0.16)",
  color: "#37E884",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const submitButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  boxShadow: "0 15px 32px rgba(139,53,255,0.28)",
  marginTop: "4px",
};

const cancelButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};

const searchPanelStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  alignItems: "center",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "18px",
  padding: "10px 12px",
};

const searchInputWrapStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 6px",
};

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
};

const filterButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 16px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
};

const filterButtonAtivoStyle: React.CSSProperties = {
  background: "rgba(139,53,255,0.18)",
  border: "1px solid rgba(139,53,255,0.45)",
  color: "#fff",
};

const filtersBoxStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  flexWrap: "wrap",
  alignItems: "flex-end",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "18px",
  padding: "16px",
};

const filterFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "6px",
  minWidth: "180px",
  flex: 1,
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#94A3B8",
  fontWeight: 600,
};

const checkboxRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  cursor: "pointer",
  height: "46px",
};

const limparFiltrosStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "10px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,91,138,0.40)",
  background: "rgba(255,91,138,0.14)",
  color: "#FF8AAC",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
  height: "46px",
};

const clienteCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  flexWrap: "wrap",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "18px",
  padding: "18px",
};

const clienteTopStyle: React.CSSProperties = {
  flex: 1,
  minWidth: "260px",
};

const clienteIdentidadeStyle: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  alignItems: "flex-start",
};

const avatarStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  minWidth: "48px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontWeight: 800,
  fontSize: "15px",
};

const nomeLinhaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  flexWrap: "wrap",
};

const clienteNomeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 800,
  color: "#FFFFFF",
};

const badgeStyle: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
};

const tipoBadgeStyle: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#CBD5E1",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.14)",
};

const infoLinhaStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
  marginTop: "7px",
};

const infoItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  color: "#94A3B8",
  fontSize: "13px",
};

const clienteAcoesStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
};

const acaoButtonStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.10)",
};

const acaoWhatsappStyle: React.CSSProperties = {
  background: "rgba(55,232,132,0.16)",
  color: "#37E884",
  border: "1px solid rgba(55,232,132,0.36)",
};

const acaoEventoStyle: React.CSSProperties = {
  background: "rgba(0,170,255,0.16)",
  color: "#38BDF8",
  border: "1px solid rgba(0,170,255,0.36)",
};

const acaoEditarStyle: React.CSSProperties = {
  background: "rgba(139,53,255,0.16)",
  color: "#A974FF",
  border: "1px solid rgba(139,53,255,0.36)",
};

const acaoExcluirStyle: React.CSSProperties = {
  background: "rgba(255,91,138,0.16)",
  color: "#FF8AAC",
  border: "1px solid rgba(255,91,138,0.36)",
};

const emptyStateStyle: React.CSSProperties = {
  padding: "40px 20px",
  textAlign: "center",
  color: "#94A3B8",
  background: "rgba(255,255,255,0.04)",
  border: "1px dashed rgba(255,255,255,0.14)",
  borderRadius: "18px",
};

const contadorStyle: React.CSSProperties = {
  margin: "4px 2px 0",
  color: "#64748B",
  fontSize: "13px",
};


const dropdownContainerStyle: React.CSSProperties = {
  position: "relative",
  width: "100%",
};

const dropdownTriggerStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "46px",
  padding: "13px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.30)",
  color: "#fff",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  cursor: "pointer",
  textAlign: "left",
};

const dropdownMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  zIndex: 50,
  overflow: "hidden",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#0B1626",
  boxShadow: "0 18px 45px rgba(0,0,0,0.45)",
  padding: "6px",
};

const dropdownOptionStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: "#CBD5E1",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left",
};

const dropdownOptionActiveStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(139,53,255,0.35), rgba(0,170,255,0.22))",
  color: "#FFFFFF",
};

const clientesColumnStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  minHeight: 0,
};

const clientesListContainerStyle: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  maxHeight: "980px",
  overflowY: "auto",
  paddingRight: "2px",
  paddingBottom: "4px",
  borderRadius: "18px",
};

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.72)",
  backdropFilter: "blur(8px)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const whatsappModalStyle: React.CSSProperties = {
  width: "min(680px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(145deg, rgba(10,15,30,0.98), rgba(13,31,49,0.98))",
  boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
  padding: "24px",
  color: "#FFFFFF",
};

const whatsappModalHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "18px",
};

const whatsappEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "#37E884",
  fontSize: "11px",
  fontWeight: 900,
  letterSpacing: "0.08em",
};

const whatsappTitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "24px",
  fontWeight: 900,
};

const whatsappSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#94A3B8",
  fontSize: "14px",
};

const modalCloseButtonStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const whatsappWarningStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(245,158,11,0.35)",
  background: "rgba(245,158,11,0.12)",
  color: "#FBBF24",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "14px",
};

const whatsappTextareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: "220px",
  resize: "vertical",
  lineHeight: 1.55,
};

const whatsappHelpStyle: React.CSSProperties = {
  marginTop: "12px",
  padding: "12px 14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  color: "#94A3B8",
  fontSize: "12px",
  lineHeight: 1.5,
};

const whatsappActionsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1.4fr",
  gap: "10px",
  marginTop: "18px",
};

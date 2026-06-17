"use client"

import ProtectedRoute from "../../components/ProtectedRoute"
import PlanProtectedRoute from "../../components/PlanProtectedRoute"
import { useEffect, useMemo, useRef, useState } from "react"
import AppLayout from "../../components/AppLayout"
import { supabase } from "../../lib/supabase"
import { getEventStatus, getStageConfig, EVENT_STAGE_ORDER } from "../../lib/eventStatus"
import {
  Search,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Plus,
  CalendarCheck,
  Mic2,
  Users,
  DollarSign,
  CalendarRange,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  FileText,
  Wallet,
  Eye,
  MapPin,
  Clock,
  X,
  Lightbulb,
  ArrowRight,
  MessageCircle,
} from "lucide-react"

type Cliente = { id: string; nome: string; celular?: string | null; telefone?: string | null }
type Colaborador = { id: string; nome: string; funcao: string; status: string }
type FormatoShow = { id: string; nome: string }
type EventCollaborator = { event_id: string; collaborator_id: string }

type Evento = {
  id: string
  user_id?: string
  title: string
  event_type: string
  show_format: string
  client_name: string
  location: string
  event_date: string
  event_time: string
  show_duration: string
  fee: number
  payment_format: string
  status: string
  notes: string
}

type Vista = "mes" | "semana" | "lista"

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const statusEventoOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "proximo", label: "Próximo" },
  { value: "realizado", label: "Realizado" },
]

const tipoEventoOptions = [
  { value: "Show", label: "Show" },
  { value: "Evento Privado", label: "Evento Privado" },
  { value: "Ensaio", label: "Ensaio" },
  { value: "Reunião", label: "Reunião" },
  { value: "Viagem", label: "Viagem" },
  { value: "Bloqueio de Data", label: "Bloqueio de Data" },
]

const pagamentoOptions = [
  { value: "Sinal de 50% e o restante na data do evento", label: "Sinal de 50% e o restante na data do evento" },
  { value: "Pagamento Integral", label: "Pagamento Integral" },
  { value: "Pagamento após o evento", label: "Pagamento após o evento" },
]

function limparCep(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 8)
}

function normalizarTexto(valor: string) {
  return (valor || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

function separarEnderecoNumero(endereco: string) {
  const texto = (endereco || "").trim()

  const match = texto.match(/^(.*?)(?:,\s*(?:n[ºo°]?|numero|número)\s*\.?\s*:?\s*)([^,]+)$/i)

  if (!match) {
    return { enderecoBase: texto, numero: "" }
  }

  return {
    enderecoBase: match[1].trim().replace(/,\s*$/, ""),
    numero: match[2].trim(),
  }
}

function montarEnderecoCompleto(endereco: string, numero: string) {
  const baseSemNumero = separarEnderecoNumero(endereco).enderecoBase || endereco.trim()
  const numeroLimpo = numero.trim()

  if (!numeroLimpo) return endereco.trim()

  return `${baseSemNumero}, Nº ${numeroLimpo}`
}


function ymd(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${dia}`
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function iniciais(nome: string) {
  const partes = nome.trim().split(" ").filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function statusParaExibicaoEvento(evento: { status?: string; event_date: string }) {
  const statusManual = (evento.status || "").toLowerCase()


  const hoje = new Date()
  const dataEvento = new Date(`${evento.event_date}T00:00:00`)
  hoje.setHours(0, 0, 0, 0)
  dataEvento.setHours(0, 0, 0, 0)

  // Um dia após a data do evento, ele passa a ser exibido como realizado automaticamente.
  if (dataEvento.getTime() < hoje.getTime()) return "realizado"

  return statusManual || "pendente"
}

export default function AgendaPage() {
  const hoje = useMemo(() => new Date(), [])
  const hojeStr = ymd(hoje)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const verificarTela = () => setIsMobile(window.innerWidth <= 1100)
    verificarTela()
    window.addEventListener("resize", verificarTela)
    return () => window.removeEventListener("resize", verificarTela)
  }, [])

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [formatos, setFormatos] = useState<FormatoShow[]>([])
  const [eventCollaborators, setEventCollaborators] = useState<EventCollaborator[]>([])
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<string[]>([])

  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const [mesAtual, setMesAtual] = useState(hoje.getMonth())
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear())
  const [diaSelecionado, setDiaSelecionado] = useState(hojeStr)
  const [vista, setVista] = useState<Vista>("mes")
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("todos")
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [formAberto, setFormAberto] = useState(true)

  // Campos do formulário
  const [clientName, setClientName] = useState("")
  const [eventType, setEventType] = useState("Show")
  const [showFormat, setShowFormat] = useState("")
  const [location, setLocation] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [showDuration, setShowDuration] = useState("")
  const [fee, setFee] = useState("")
  const [paymentFormat, setPaymentFormat] = useState("Sinal de 50% e o restante na data do evento")
  const [notes, setNotes] = useState("")
  const [eventStatusManual, setEventStatusManual] = useState("pendente")
  const [cep, setCep] = useState("")
  const [numeroEndereco, setNumeroEndereco] = useState("")
  const [cepLoading, setCepLoading] = useState(false)
  const [whatsappEvento, setWhatsappEvento] = useState<Evento | null>(null)
  const [whatsappTelefone, setWhatsappTelefone] = useState("")
  const [whatsappMensagem, setWhatsappMensagem] = useState("")
  const [whatsappAviso, setWhatsappAviso] = useState("")

  const diasCalendario = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay()
    const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate()
    const dias: Array<number | null> = []
    for (let i = 0; i < primeiroDia; i++) dias.push(null)
    for (let dia = 1; dia <= totalDias; dia++) dias.push(dia)
    return dias
  }, [mesAtual, anoAtual])

  useEffect(() => {
    carregarClientes()
    carregarFormatos()
    carregarColaboradores()
    carregarEventos()
    carregarVinculos()
  }, [])

  // Se o dia selecionado não tiver eventos, foca automaticamente no próximo
  // dia com eventos (a partir de hoje), para o painel não iniciar vazio.
  const jaAutoSelecionou = useRef(false)
  useEffect(() => {
    if (jaAutoSelecionou.current) return
    if (eventos.length === 0) return
    const temHoje = eventos.some((e) => e.event_date === diaSelecionado)
    if (temHoje) {
      jaAutoSelecionou.current = true
      return
    }
    const proximos = eventos
      .map((e) => e.event_date)
      .filter((d) => d >= diaSelecionado)
      .sort()
    const alvo = proximos[0] || [...eventos.map((e) => e.event_date)].sort().reverse()[0]
    if (alvo) {
      const [a, m] = alvo.split("-").map(Number)
      setAnoAtual(a)
      setMesAtual(m - 1)
      setDiaSelecionado(alvo)
    }
    jaAutoSelecionou.current = true
  }, [eventos, diaSelecionado])

  async function obterUsuarioLogado() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error("Erro ao buscar usuário logado:", error)
      return null
    }
    return user
  }

  function formatarData(dia: number) {
    const mes = String(mesAtual + 1).padStart(2, "0")
    const diaFormatado = String(dia).padStart(2, "0")
    return `${anoAtual}-${mes}-${diaFormatado}`
  }

  async function carregarClientes() {
    const user = await obterUsuarioLogado()
    if (!user) return setClientes([])
    const { data, error } = await supabase
      .from("clients").select("id, nome, celular").eq("user_id", user.id).order("nome", { ascending: true })
    if (error) return setClientes([])
    setClientes(data || [])
  }

  async function carregarFormatos() {
    const user = await obterUsuarioLogado()
    if (!user) return setFormatos([])
    const { data, error } = await supabase
      .from("show_formats").select("id, nome").eq("user_id", user.id).order("nome", { ascending: true })
    if (error) return setFormatos([])
    setFormatos(data || [])
  }

  async function carregarColaboradores() {
    const user = await obterUsuarioLogado()
    if (!user) return setColaboradores([])
    const { data, error } = await supabase
      .from("collaborators").select("id, nome, funcao, status").eq("user_id", user.id).eq("status", "Ativo").order("nome", { ascending: true })
    if (error) return setColaboradores([])
    setColaboradores(data || [])
  }

  async function carregarEventos() {
    const user = await obterUsuarioLogado()
    if (!user) return setEventos([])
    const { data, error } = await supabase
      .from("events").select("*").eq("user_id", user.id).order("event_date", { ascending: true })
    if (error) return setEventos([])
    setEventos(data || [])
  }

  async function carregarVinculos() {
    const user = await obterUsuarioLogado()
    if (!user) return setEventCollaborators([])
    const { data: eventosDoUsuario } = await supabase.from("events").select("id").eq("user_id", user.id)
    const eventIds = (eventosDoUsuario || []).map((e: any) => e.id)
    if (eventIds.length === 0) return setEventCollaborators([])
    const { data, error } = await supabase
      .from("event_collaborators").select("event_id, collaborator_id").in("event_id", eventIds)
    if (error) return setEventCollaborators([])
    setEventCollaborators(data || [])
  }

  function limparFormulario() {
    setEditandoId(null)
    setClientName("")
    setEventType("Show")
    setShowFormat("")
    setLocation("")
    setEventTime("")
    setShowDuration("")
    setFee("")
    setPaymentFormat("Sinal de 50% e o restante na data do evento")
    setNotes("")
    setEventStatusManual("pendente")
    setCep("")
    setNumeroEndereco("")
    setColaboradoresSelecionados([])
  }

  function alternarColaborador(id: string) {
    setColaboradoresSelecionados((atual) =>
      atual.includes(id) ? atual.filter((i) => i !== id) : [...atual, id],
    )
  }

  function colaboradoresDoEvento(eventId: string) {
    const ids = eventCollaborators.filter((i) => i.event_id === eventId).map((i) => i.collaborator_id)
    return colaboradores.filter((c) => ids.includes(c.id))
  }

  async function salvarVinculosEvento(eventId: string) {
    await supabase.from("event_collaborators").delete().eq("event_id", eventId)
    if (colaboradoresSelecionados.length > 0) {
      const vinculos = colaboradoresSelecionados.map((collaboratorId) => ({
        event_id: eventId,
        collaborator_id: collaboratorId,
      }))
      await supabase.from("event_collaborators").insert(vinculos)
    }
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault()
    const user = await obterUsuarioLogado()
    if (!user) return alert("Usuário não encontrado. Faça login novamente.")
    if (!diaSelecionado) return alert("Selecione uma data no calendário.")
    if (!clientName) return alert("Selecione um cliente.")

    const dados = {
      user_id: user.id,
      title: `${eventType} - ${clientName}`,
      event_type: eventType,
      show_format: showFormat,
      client_name: clientName,
      location: montarEnderecoCompleto(location, numeroEndereco),
      event_date: diaSelecionado,
      event_time: eventTime,
      show_duration: showDuration,
      fee: fee ? Number(fee) : 0,
      payment_format: paymentFormat,
      status: eventStatusManual || "pendente",
      notes,
    }

    if (editandoId) {
      const { error } = await supabase.from("events").update(dados).eq("id", editandoId).eq("user_id", user.id)
      if (error) return alert("Erro ao atualizar evento.")
      await salvarVinculosEvento(editandoId)
    } else {
      const { data, error } = await supabase.from("events").insert(dados).select().single()
      if (error || !data) return alert("Erro ao cadastrar evento.")
      await salvarVinculosEvento(data.id)
    }

    limparFormulario()
    await carregarEventos()
    await carregarVinculos()
  }

  function eventosDoDia(data: string) {
    return eventos
      .filter((e) => e.event_date === data)
      .filter((e) => (filtroStatus === "todos" ? true : statusParaExibicaoEvento(e) === filtroStatus))
      .filter((e) =>
        busca.trim() === ""
          ? true
          : (e.title + e.client_name + e.location).toLowerCase().includes(busca.toLowerCase()),
      )
      .sort((a, b) => a.event_time.localeCompare(b.event_time))
  }

  function abrirDetalhes(evento: Evento) {
    setEventoSelecionado(evento)
  }

  function editarEvento(evento: Evento) {
    setEditandoId(evento.id)
    setClientName(evento.client_name)
    setEventType(evento.event_type)
    setShowFormat(evento.show_format)
    const enderecoSeparado = separarEnderecoNumero(evento.location)
    setLocation(enderecoSeparado.enderecoBase)
    setNumeroEndereco(enderecoSeparado.numero)
    setEventTime(evento.event_time)
    setShowDuration(evento.show_duration)
    setFee(String(evento.fee || ""))
    setPaymentFormat(evento.payment_format)
    setNotes(evento.notes)
    setEventStatusManual(evento.status || "pendente")
    setCep("")
    setDiaSelecionado(evento.event_date)
    setColaboradoresSelecionados(colaboradoresDoEvento(evento.id).map((c) => c.id))
    setEventoSelecionado(null)
    setFormAberto(true)
  }

  async function excluirEvento(id: string) {
    const user = await obterUsuarioLogado()
    if (!user) return
    if (!confirm("Tem certeza que deseja excluir este evento?")) return
    await supabase.from("event_collaborators").delete().eq("event_id", id)
    await supabase.from("events").delete().eq("id", id).eq("user_id", user.id)
    setEventoSelecionado(null)
    await carregarEventos()
    await carregarVinculos()
  }


  function buscarClienteDoEvento(evento: Evento) {
    return clientes.find((cliente) => normalizarTexto(cliente.nome) === normalizarTexto(evento.client_name))
  }

  function normalizarTelefoneWhatsApp(telefone: string) {
    let limpo = telefone.replace(/\D/g, "")

    // Se vier com 0 na frente, remove. Ex.: 031999999999
    if (limpo.startsWith("0")) limpo = limpo.replace(/^0+/, "")

    // Com DDI Brasil completo: 55 + DDD + número
    if (limpo.startsWith("55") && limpo.length >= 12) return limpo

    // Sem DDI: DDD + número, normalmente 10 ou 11 dígitos
    if (!limpo.startsWith("55") && (limpo.length === 10 || limpo.length === 11)) {
      return `55${limpo}`
    }

    return ""
  }

  function montarMensagemConfirmacao(evento: Evento) {
    const dataFormatada = new Date(evento.event_date + "T00:00:00").toLocaleDateString("pt-BR")

    return (
      `Olá, ${evento.client_name}! Tudo bem?\n\n` +
      `Passando para confirmar os dados do evento:\n\n` +
      `📅 Data: ${dataFormatada}\n` +
      `🕒 Horário: ${evento.event_time || "A confirmar"}\n` +
      `🎤 Formato: ${evento.show_format || evento.event_type || "A confirmar"}\n` +
      `📍 Local: ${evento.location || "A confirmar"}\n` +
      `💰 Cachê: ${formatarMoeda(evento.fee || 0)}\n` +
      `💳 Pagamento: ${evento.payment_format || "A confirmar"}\n\n` +
      `Qualquer ajuste, fico à disposição.\n\n` +
      `Vih Ribeiro\nEnergia que Contagia 🔥`
    )
  }

  function modeloWhatsappSalvo() {
    if (typeof window === "undefined") return ""
    return localStorage.getItem("giba_whatsapp_confirmacao_modelo") || ""
  }

  function aplicarModeloWhatsapp(evento: Evento, modelo?: string) {
    const dataFormatada = new Date(evento.event_date + "T00:00:00").toLocaleDateString("pt-BR")
    const modeloBase =
      modelo ||
      modeloWhatsappSalvo() ||
      montarMensagemConfirmacao(evento)

    return modeloBase
      .replaceAll("{cliente}", evento.client_name || "")
      .replaceAll("{data}", dataFormatada)
      .replaceAll("{horario}", evento.event_time || "A confirmar")
      .replaceAll("{formato}", evento.show_format || evento.event_type || "A confirmar")
      .replaceAll("{local}", evento.location || "A confirmar")
      .replaceAll("{cache}", formatarMoeda(evento.fee || 0))
      .replaceAll("{pagamento}", evento.payment_format || "A confirmar")
  }

  function enviarWhatsAppConfirmacao(evento: Evento) {
    const cliente = buscarClienteDoEvento(evento)
    const telefoneBruto = cliente?.celular || cliente?.telefone || ""
    const telefoneComDdi = normalizarTelefoneWhatsApp(telefoneBruto)

    setWhatsappEvento(evento)
    setWhatsappTelefone(telefoneComDdi || telefoneBruto.replace(/\D/g, ""))
    setWhatsappMensagem(aplicarModeloWhatsapp(evento))
    setWhatsappAviso(
      telefoneComDdi
        ? ""
        : "Telefone não encontrado ou incompleto. Digite o WhatsApp com DDD antes de enviar."
    )
  }

  function fecharModalWhatsapp() {
    setWhatsappEvento(null)
    setWhatsappTelefone("")
    setWhatsappMensagem("")
    setWhatsappAviso("")
  }

  function salvarModeloWhatsapp() {
    if (typeof window === "undefined") return
    localStorage.setItem("giba_whatsapp_confirmacao_modelo", whatsappMensagem)
    setWhatsappAviso("Modelo salvo neste navegador. Você pode usar este texto nos próximos envios.")
  }

  function confirmarEnvioWhatsapp() {
    if (!whatsappEvento) return

    const telefoneComDdi = normalizarTelefoneWhatsApp(whatsappTelefone)

    if (!telefoneComDdi) {
      setWhatsappAviso("Telefone inválido. Digite com DDD, por exemplo: 31999999999.")
      return
    }

    if (!whatsappMensagem.trim()) {
      setWhatsappAviso("A mensagem não pode ficar vazia.")
      return
    }

    const mensagem = encodeURIComponent(whatsappMensagem)
    window.open(`https://wa.me/${telefoneComDdi}?text=${mensagem}`, "_blank")
    fecharModalWhatsapp()
  }

  function gerarContrato(evento: Evento) {
    window.location.href = `/contratos?eventId=${evento.id}`
  }

  async function atualizarStatusEvento(evento: Evento, novoStatus: "pendente" | "proximo" | "realizado") {
    const user = await obterUsuarioLogado()
    if (!user) return

    const { error } = await supabase
      .from("events")
      .update({ status: novoStatus })
      .eq("id", evento.id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Erro ao atualizar status do evento:", error)
      alert("Erro ao atualizar status do evento.")
      return
    }

    setEventoSelecionado({ ...evento, status: novoStatus })
    await carregarEventos()
  }

  async function lancarReceita(evento: Evento) {
    await atualizarStatusEvento(evento, "proximo")
    window.location.href = `/financeiro?eventId=${evento.id}`
  }

  async function buscarCep() {
    const cepLimpo = limparCep(cep)

    if (cepLimpo.length !== 8) {
      alert("Digite um CEP válido com 8 números.")
      return
    }

    try {
      setCepLoading(true)

      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const dadosCep = await resposta.json()

      if (dadosCep.erro) {
        alert("CEP não encontrado.")
        return
      }

      const endereco = [
        dadosCep.logradouro,
        dadosCep.bairro,
        dadosCep.localidade,
        dadosCep.uf,
      ]
        .filter(Boolean)
        .join(", ")

      setLocation(endereco)
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
      alert("Não foi possível buscar o CEP agora.")
    } finally {
      setCepLoading(false)
    }
  }

  // ---- Navegação ----
  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11)
      setAnoAtual((a) => a - 1)
    } else setMesAtual((m) => m - 1)
  }
  function mesProximo() {
    if (mesAtual === 11) {
      setMesAtual(0)
      setAnoAtual((a) => a + 1)
    } else setMesAtual((m) => m + 1)
  }
  function irParaHoje() {
    setMesAtual(hoje.getMonth())
    setAnoAtual(hoje.getFullYear())
    setDiaSelecionado(hojeStr)
  }

  // ---- Métricas ----
  const eventosDoMes = useMemo(
    () =>
      eventos.filter((e) => {
        const d = new Date(e.event_date + "T00:00:00")
        return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
      }),
    [eventos, mesAtual, anoAtual],
  )

  const eventosFuturos = useMemo(
    () =>
      eventos
        .filter((e) => e.event_date >= hojeStr)
        .sort((a, b) => (a.event_date + a.event_time).localeCompare(b.event_date + b.event_time)),
    [eventos, hojeStr],
  )

  const metricas = useMemo(() => {
    const realizadosMes = eventosDoMes.filter((e) => statusParaExibicaoEvento(e) === "realizado").length
    const pendentesMes = eventosDoMes.filter((e) => statusParaExibicaoEvento(e) === "pendente").length
    const escalados = new Set(
      eventosDoMes.flatMap((e) => colaboradoresDoEvento(e.id).map((c) => c.id)),
    ).size
    const faturamento = eventosFuturos.reduce((s, e) => s + (e.fee || 0), 0)

    return {
      totalMes: eventosDoMes.length,
      realizadosMes,
      pendentesMes,
      escalados,
      faturamento,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventosDoMes, eventosFuturos, eventCollaborators, colaboradores, eventos])

  const eventosDoDiaSelecionado = eventosDoDia(diaSelecionado)

  // ---- semana da data selecionada ----
  const diasDaSemana = useMemo(() => {
    const base = new Date(diaSelecionado + "T00:00:00")
    const inicio = new Date(base)
    inicio.setDate(base.getDate() - base.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      return d
    })
  }, [diaSelecionado])

  const eventosFiltradosLista = useMemo(
    () =>
      eventosDoMes
        .filter((e) => (filtroStatus === "todos" ? true : statusParaExibicaoEvento(e) === filtroStatus))
        .filter((e) =>
          busca.trim() === ""
            ? true
            : (e.title + e.client_name + e.location).toLowerCase().includes(busca.toLowerCase()),
        )
        .sort((a, b) => (a.event_date + a.event_time).localeCompare(b.event_date + b.event_time)),
    [eventosDoMes, filtroStatus, busca],
  )

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="agenda">
        <AppLayout>
          {/* ===== HEADER ===== */}
          <div style={isMobile ? mobileHeaderRow : headerRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={headerIconBox}>
                <CalendarDays size={24} />
              </div>
              <div>
                <h1 style={pageTitle}>Agenda</h1>
                <p style={pageSubtitle}>Organize seus shows, compromissos e equipe.</p>
              </div>
            </div>

            <div style={isMobile ? mobileHeaderActions : { display: "flex", alignItems: "center", gap: 10 }}>
              <button style={iconButton} aria-label="Buscar">
                <Search size={18} />
              </button>
              <button style={{ ...iconButton, position: "relative" }} aria-label="Notificações">
                <Bell size={18} />
                <span style={notifBadge}>3</span>
              </button>
              <button style={iconButton} aria-label="Abrir calendário">
                <CalendarDays size={18} />
              </button>
              <div style={datePill}>
                <CalendarDays size={16} />
                {hoje.getDate()} de {meses[hoje.getMonth()]}, {hoje.getFullYear()}
              </div>
            </div>
          </div>

          {/* ===== TOOLBAR ===== */}
          <div style={isMobile ? mobileToolbarRow : toolbarRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={navGroup}>
                <button onClick={mesAnterior} style={navArrow} aria-label="Mês anterior">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={mesProximo} style={navArrow} aria-label="Próximo mês">
                  <ChevronRight size={18} />
                </button>
              </div>
              <button onClick={irParaHoje} style={ghostButton}>
                Hoje
              </button>
              <div style={monthPill}>
                {meses[mesAtual]}, {anoAtual}
                <ChevronDown size={16} />
              </div>
            </div>

            <div style={viewToggle}>
              {(["mes", "semana", "lista"] as Vista[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  style={{ ...viewToggleBtn, ...(vista === v ? viewToggleActive : {}) }}
                >
                  {v === "mes" ? "Mês" : v === "semana" ? "Semana" : "Lista"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setMostrarFiltros((m) => !m)}
                style={{ ...ghostButton, display: "flex", alignItems: "center", gap: 8 }}
              >
                <SlidersHorizontal size={16} />
                Filtros
              </button>
              <div style={isMobile ? mobileSearchBox : searchBox}>
                <Search size={16} color="#94A3B8" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar eventos..."
                  style={searchInput}
                />
              </div>

            </div>
          </div>

          {mostrarFiltros && (
            <div style={filtrosBar}>
              <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 700 }}>Status:</span>
              {["todos", ...EVENT_STAGE_ORDER].map((s) => {
                const ativo = filtroStatus === s
                const cfg = s === "todos" ? null : getStageConfig(s)
                return (
                  <button
                    key={s}
                    onClick={() => setFiltroStatus(s)}
                    style={{
                      ...chipButton,
                      ...(ativo
                        ? { background: cfg?.color || "#8B35FF", color: cfg?.text || "#fff", border: "1px solid transparent" }
                        : {}),
                    }}
                  >
                    {s === "todos" ? "Todos" : cfg?.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* ===== MÉTRICAS ===== */}
          <div style={isMobile ? mobileMetricsGrid : metricsGrid}>
            <MetricCard
              icon={<CalendarCheck size={20} />}
              tint="#8B35FF"
              value={String(metricas.totalMes)}
              label="Eventos este mês"
              trend="+20% vs Maio"
            />
            <MetricCard
              icon={<Mic2 size={20} />}
              tint="#22C55E"
              value={String(metricas.realizadosMes)}
              label="Shows realizados"
              trend="Automático após a data"
              trendPlain
            />
            <MetricCard
              icon={<CalendarRange size={20} />}
              tint="#F59E0B"
              value={String(metricas.pendentesMes)}
              label="Pendentes"
              trend="Aguardando sinal"
              trendPlain
            />
            <MetricCard
              icon={<Users size={20} />}
              tint="#EC4899"
              value={String(metricas.escalados)}
              label="Colaboradores escalados"
              trend="Equipe do mês"
              trendPlain
            />
            <MetricCard
              icon={<DollarSign size={20} />}
              tint="#22C55E"
              value={formatarMoeda(metricas.faturamento)}
              label="Faturamento previsto"
              trend="Eventos futuros"
              trendPlain
            />
          </div>

          {/* ===== CONTEÚDO PRINCIPAL ===== */}
          <div style={isMobile ? mobileMainGrid : mainGrid}>
            {/* Coluna esquerda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
              <div style={isMobile ? mobileCalendarCard : calendarCard}>
                {vista === "mes" && (
                  <>
                    <div style={isMobile ? mobileWeekHeader : weekHeader}>
                      {diasSemana.map((d) => (
                        <div key={d} style={weekHeaderCell}>
                          {d}
                        </div>
                      ))}
                    </div>
                    <div style={isMobile ? mobileMonthGrid : monthGrid}>
                      {diasCalendario.map((dia, idx) => {
                        if (dia === null) return <div key={`v-${idx}`} style={emptyCell} />
                        const dataStr = formatarData(dia)
                        const doDia = eventosDoDia(dataStr)
                        const ehHoje = dataStr === hojeStr
                        const selecionado = dataStr === diaSelecionado
                        const primeiro = doDia[0]
                        return (
                          <button
                            key={dataStr}
                            onClick={() => setDiaSelecionado(dataStr)}
                            style={{
                              ...(isMobile ? mobileDayCell : dayCell),
                              ...(selecionado ? dayCellSelected : {}),
                            }}
                          >
                            <span style={{ ...dayNumber, ...(ehHoje ? dayNumberToday : {}) }}>{dia}</span>
                            {primeiro && (
                              <div
                                onClick={(ev) => {
                                  ev.stopPropagation()
                                  abrirDetalhes(primeiro)
                                }}
                                style={{ ...eventChip, borderLeft: `3px solid ${getStageConfig(statusParaExibicaoEvento(primeiro)).color}` }}
                              >
                                <div style={chipTime}>{primeiro.event_time}</div>
                                <div style={chipTitle}>{primeiro.show_format || primeiro.event_type || primeiro.title.replace(/^Show - /, "")}</div>
                                <span
                                  style={{
                                    ...statusBadge,
                                    background: getStageConfig(statusParaExibicaoEvento(primeiro)).soft,
                                    color: getStageConfig(statusParaExibicaoEvento(primeiro)).color,
                                  }}
                                >
                                  {getStageConfig(statusParaExibicaoEvento(primeiro)).label}
                                </span>
                              </div>
                            )}
                            {doDia.length > 1 && (
                              <span style={maisEventos}>+{doDia.length - 1} evento{doDia.length - 1 > 1 ? "s" : ""}</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}

                {vista === "semana" && (
                  <div style={isMobile ? mobileWeekGrid : monthGrid}>
                    {diasDaSemana.map((d) => {
                      const dataStr = ymd(d)
                      const doDia = eventosDoDia(dataStr)
                      const selecionado = dataStr === diaSelecionado
                      const ehHoje = dataStr === hojeStr
                      return (
                        <button
                          key={dataStr}
                          onClick={() => setDiaSelecionado(dataStr)}
                          style={{ ...(isMobile ? mobileDayCell : dayCell), minHeight: isMobile ? 150 : 220, ...(selecionado ? dayCellSelected : {}) }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, marginBottom: 8 }}>
                            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{diasSemana[d.getDay()]}</span>
                            <span style={{ ...dayNumber, ...(ehHoje ? dayNumberToday : {}) }}>{d.getDate()}</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
                            {doDia.map((ev) => (
                              <div
                                key={ev.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  abrirDetalhes(ev)
                                }}
                                style={{ ...eventChip, borderLeft: `3px solid ${getStageConfig(statusParaExibicaoEvento(ev)).color}` }}
                              >
                                <div style={chipTime}>{ev.event_time}</div>
                                <div style={chipTitle}>{ev.show_format || ev.event_type || ev.title.replace(/^Show - /, "")}</div>
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {vista === "lista" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {eventosFiltradosLista.length === 0 && (
                      <p style={{ color: "#94A3B8", textAlign: "center", padding: 28 }}>
                        Nenhum evento encontrado neste mês.
                      </p>
                    )}
                    {eventosFiltradosLista.map((ev) => (
                      <EventoLinha
                        key={ev.id}
                        evento={ev}
                        colaboradores={colaboradoresDoEvento(ev.id)}
                        onDetalhes={() => abrirDetalhes(ev)}
                      />
                    ))}
                  </div>
                )}

                {/* Legenda */}
                <div style={legendaRow}>
                  {EVENT_STAGE_ORDER.map((s) => {
                    const cfg = getStageConfig(s)
                    return (
                      <div key={s} style={legendaItem}>
                        <span style={{ ...legendaDot, background: cfg.color }} />
                        {cfg.label}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Próximos eventos */}
              <div style={panelCard}>
                <div style={panelHeader}>
                  <div style={isMobile ? mobileHeaderActions : { display: "flex", alignItems: "center", gap: 10 }}>
                    <CalendarRange size={18} color="#00AAFF" />
                    <h2 style={panelTitle}>Próximos Eventos</h2>
                  </div>
                  <button style={verTodosBtn}>
                    Ver todos <ArrowRight size={14} />
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {eventosFuturos.slice(0, 4).map((ev) => (
                    <EventoLinha
                      key={ev.id}
                      evento={ev}
                      colaboradores={colaboradoresDoEvento(ev.id)}
                      onDetalhes={() => abrirDetalhes(ev)}
                    />
                  ))}
                  {eventosFuturos.length === 0 && (
                    <p style={{ color: "#94A3B8", padding: 12 }}>Nenhum evento futuro agendado.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna direita */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Eventos do dia */}
              <div style={panelCard}>
                <div style={panelHeader}>
                  <div style={isMobile ? mobileHeaderActions : { display: "flex", alignItems: "center", gap: 10 }}>
                    <CalendarCheck size={18} color="#8B35FF" />
                    <div>
                      <h2 style={panelTitle}>Eventos do dia</h2>
                      <p style={panelSub}>
                        {new Date(diaSelecionado + "T00:00:00").getDate()} de{" "}
                        {meses[new Date(diaSelecionado + "T00:00:00").getMonth()]}
                      </p>
                    </div>
                  </div>
                  <span style={countBadge}>{eventosDoDiaSelecionado.length}</span>
                </div>

                <div style={eventosDoDiaList}>
                  {eventosDoDiaSelecionado.length === 0 && (
                    <p style={emptyDayText}>
                      Nenhum evento nesta data. Selecione outro dia no calendário.
                    </p>
                  )}

                  {eventosDoDiaSelecionado.map((ev) => {
                    const cfg = getStageConfig(statusParaExibicaoEvento(ev))
                    return (
                      <div key={ev.id} style={isMobile ? mobileEventoDoDiaCardPremium : eventoDoDiaCardPremium}>
                        <div style={eventoDoDiaTopRow}>
                          <div style={eventoDoDiaTitleGroup}>
                            <span style={{ ...horaDot, background: cfg.color }} />

                            <div style={{ minWidth: 0 }}>
                              <p style={eventoDoDiaTitulo}>
                                {ev.event_time} · {ev.show_format || ev.event_type || ev.title.replace(/^Show - /, "")}
                              </p>
                              <p style={eventoDoDiaCliente}>{ev.client_name}</p>
                              <p style={eventoDoDiaLocal}>{ev.location}</p>
                            </div>
                          </div>

                          <button style={miniIconBtn} aria-label="Mais opções" onClick={() => abrirDetalhes(ev)}>
                            <MoreVertical size={16} />
                          </button>
                        </div>

                        <div style={eventoDoDiaMetaRow}>
                          <span style={{ ...statusBadge, background: cfg.soft, color: cfg.color }}>
                            {cfg.label}
                          </span>

                          <AvatarStack pessoas={colaboradoresDoEvento(ev.id)} />
                        </div>

                        <div style={eventoDoDiaActionsGrid}>
                          <button style={acaoButton} onClick={() => abrirDetalhes(ev)}>
                            <Eye size={14} /> Detalhes
                          </button>

                          <button style={acaoButton} onClick={() => gerarContrato(ev)}>
                            <FileText size={14} /> Contrato
                          </button>

                          <button style={acaoButton} onClick={() => lancarReceita(ev)}>
                            <Wallet size={14} /> Receita
                          </button>

                          <button
                            style={{ ...acaoButton, ...acaoWhatsappButton }}
                            onClick={() => enviarWhatsAppConfirmacao(ev)}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Novo evento */}
              <div style={panelCard}>
                <button onClick={() => setFormAberto((f) => !f)} style={novoEventoHeader}>
                  <div style={isMobile ? mobileHeaderActions : { display: "flex", alignItems: "center", gap: 10 }}>
                    <Plus size={18} color="#00AAFF" />
                    <h2 style={panelTitle}>{editandoId ? "Editar Evento" : "Novo Evento"}</h2>
                  </div>
                  {formAberto ? <ChevronUp size={18} color="#94A3B8" /> : <ChevronDown size={18} color="#94A3B8" />}
                </button>

                {formAberto && (
                  <form onSubmit={salvarEvento} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
                    <Campo label="Cliente">
                      <SearchSelect
                        value={clientName}
                        placeholder="Busque ou selecione o cliente"
                        options={clientes.map((c) => ({ value: c.nome, label: c.nome }))}
                        onChange={setClientName}
                      />
                    </Campo>

                    <Campo label="Tipo de Evento">
                      <DropdownSelect
                        value={eventType}
                        options={tipoEventoOptions}
                        onChange={setEventType}
                      />
                    </Campo>

                    <Campo label="Formato do Show">
                      <SearchSelect
                        value={showFormat}
                        placeholder="Busque ou selecione o formato"
                        options={formatos.map((f) => ({ value: f.nome, label: f.nome }))}
                        onChange={setShowFormat}
                      />
                    </Campo>

                    <Campo label="Status do Evento">
                      <DropdownSelect
                        value={eventStatusManual}
                        options={statusEventoOptions}
                        onChange={setEventStatusManual}
                      />
                    </Campo>

                    <Campo label="CEP do Evento">
                      <div style={isMobile ? mobileCepGrid : { display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}>
                        <input
                          value={cep}
                          onChange={(e) => setCep(limparCep(e.target.value))}
                          placeholder="Digite o CEP"
                          inputMode="numeric"
                          style={inputStyle}
                        />
                        <button
                          type="button"
                          onClick={buscarCep}
                          style={cepButtonStyle}
                          disabled={cepLoading}
                        >
                          {cepLoading ? "Buscando..." : "Buscar CEP"}
                        </button>
                      </div>
                    </Campo>

                    <Campo label="Endereço do Evento">
                      <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Endereço preenchido pelo CEP ou manualmente" style={inputStyle} />
                    </Campo>

                    <Campo label="Número">
                      <input value={numeroEndereco} onChange={(e) => setNumeroEndereco(e.target.value)} placeholder="Número do local" style={inputStyle} />
                    </Campo>

                    <div style={isMobile ? mobileFormTwoGrid : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Campo label="Data">
                        <input type="date" value={diaSelecionado} onChange={(e) => setDiaSelecionado(e.target.value)} style={inputStyle} />
                      </Campo>
                      <Campo label="Hora">
                        <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} style={inputStyle} />
                      </Campo>
                    </div>

                    <div style={isMobile ? mobileFormTwoGrid : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <Campo label="Duração">
                        <input value={showDuration} onChange={(e) => setShowDuration(e.target.value)} placeholder="Ex: 2 horas" style={inputStyle} />
                      </Campo>
                      <Campo label="Cachê (R$)">
                        <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0,00" inputMode="numeric" style={inputStyle} />
                      </Campo>
                    </div>

                    <Campo label="Forma de pagamento">
                      <DropdownSelect
                        value={paymentFormat}
                        options={pagamentoOptions}
                        onChange={setPaymentFormat}
                      />
                    </Campo>

                    {colaboradores.length > 0 && (
                      <Campo label="Colaboradores">
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                          {colaboradores.map((c) => (
                            <label key={c.id} style={checkboxRow}>
                              <input
                                type="checkbox"
                                checked={colaboradoresSelecionados.includes(c.id)}
                                onChange={() => alternarColaborador(c.id)}
                                style={{ accentColor: "#8B35FF", width: 16, height: 16 }}
                              />
                              {c.nome} <span style={{ color: "#64748B" }}>— {c.funcao}</span>
                            </label>
                          ))}
                        </div>
                      </Campo>
                    )}

                    <Campo label="Observações">
                      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Detalhes do evento..." style={{ ...inputStyle, resize: "vertical" }} />
                    </Campo>

                    <div style={isMobile ? mobileFormActions : { display: "flex", gap: 10 }}>
                      {editandoId && (
                        <button type="button" onClick={limparFormulario} style={{ ...ghostButton, flex: 1, justifyContent: "center" }}>
                          Cancelar
                        </button>
                      )}
                      <button type="submit" style={{ ...primaryButton, flex: 1, justifyContent: "center" }}>
                        {editandoId ? "Salvar alterações" : "Continuar cadastro"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Dica GIBA */}
              <div style={dicaCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <Lightbulb size={18} color="#F59E0B" />
                  <h2 style={panelTitle}>Dica GIBA</h2>
                </div>
                <p style={{ margin: 0, color: "#CBD5E1", fontSize: 13, lineHeight: 1.5 }}>
                  Você possui <strong style={{ color: "#fff" }}>{metricas.pendentesMes} eventos pendentes</strong> aguardando confirmação de sinal.
                </p>
                <button style={{ ...ghostButton, marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  Ver eventos pendentes <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* ===== MODAL DETALHES ===== */}
          {eventoSelecionado && (
            <div style={modalOverlay} onClick={() => setEventoSelecionado(null)}>
              <div style={isMobile ? mobileModalCard : modalCard} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <span
                      style={{
                        ...statusBadge,
                        background: getStageConfig(statusParaExibicaoEvento(eventoSelecionado)).soft,
                        color: getStageConfig(statusParaExibicaoEvento(eventoSelecionado)).color,
                      }}
                    >
                      {getStageConfig(statusParaExibicaoEvento(eventoSelecionado)).label}
                    </span>
                    <h2 style={{ margin: "10px 0 0", fontSize: 20, fontWeight: 900 }}>
                      {eventoSelecionado.title.replace(/^Show - /, "")}
                    </h2>
                    <p style={{ margin: "4px 0 0", color: "#94A3B8", fontSize: 13 }}>{eventoSelecionado.client_name}</p>
                  </div>
                  <button onClick={() => setEventoSelecionado(null)} style={miniIconBtn} aria-label="Fechar">
                    <X size={18} />
                  </button>
                </div>

                <div style={isMobile ? mobileModalInfoGrid : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <InfoLinha icon={<CalendarDays size={16} />} label="Data" valor={new Date(eventoSelecionado.event_date + "T00:00:00").toLocaleDateString("pt-BR")} />
                  <InfoLinha icon={<Clock size={16} />} label="Horário" valor={`${eventoSelecionado.event_time} · ${eventoSelecionado.show_duration}`} />
                  <InfoLinha icon={<MapPin size={16} />} label="Local" valor={eventoSelecionado.location || "—"} />
                  <InfoLinha icon={<Mic2 size={16} />} label="Formato" valor={eventoSelecionado.show_format || "—"} />
                  <InfoLinha icon={<DollarSign size={16} />} label="Cachê" valor={formatarMoeda(eventoSelecionado.fee || 0)} />
                  <InfoLinha icon={<Wallet size={16} />} label="Pagamento" valor={eventoSelecionado.payment_format} />
                </div>

                <div style={statusControlBox}>
                  <p style={statusControlTitle}>ALTERAR STATUS</p>
                  <div style={statusActionsGrid}>
                    {statusEventoOptions.map((status) => {
                      const ativo = statusParaExibicaoEvento(eventoSelecionado) === status.value
                      const cfg = getStageConfig(status.value)

                      return (
                        <button
                          key={status.value}
                          type="button"
                          onClick={() => atualizarStatusEvento(eventoSelecionado, status.value as "pendente" | "proximo" | "realizado")}
                          style={{
                            ...statusActionButton,
                            ...(ativo
                              ? {
                                  background: cfg.soft,
                                  color: cfg.color,
                                  border: `1px solid ${cfg.color}`,
                                }
                              : {}),
                          }}
                        >
                          <span style={{ ...legendaDot, background: cfg.color }} />
                          {status.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: "0 0 8px", color: "#94A3B8", fontSize: 12, fontWeight: 700 }}>EQUIPE ESCALADA</p>
                  <AvatarStack pessoas={colaboradoresDoEvento(eventoSelecionado.id)} mostrarNomes />
                </div>

                {eventoSelecionado.notes && (
                  <div style={notasBox}>
                    <p style={{ margin: 0, color: "#CBD5E1", fontSize: 13 }}>{eventoSelecionado.notes}</p>
                  </div>
                )}

                <div style={isMobile ? mobileModalActionsGrid : { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 18 }}>
                  <button onClick={() => gerarContrato(eventoSelecionado)} style={{ ...primaryButton, justifyContent: "center" }}>
                    <FileText size={16} /> Gerar contrato
                  </button>
                  <button onClick={() => lancarReceita(eventoSelecionado)} style={{ ...ghostButton, justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}>
                    <Wallet size={16} /> Lançar receita
                  </button>
                  <button onClick={() => enviarWhatsAppConfirmacao(eventoSelecionado)} style={{ ...ghostButton, justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}>
                    <MessageCircle size={16} /> Confirmar WhatsApp
                  </button>
                  <button onClick={() => editarEvento(eventoSelecionado)} style={{ ...ghostButton, justifyContent: "center", display: "flex", alignItems: "center", gap: 8 }}>
                    Editar evento
                  </button>
                  <button onClick={() => excluirEvento(eventoSelecionado.id)} style={dangerButton}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          )}

          {whatsappEvento && (
            <div style={modalOverlay} onClick={fecharModalWhatsapp}>
              <div style={isMobile ? mobileWhatsappModalCard : whatsappModalCard} onClick={(e) => e.stopPropagation()}>
                <div style={whatsappModalHeader}>
                  <div>
                    <p style={whatsappEyebrow}>CONFIRMAÇÃO VIA WHATSAPP</p>
                    <h2 style={whatsappTitle}>Enviar mensagem ao contratante</h2>
                    <p style={whatsappSubtitle}>Revise a mensagem antes de abrir o WhatsApp.</p>
                  </div>

                  <button onClick={fecharModalWhatsapp} style={miniIconBtn} aria-label="Fechar">
                    <X size={18} />
                  </button>
                </div>

                {whatsappAviso && <div style={whatsappWarningBox}>{whatsappAviso}</div>}

                <Campo label="WhatsApp do contratante">
                  <input
                    value={whatsappTelefone}
                    onChange={(e) => setWhatsappTelefone(e.target.value)}
                    placeholder="Ex: 31999999999"
                    inputMode="numeric"
                    style={inputStyle}
                  />
                </Campo>

                <Campo label="Mensagem">
                  <textarea
                    value={whatsappMensagem}
                    onChange={(e) => setWhatsappMensagem(e.target.value)}
                    rows={10}
                    style={whatsappTextarea}
                  />
                </Campo>

                <div style={whatsappHelpBox}>
                  Para salvar um modelo reutilizável, você pode usar variáveis:
                  <br />
                  <strong>{"{cliente}"}</strong>, <strong>{"{data}"}</strong>, <strong>{"{horario}"}</strong>, <strong>{"{formato}"}</strong>, <strong>{"{local}"}</strong>, <strong>{"{cache}"}</strong>, <strong>{"{pagamento}"}</strong>.
                </div>

                <div style={isMobile ? mobileWhatsappActionsGrid : whatsappActionsGrid}>
                  <button type="button" onClick={salvarModeloWhatsapp} style={ghostButton}>
                    Salvar modelo
                  </button>
                  <button type="button" onClick={fecharModalWhatsapp} style={ghostButton}>
                    Cancelar
                  </button>
                  <button type="button" onClick={confirmarEnvioWhatsapp} style={{ ...primaryButton, justifyContent: "center" }}>
                    <MessageCircle size={16} />
                    Enviar WhatsApp
                  </button>
                </div>
              </div>
            </div>
          )}
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  )
}

/* ===================== SUBCOMPONENTES ===================== */

function MetricCard({
  icon,
  tint,
  value,
  label,
  trend,
  trendPlain,
}: {
  icon: React.ReactNode
  tint: string
  value: string
  label: string
  trend: string
  trendPlain?: boolean
}) {
  return (
    <div style={metricCard}>
      <div style={{ ...metricIcon, background: `${tint}22`, color: tint }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <p style={{ ...metricValue, ...(String(value).startsWith("R$") ? metricMoneyValue : {}) }}>{value}</p>
        <p style={metricLabel}>{label}</p>
        <p style={{ ...metricTrend, color: trendPlain ? "#94A3B8" : "#22C55E" }}>
          {!trendPlain && <TrendingUp size={13} />}
          {trend}
        </p>
      </div>
    </div>
  )
}

function EventoLinha({
  evento,
  colaboradores,
  onDetalhes,
}: {
  evento: Evento
  colaboradores: Colaborador[]
  onDetalhes: () => void
}) {
  const cfg = getStageConfig(statusParaExibicaoEvento(evento))
  const d = new Date(evento.event_date + "T00:00:00")
  return (
    <div style={eventoLinha}>
      <div style={dataChip}>
        <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>{d.getDate()}</span>
        <span style={{ fontSize: 10, textTransform: "uppercase", color: "#94A3B8", fontWeight: 800 }}>
          {meses[d.getMonth()].slice(0, 3)}
        </span>
      </div>
      <span style={{ color: "#94A3B8", fontSize: 13, fontWeight: 700, minWidth: 44 }}>{evento.event_time}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {evento.title.replace(/^Show - /, "")}
        </p>
        <p style={{ margin: "3px 0 0", color: "#94A3B8", fontSize: 12 }}>{evento.location}</p>
      </div>
      <span style={{ ...statusBadge, background: cfg.soft, color: cfg.color }}>{cfg.label}</span>
      <AvatarStack pessoas={colaboradores} />
      <span style={{ fontWeight: 900, fontSize: 14, minWidth: 96, textAlign: "right" }}>{formatarMoeda(evento.fee || 0)}</span>
      <button onClick={onDetalhes} style={detalhesBtn}>
        Ver detalhes
      </button>
    </div>
  )
}

function AvatarStack({ pessoas, mostrarNomes }: { pessoas: Colaborador[]; mostrarNomes?: boolean }) {
  const visiveis = pessoas.slice(0, 3)
  const resto = pessoas.length - visiveis.length
  if (pessoas.length === 0) return <span style={{ color: "#64748B", fontSize: 12 }}>Sem equipe</span>
  return (
    <div style={{ display: "flex", alignItems: "center", gap: mostrarNomes ? 10 : 0 }}>
      <div style={{ display: "flex" }}>
        {visiveis.map((p, i) => (
          <div key={p.id} style={{ ...avatarCircle, marginLeft: i === 0 ? 0 : -8 }} title={p.nome}>
            {iniciais(p.nome)}
          </div>
        ))}
        {resto > 0 && <div style={{ ...avatarCircle, marginLeft: -8, background: "#1E293B" }}>+{resto}</div>}
      </div>
      {mostrarNomes && (
        <span style={{ color: "#CBD5E1", fontSize: 12 }}>
          {pessoas.map((p) => p.nome.split(" ")[0]).join(", ")}
        </span>
      )}
    </div>
  )
}

function SearchSelect({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState("")

  const filtradas = options.filter((option) =>
    option.label.toLowerCase().includes(term.toLowerCase()),
  )

  const labelSelecionado = options.find((option) => option.value === value)?.label || value

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((atual) => !atual)} style={selectTriggerStyle}>
        <span style={{ color: value ? "#FFFFFF" : "#94A3B8" }}>
          {value ? labelSelecionado : placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" />
      </button>

      {open && (
        <div style={selectDropdownStyle}>
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite para buscar..."
            style={selectSearchInputStyle}
          />

          <div style={selectOptionsListStyle}>
            {filtradas.length === 0 && (
              <p style={{ margin: 0, padding: "10px 12px", color: "#94A3B8", fontSize: 13 }}>
                Nenhum resultado encontrado.
              </p>
            )}

            {filtradas.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setTerm("")
                  setOpen(false)
                }}
                style={{
                  ...selectOptionStyle,
                  ...(option.value === value ? selectOptionActiveStyle : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DropdownSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selecionado = options.find((option) => option.value === value)

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((atual) => !atual)} style={selectTriggerStyle}>
        <span>{selecionado?.label || "Selecione"}</span>
        <ChevronDown size={16} color="#94A3B8" />
      </button>

      {open && (
        <div style={selectDropdownStyle}>
          <div style={selectOptionsListStyle}>
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                style={{
                  ...selectOptionStyle,
                  ...(option.value === value ? selectOptionActiveStyle : {}),
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 700 }}>{label}</span>
      {children}
    </label>
  )
}

function InfoLinha({ icon, label, valor }: { icon: React.ReactNode; label: string; valor: string }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <span style={{ color: "#8B35FF", marginTop: 2 }}>{icon}</span>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, color: "#94A3B8", fontWeight: 700 }}>{label}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 700 }}>{valor}</p>
      </div>
    </div>
  )
}

/* ===================== ESTILOS ===================== */

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 22,
}
const headerIconBox: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  color: "#fff",
  boxShadow: "0 14px 30px rgba(139,53,255,0.30)",
}
const pageTitle: React.CSSProperties = { margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }
const pageSubtitle: React.CSSProperties = { margin: "4px 0 0", color: "#94A3B8", fontSize: 14 }

const iconButton: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
}
const notifBadge: React.CSSProperties = {
  position: "absolute",
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 9,
  background: "#EF4444",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
const datePill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
}

const toolbarRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
  marginBottom: 18,
}
const navGroup: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: 4,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
}
const navArrow: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  border: "none",
  background: "transparent",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
}
const ghostButton: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
}
const monthPill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 16px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
}
const viewToggle: React.CSSProperties = {
  display: "flex",
  gap: 4,
  padding: 4,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
}
const viewToggleBtn: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  color: "#94A3B8",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
}
const viewToggleActive: React.CSSProperties = {
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#fff",
  boxShadow: "0 8px 20px rgba(139,53,255,0.30)",
}
const searchBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 14px",
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  minWidth: 230,
}
const searchInput: React.CSSProperties = {
  border: "none",
  background: "transparent",
  outline: "none",
  color: "#fff",
  fontSize: 13,
  width: "100%",
}
const primaryButton: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "11px 18px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(139,53,255,0.30)",
}
const dangerButton: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: 14,
  border: "1px solid rgba(239,68,68,0.35)",
  background: "rgba(239,68,68,0.12)",
  color: "#FCA5A5",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
}

const filtrosBar: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  marginBottom: 18,
}
const chipButton: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#CBD5E1",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
}

const metricsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
  gap: 12,
  marginBottom: 18,
}
const metricCard: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  padding: "14px 14px",
  borderRadius: 20,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.20)",
}
const metricIcon: React.CSSProperties = {
  width: 40,
  height: 40,
  minWidth: 40,
  borderRadius: 14,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}
const metricValue: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(18px, 1.15vw, 21px)",
  lineHeight: 1.1,
  fontWeight: 900,
  letterSpacing: -0.5,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}
const metricMoneyValue: React.CSSProperties = {
  fontSize: "clamp(16px, 1vw, 19px)",
  letterSpacing: -0.7,
}
const metricLabel: React.CSSProperties = { margin: "2px 0 0", color: "#94A3B8", fontSize: 12 }
const metricTrend: React.CSSProperties = { margin: "6px 0 0", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 360px",
  gap: 18,
  alignItems: "start",
}

const calendarCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  boxShadow: "0 22px 50px rgba(0,0,0,0.22)",
}
const weekHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "8px",
  marginBottom: 8,
};

const monthGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "8px",
};
const weekHeaderCell: React.CSSProperties = { textAlign: "center", color: "#94A3B8", fontSize: 12, fontWeight: 800, padding: "4px 0" }
const emptyCell: React.CSSProperties = {
  minHeight: 96,
  borderRadius: 14,
  background: "rgba(255,255,255,0.015)",
  border: "1px solid transparent",
};
const dayCell: React.CSSProperties = {
  minHeight: 96,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.02)",
  padding: 8,
  display: "flex",
  flexDirection: "column",
  gap: 6,
  cursor: "pointer",
  textAlign: "left",
  color: "#fff",
}
const dayCellSelected: React.CSSProperties = {
  border: "1.5px solid #00AAFF",
  background: "rgba(0,170,255,0.06)",
  boxShadow: "0 0 0 3px rgba(0,170,255,0.12)",
}
const dayNumber: React.CSSProperties = { fontSize: 13, fontWeight: 800, color: "#CBD5E1" }
const dayNumberToday: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
}
const eventChip: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  borderRadius: 8,
  padding: "5px 7px",
  cursor: "pointer",
}
const chipTime: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: "#fff" }
const chipTitle: React.CSSProperties = {
  fontSize: 11,
  color: "#CBD5E1",
  margin: "1px 0 4px",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
}
const statusBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 9px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 800,
}
const maisEventos: React.CSSProperties = { fontSize: 10, color: "#00AAFF", fontWeight: 800, marginTop: "auto" }

const legendaRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "nowrap",
  justifyContent: "flex-start",
  overflowX: "auto",
  marginTop: 16,
  paddingTop: 14,
  paddingBottom: 4,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}
const legendaItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  color: "#94A3B8",
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
  padding: "7px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.07)",
}
const legendaDot: React.CSSProperties = { width: 9, height: 9, borderRadius: "50%" }

const panelCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  boxShadow: "0 22px 50px rgba(0,0,0,0.22)",
}
const panelHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 14,
}
const panelTitle: React.CSSProperties = { margin: 0, fontSize: 16, fontWeight: 900 }
const panelSub: React.CSSProperties = { margin: "2px 0 0", color: "#94A3B8", fontSize: 12 }
const verTodosBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#CBD5E1",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
}
const countBadge: React.CSSProperties = {
  minWidth: 26,
  height: 26,
  padding: "0 8px",
  borderRadius: 13,
  background: "rgba(139,53,255,0.18)",
  color: "#C4B5FD",
  fontSize: 13,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const eventoLinha: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "12px 14px",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.025)",
  flexWrap: "wrap",
  overflow: "hidden",
}
const dataChip: React.CSSProperties = {
  width: 46,
  minWidth: 46,
  height: 46,
  borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
}
const detalhesBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.05)",
  color: "#fff",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
}

const eventoDoDiaCard: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.07)",
  background: "rgba(255,255,255,0.025)",
}
const horaDot: React.CSSProperties = { width: 10, height: 10, minWidth: 10, borderRadius: "50%", marginTop: 5 }
const miniIconBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#94A3B8",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
}
const acaoLink: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  border: "none",
  background: "transparent",
  color: "#94A3B8",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
}

const avatarCircle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  border: "2px solid #0B1020",
  color: "#fff",
  fontSize: 10,
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const novoEventoHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
}
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
}

const selectTriggerStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 42,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
}

const selectDropdownStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "calc(100% + 8px)",
  zIndex: 50,
  padding: 8,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#0B1424",
  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
}

const selectSearchInputStyle: React.CSSProperties = {
  ...inputStyle,
  marginBottom: 8,
  background: "rgba(255,255,255,0.06)",
}

const selectOptionsListStyle: React.CSSProperties = {
  maxHeight: 220,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: 4,
}

const selectOptionStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: 10,
  padding: "10px 12px",
  background: "transparent",
  color: "#CBD5E1",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
}

const selectOptionActiveStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(139,53,255,0.28), rgba(0,170,255,0.20))",
  color: "#FFFFFF",
}

const cepButtonStyle: React.CSSProperties = {
  padding: "0 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,170,255,0.14)",
  color: "#38BDF8",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
}
const checkboxRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  color: "#CBD5E1",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
}

const dicaCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(245,158,11,0.25)",
  background: "rgba(245,158,11,0.06)",
}

const statusControlBox: React.CSSProperties = {
  marginBottom: 16,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
}

const statusControlTitle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#94A3B8",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.4,
}

const statusActionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 8,
}

const statusActionButton: React.CSSProperties = {
  minHeight: 38,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#CBD5E1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
}

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2,4,12,0.70)",
  backdropFilter: "blur(6px)",
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
}
const modalCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 540,
  maxHeight: "90vh",
  overflowY: "auto",
  padding: 24,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(145deg, #0B0F1C, #0A1426)",
  boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
  color: "#fff",
}
const notasBox: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
}

const eventosDoDiaList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
}

const emptyDayText: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: 13,
  padding: "10px 2px",
  margin: 0,
  lineHeight: 1.5,
}

const eventoDoDiaCardPremium: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
  display: "flex",
  flexDirection: "column",
  gap: 12,
}

const eventoDoDiaTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 10,
}

const eventoDoDiaTitleGroup: React.CSSProperties = {
  display: "flex",
  gap: 10,
  minWidth: 0,
  flex: 1,
}

const eventoDoDiaTitulo: React.CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: 14,
  lineHeight: 1.35,
  wordBreak: "break-word",
}

const eventoDoDiaCliente: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#CBD5E1",
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1.35,
}

const eventoDoDiaLocal: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#94A3B8",
  fontSize: 12,
  lineHeight: 1.45,
  wordBreak: "break-word",
}

const eventoDoDiaMetaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
}

const eventoDoDiaActionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 8,
  paddingTop: 2,
}

const acaoButton: React.CSSProperties = {
  minHeight: 38,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  color: "#CBD5E1",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  padding: "8px 10px",
  whiteSpace: "nowrap",
}

const acaoWhatsappButton: React.CSSProperties = {
  border: "1px solid rgba(34,197,94,0.35)",
  background: "rgba(34,197,94,0.10)",
  color: "#86EFAC",
}

const whatsappModalCard: React.CSSProperties = {
  width: "100%",
  maxWidth: 620,
  maxHeight: "90vh",
  overflowY: "auto",
  padding: 24,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "linear-gradient(145deg, #0B0F1C, #0A1426)",
  boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
  color: "#fff",
}

const whatsappModalHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 18,
}

const whatsappEyebrow: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#38BDF8",
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.8,
}

const whatsappTitle: React.CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: 22,
  fontWeight: 900,
}

const whatsappSubtitle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#94A3B8",
  fontSize: 13,
  lineHeight: 1.5,
}

const whatsappWarningBox: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(245,158,11,0.28)",
  background: "rgba(245,158,11,0.10)",
  color: "#FCD34D",
  fontSize: 13,
  fontWeight: 700,
  lineHeight: 1.45,
  marginBottom: 14,
}

const whatsappTextarea: React.CSSProperties = {
  ...inputStyle,
  minHeight: 230,
  resize: "vertical",
  lineHeight: 1.5,
  fontFamily: "inherit",
}

const whatsappHelpBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.035)",
  color: "#94A3B8",
  fontSize: 12,
  lineHeight: 1.6,
}

const whatsappActionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1.2fr",
  gap: 10,
  marginTop: 18,
}



/* ===================== MOBILE / TABLET GIBA ===================== */

const mobileHeaderRow: React.CSSProperties = {
  ...headerRow,
  flexDirection: "column",
  alignItems: "stretch",
  gap: 14,
}

const mobileHeaderActions: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
}

const mobileToolbarRow: React.CSSProperties = {
  ...toolbarRow,
  flexDirection: "column",
  alignItems: "stretch",
  gap: 12,
}

const mobileSearchBox: React.CSSProperties = {
  ...searchBox,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
}

const mobileMetricsGrid: React.CSSProperties = {
  ...metricsGrid,
  gridTemplateColumns: "1fr",
}

const mobileMainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 18,
  alignItems: "start",
  width: "100%",
  overflow: "hidden",
}

const mobileCalendarCard: React.CSSProperties = {
  ...calendarCard,
  padding: 14,
  overflowX: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}

const mobileWeekHeader: React.CSSProperties = {
  ...weekHeader,
  minWidth: 620,
}

const mobileMonthGrid: React.CSSProperties = {
  ...monthGrid,
  minWidth: 620,
}

const mobileWeekGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(86px, 1fr))",
  gap: 8,
  minWidth: 620,
}

const mobileDayCell: React.CSSProperties = {
  ...dayCell,
  minHeight: 92,
  padding: 7,
}

const mobileEventoDoDiaCardPremium: React.CSSProperties = {
  ...eventoDoDiaCardPremium,
  padding: 14,
  overflow: "hidden",
}

const mobileCepGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
}

const mobileFormTwoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
}

const mobileFormActions: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
}

const mobileModalCard: React.CSSProperties = {
  ...modalCard,
  maxWidth: "100%",
  maxHeight: "86vh",
  padding: 18,
  borderRadius: 20,
}

const mobileModalInfoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  marginBottom: 16,
}

const mobileModalActionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  marginTop: 18,
}

const mobileWhatsappModalCard: React.CSSProperties = {
  ...whatsappModalCard,
  maxWidth: "100%",
  maxHeight: "86vh",
  padding: 18,
  borderRadius: 20,
}

const mobileWhatsappActionsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 10,
  marginTop: 18,
}

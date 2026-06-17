"use client"

import { useEffect, useMemo, useState } from "react"
import ProtectedRoute from "../../components/ProtectedRoute"
import PlanProtectedRoute from "../../components/PlanProtectedRoute"
import AppLayout from "../../components/AppLayout"
import { supabase } from "../../lib/supabase"
import FluxoCaixaChart from "../../components/financeiro/FluxoCaixaChart"
import DespesasDonut from "../../components/financeiro/DespesasDonut"
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  DollarSign,
  User,
  ChevronDown,
  TrendingUp,
  Search,
  Save,
  CalendarDays,
  Filter,
  Sparkles,
  RefreshCcw,
  Clock,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react"

/* ---------------------------------- Tipos --------------------------------- */

type Movimentacao = {
  id: string
  user_id: string
  type: string
  amount: number
  description: string | null
  category: string | null
  payment_method: string | null
  client_name: string | null
  event_id: string | null
  event_name?: string | null
  status: string | null
  payment_date: string | null
  notes: string | null
  created_at: string
}

type Evento = {
  id: string
  title: string | null
  client_name: string | null
  event_date: string | null
  fee: number | null
}

type Colaborador = {
  id: string
  nome?: string | null
  name?: string | null
  funcao?: string | null
  role?: string | null
}

type DespesaRecorrente = {
  id: string
  name: string
  category: string | null
  amount: number
  due_day: number | null
  payment_method: string | null
  periodicity: string
  is_paid: boolean
}

type Recebimento = {
  id: string
  client_name: string | null
  event_title: string | null
  due_date: string | null
  total_amount: number
  received_amount: number
  status: string
}

/* -------------------------------- Constantes ------------------------------ */

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const CATEGORIAS_ENTRADA = ["Cachê", "Sinal", "Pagamento Integral", "Outros"]
const CATEGORIAS_SAIDA = [
  "Combustível", "Colaboradores", "Hospedagem", "Transporte",
  "Equipamento", "Alimentação", "Impostos", "Outros",
]
const CATEGORIAS_RECORRENTES = ["INSS", "Impostos", "Contador", "Internet", "Telefone", "Marketing", "Software", "Aluguel", "Outros"]
const PERIODICIDADES = ["Mensal", "Trimestral", "Semestral", "Anual"]
const FORMAS_PAGAMENTO = ["PIX", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Transferência", "Boleto"]

const CORES_CATEGORIA: Record<string, string> = {
  "Combustível": "#FF5B8A",
  "Colaboradores": "#FFB454",
  "Hospedagem": "#00AAFF",
  "Transporte": "#8B35FF",
  "Equipamento": "#37E884",
  "Alimentação": "#FF8A5B",
  "Impostos": "#F25C7A",
  "Outros": "#64748B",
}

/* --------------------------------- Helpers -------------------------------- */

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatarData(data?: string | null) {
  if (!data) return "-"
  return new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR")
}

function parseValorBR(valor: string) {
  const limpo = valor.trim()

  if (!limpo) return 0

  if (limpo.includes(",") && limpo.includes(".")) {
    return Number(limpo.replace(/\./g, "").replace(",", "."))
  }

  if (limpo.includes(",")) {
    return Number(limpo.replace(",", "."))
  }

  return Number(limpo)
}

function corCategoria(cat?: string | null) {
  if (!cat) return "#64748B"
  return CORES_CATEGORIA[cat] || "#8B35FF"
}

function nomeColaborador(colaborador: Colaborador) {
  return colaborador.nome || colaborador.name || "Colaborador sem nome"
}

function funcaoColaborador(colaborador: Colaborador) {
  return colaborador.funcao || colaborador.role || ""
}

function primeirosNomes(nome?: string | null) {
  const partes = (nome || "").trim().split(" ").filter(Boolean)
  if (partes.length === 0) return "Sem cliente"
  return partes.slice(0, 2).join(" ")
}

function labelEvento(evento: Evento) {
  const data = formatarData(evento.event_date)
  return `${data} • ${primeirosNomes(evento.client_name || evento.title)}`
}

function tituloEventoPorId(eventos: Evento[], id?: string | null) {
  if (!id) return ""
  const evento = eventos.find((e) => e.id === id)
  if (!evento) return ""
  return evento.title || evento.client_name || "Evento vinculado"
}

/* ================================== PÁGINA ================================= */

export default function FinanceiroPage() {
  const hoje = new Date()

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const verificarTela = () => setIsMobile(window.innerWidth <= 768)
    verificarTela()
    window.addEventListener("resize", verificarTela)
    return () => window.removeEventListener("resize", verificarTela)
  }, [])

  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [eventos, setEventos] = useState<Evento[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [recorrentes, setRecorrentes] = useState<DespesaRecorrente[]>([])
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [movimentacaoSelecionada, setMovimentacaoSelecionada] = useState<Movimentacao | null>(null)

  const [mes, setMes] = useState(hoje.getMonth())
  const [ano, setAno] = useState(hoje.getFullYear())
  const [busca, setBusca] = useState("")

  // Formulário de nova movimentação
  const [tipo, setTipo] = useState<"Entrada" | "Saída" | "Recorrente">("Entrada")
  const [categoria, setCategoria] = useState("Cachê")
  const [eventoId, setEventoId] = useState("")
  const [colaboradorId, setColaboradorId] = useState("")
  const [descricao, setDescricao] = useState("")
  const [clienteNome, setClienteNome] = useState("")
  const [valor, setValor] = useState("")
  const [formaPagamento, setFormaPagamento] = useState("PIX")
  const [dataPagamento, setDataPagamento] = useState(
    hoje.toISOString().slice(0, 10),
  )
  const [notas, setNotas] = useState("")
  const [diaVencimento, setDiaVencimento] = useState(String(hoje.getDate()))
  const [periodicidade, setPeriodicidade] = useState("Mensal")

  async function obterUsuario() {
    const { data } = await supabase.auth.getUser()
    return data.user
  }

  async function carregarDados() {
    setCarregando(true)
    const user = await obterUsuario()
    if (!user) {
      setCarregando(false)
      return
    }

    const [movRes, evtRes, colRes, recRes, arRes] = await Promise.all([
      supabase
        .from("finance")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("id,title,client_name,event_date,fee")
        .eq("user_id", user.id)
        .order("event_date", { ascending: true }),
      supabase
        .from("collaborators")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("recurring_expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("due_day", { ascending: true }),
      supabase
        .from("accounts_receivable")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true }),
    ])

    if (!movRes.error) setMovimentacoes(movRes.data || [])
    if (!evtRes.error) setEventos(evtRes.data || [])
    if (!colRes.error) {
      const ordenados = [...(colRes.data || [])].sort((a, b) =>
        nomeColaborador(a).localeCompare(nomeColaborador(b)),
      )
      setColaboradores(ordenados)
    }
    if (!recRes.error) setRecorrentes(recRes.data || [])
    if (!arRes.error) setRecebimentos(arRes.data || [])

    setCarregando(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  /* --------------------------- Dados derivados --------------------------- */

  // Movimentações do período selecionado
  const movsPeriodo = useMemo(() => {
    return movimentacoes.filter((m) => {
      const ref = m.payment_date
        ? new Date(`${m.payment_date}T00:00:00`)
        : new Date(m.created_at)
      return ref.getMonth() === mes && ref.getFullYear() === ano
    })
  }, [movimentacoes, mes, ano])

  const movsFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return movsPeriodo
    return movsPeriodo.filter((m) =>
      [m.description, m.category, m.client_name, m.type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(termo)),
    )
  }, [movsPeriodo, busca])

  const resumo = useMemo(() => {
    let entradas = 0
    let saidas = 0
    movsPeriodo.forEach((m) => {
      if (m.type === "Entrada") entradas += Number(m.amount || 0)
      else saidas += Number(m.amount || 0)
    })

    let acumulado = 0
    movimentacoes.forEach((m) => {
      const ref = m.payment_date
        ? new Date(`${m.payment_date}T00:00:00`)
        : new Date(m.created_at)
      if (ref.getFullYear() === ano) {
        acumulado += m.type === "Entrada" ? Number(m.amount || 0) : -Number(m.amount || 0)
      }
    })

    return { entradas, saidas, saldo: entradas - saidas, acumulado }
  }, [movsPeriodo, movimentacoes, ano])

  // Fluxo de caixa dos últimos 6 meses
  const fluxoCaixa = useMemo(() => {
    const pontos: { label: string; entradas: number; saidas: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ano, mes - i, 1)
      let entradas = 0
      let saidas = 0
      movimentacoes.forEach((m) => {
        const ref = m.payment_date
          ? new Date(`${m.payment_date}T00:00:00`)
          : new Date(m.created_at)
        if (ref.getMonth() === d.getMonth() && ref.getFullYear() === d.getFullYear()) {
          if (m.type === "Entrada") entradas += Number(m.amount || 0)
          else saidas += Number(m.amount || 0)
        }
      })
      pontos.push({ label: MESES[d.getMonth()].slice(0, 3), entradas, saidas })
    }
    return pontos
  }, [movimentacoes, mes, ano])

  // Despesas por categoria (mês selecionado)
  const despesasCategoria = useMemo(() => {
    const mapa = new Map<string, number>()
    movsPeriodo
      .filter((m) => m.type === "Saída")
      .forEach((m) => {
        const cat = m.category || "Outros"
        mapa.set(cat, (mapa.get(cat) || 0) + Number(m.amount || 0))
      })
    return Array.from(mapa.entries())
      .map(([label, valor]) => ({ label, valor, cor: corCategoria(label) }))
      .sort((a, b) => b.valor - a.valor)
  }, [movsPeriodo])

  const proximosRecebimentos = useMemo(() => {
    const pendentes = recebimentos
      .filter((r) => r.status !== "Recebido")
      .sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""))

    if (pendentes.length > 0) return pendentes.slice(0, 5)

    // Fallback: deriva dos eventos futuros com cachê
    return eventos
      .filter((e) => e.event_date && new Date(`${e.event_date}T00:00:00`) >= new Date() && Number(e.fee) > 0)
      .slice(0, 5)
      .map<Recebimento>((e) => ({
        id: e.id,
        client_name: e.client_name,
        event_title: e.title,
        due_date: e.event_date,
        total_amount: Number(e.fee || 0),
        received_amount: 0,
        status: "Previsto",
      }))
  }, [recebimentos, eventos])

  // Insights da IA GIBA
  const insights = useMemo(() => {
    const lista: { tom: "bom" | "alerta" | "info"; texto: string }[] = []

    if (resumo.saldo > 0) {
      lista.push({
        tom: "bom",
        texto: `Seu mês está positivo em ${formatarMoeda(resumo.saldo)}. Bom momento para reservar parte para impostos.`,
      })
    } else if (resumo.saldo < 0) {
      lista.push({
        tom: "alerta",
        texto: `Atenção: as saídas superaram as entradas em ${formatarMoeda(Math.abs(resumo.saldo))} neste mês.`,
      })
    }

    const maiorDespesa = despesasCategoria[0]
    if (maiorDespesa && resumo.saidas > 0) {
      const pct = Math.round((maiorDespesa.valor / resumo.saidas) * 100)
      lista.push({
        tom: "info",
        texto: `${maiorDespesa.label} representa ${pct}% das suas despesas. Avalie renegociar este custo.`,
      })
    }

    const recorrentesPendentes = recorrentes.filter((r) => !r.is_paid)
    if (recorrentesPendentes.length > 0) {
      const total = recorrentesPendentes.reduce((a, r) => a + Number(r.amount || 0), 0)
      lista.push({
        tom: "alerta",
        texto: `Você tem ${recorrentesPendentes.length} despesa(s) recorrente(s) em aberto, somando ${formatarMoeda(total)}.`,
      })
    }

    const aReceber = proximosRecebimentos.reduce(
      (a, r) => a + (Number(r.total_amount) - Number(r.received_amount)),
      0,
    )
    if (aReceber > 0) {
      lista.push({
        tom: "info",
        texto: `Há ${formatarMoeda(aReceber)} previstos a receber nos próximos eventos.`,
      })
    }

    if (lista.length === 0) {
      lista.push({
        tom: "info",
        texto: "Registre suas primeiras movimentações para receber insights personalizados da GIBA.",
      })
    }

    return lista
  }, [resumo, despesasCategoria, recorrentes, proximosRecebimentos])

  const anosDisponiveis = useMemo(() => {
    const base = hoje.getFullYear()
    return [base - 2, base - 1, base, base + 1]
  }, [])

  const categoriasAtuais = tipo === "Entrada" ? CATEGORIAS_ENTRADA : tipo === "Saída" ? CATEGORIAS_SAIDA : CATEGORIAS_RECORRENTES

  /* ------------------------------- Ações --------------------------------- */

  async function salvarMovimentacao() {
    const valorNum = parseValorBR(valor)

    if (!descricao.trim() || !valorNum || valorNum <= 0) {
      alert("Informe ao menos a descrição e um valor válido.")
      return
    }

    setSalvando(true)
    const user = await obterUsuario()
    if (!user) {
      alert("Você precisa estar logado para registrar movimentações.")
      setSalvando(false)
      return
    }

    if (tipo === "Recorrente") {
      const dia = Math.min(Math.max(Number(diaVencimento || 1), 1), 31)
      const { error } = await supabase.from("recurring_expenses").insert({
        user_id: user.id,
        name: descricao.trim(),
        category: categoria,
        amount: valorNum,
        due_day: dia,
        payment_method: formaPagamento,
        periodicity: periodicidade,
        is_paid: false,
      })

      if (error) {
  console.error("ERRO COMPLETO:", JSON.stringify(error, null, 2))

  alert(
    `Erro: ${
      error?.message ||
      error?.details ||
      error?.hint ||
      JSON.stringify(error)
    }`
  )

  setSalvando(false)
  return
}

      setDescricao("")
      setClienteNome("")
      setValor("")
      setNotas("")
      setEventoId("")
      setColaboradorId("")
      await carregarDados()
      setSalvando(false)
      return
    }

    const colaborador = colaboradores.find((c) => c.id === colaboradorId)
    const nomeColab = colaborador ? nomeColaborador(colaborador) : ""
    const clienteFinal = tipo === "Saída" && nomeColab ? nomeColab : clienteNome.trim() || null
    const descricaoFinal =
      tipo === "Saída" && nomeColab && categoria === "Colaboradores"
        ? `${descricao.trim()} - ${nomeColab}`
        : descricao.trim()

    const { error } = await supabase.from("finance").insert({
      user_id: user.id,
      type: tipo,
      amount: valorNum,
      description: descricaoFinal,
      category: categoria,
      payment_method: formaPagamento,
      event_id: eventoId || null,
      client_name: clienteFinal,
      status: tipo === "Entrada" ? "Recebido" : "Pago",
      payment_date: dataPagamento || null,
      notes: notas.trim() || null,
    })

    if (error) {
      console.error("[v0] Erro ao salvar movimentação:", error)
      alert("Erro ao salvar movimentação.")
      setSalvando(false)
      return
    }

    setDescricao("")
    setClienteNome("")
    setValor("")
    setNotas("")
    setEventoId("")
    setColaboradorId("")
    await carregarDados()
    setSalvando(false)
  }

  async function excluirMovimentacao(id: string) {
    if (!confirm("Excluir esta movimentação?")) return
    const { error } = await supabase.from("finance").delete().eq("id", id)
    if (error) {
      console.error("[v0] Erro ao excluir:", error)
      alert("Erro ao excluir movimentação.")
      return
    }
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
  }

  async function alternarPagamentoRecorrente(item: DespesaRecorrente) {
    const novo = !item.is_paid
    setRecorrentes((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, is_paid: novo } : r)),
    )
    await supabase
      .from("recurring_expenses")
      .update({ is_paid: novo, last_paid_at: novo ? new Date().toISOString().slice(0, 10) : null })
      .eq("id", item.id)
  }

  async function excluirDespesaRecorrente(id: string) {
    if (!confirm("Deseja excluir esta despesa recorrente?")) return

    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Erro ao excluir despesa recorrente:", error)
      alert("Erro ao excluir despesa recorrente.")
      return
    }

    setRecorrentes((prev) => prev.filter((item) => item.id !== id))
  }

  /* ------------------------------- Render -------------------------------- */

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="financeiro">
        <AppLayout>
          <div style={isMobile ? mobilePageStyle : pageStyle}>
            <style>{`.giba-scroll-hidden::-webkit-scrollbar{display:none}`}</style>
            {/* Cabeçalho */}
            <header style={headerStyle}>
              <div style={headerLeftStyle}>
                <div style={headerIconStyle}>
                  <DollarSign size={26} />
                </div>
                <div>
                  <h1 style={titleStyle}>Financeiro</h1>
                  <p style={subtitleStyle}>
                    Acompanhe entradas, saídas e a saúde financeira da sua produção.
                  </p>
                </div>
              </div>

              <div style={filtersStyle}>
                <div style={selectWrapStyle}>
                  <CalendarDays size={15} style={{ color: "#8B35FF" }} />
                  <select
                    value={mes}
                    onChange={(e) => setMes(Number(e.target.value))}
                    style={selectStyle}
                    aria-label="Mês"
                  >
                    {MESES.map((m, i) => (
                      <option key={m} value={i} style={optionStyle}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={selectWrapStyle}>
                  <select
                    value={ano}
                    onChange={(e) => setAno(Number(e.target.value))}
                    style={selectStyle}
                    aria-label="Ano"
                  >
                    {anosDisponiveis.map((a) => (
                      <option key={a} value={a} style={optionStyle}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <button style={filterBtnStyle} onClick={() => carregarDados()}>
                  <Filter size={15} />
                  Atualizar
                </button>
              </div>
            </header>

            {/* Cards de resumo */}
            <section style={isMobile ? mobileCardsGridStyle : cardsGridStyle}>
              <ResumoCard
                rotulo="Entradas"
                valor={formatarMoeda(resumo.entradas)}
                detalhe={`${MESES[mes]} de ${ano}`}
                icon={<ArrowDownLeft size={22} />}
                cor="#37E884"
                seta="up"
              />
              <ResumoCard
                rotulo="Saídas"
                valor={formatarMoeda(resumo.saidas)}
                detalhe={`${MESES[mes]} de ${ano}`}
                icon={<ArrowUpRight size={22} />}
                cor="#FF5B8A"
                seta="down"
              />
              <ResumoCard
                rotulo="Saldo do Mês"
                valor={formatarMoeda(resumo.saldo)}
                detalhe="Entradas - Saídas"
                icon={<Wallet size={22} />}
                cor={resumo.saldo >= 0 ? "#00AAFF" : "#FF5B8A"}
              />
              <ResumoCard
                rotulo="Saldo Acumulado"
                valor={formatarMoeda(resumo.acumulado)}
                detalhe={`Total em ${ano}`}
                icon={<TrendingUp size={22} />}
                cor="#8B35FF"
              />
            </section>

            {/* Insights da IA GIBA */}
            <section style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), marginBottom: "22px" }}>
              <div style={cardHeaderStyle}>
                <div style={iaHeaderStyle}>
                  <span style={iaIconStyle}>
                    <Sparkles size={16} />
                  </span>
                  <h2 style={cardTitleStyle}>Insights da GIBA</h2>
                </div>
              </div>
              <div style={insightsGridStyle}>
                {insights.map((ins, i) => (
                  <div
                    key={i}
                    style={{
                      ...insightCardStyle,
                      borderColor:
                        ins.tom === "bom"
                          ? "rgba(55,232,132,0.35)"
                          : ins.tom === "alerta"
                          ? "rgba(255,91,138,0.35)"
                          : "rgba(0,170,255,0.30)",
                    }}
                  >
                    <span
                      style={{
                        ...insightDotStyle,
                        background:
                          ins.tom === "bom"
                            ? "#37E884"
                            : ins.tom === "alerta"
                            ? "#FF5B8A"
                            : "#00AAFF",
                      }}
                    />
                    <p style={insightTextStyle}>{ins.texto}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Movimentações + Nova movimentação */}
            <section style={isMobile ? mobileOneColStyle : twoColStyle}>
              {/* Lista de movimentações */}
              <div style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), ...(isMobile ? mobileMovimentacoesCardStyle : movimentacoesCardStyle), minWidth: 0 }}>
                <div style={cardHeaderStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h2 style={cardTitleStyle}>Movimentações</h2>
                    <span style={badgeCountStyle}>{movsFiltradas.length}</span>
                  </div>
                  <div style={isMobile ? mobileSearchWrapStyle : searchWrapStyle}>
                    <Search size={15} style={{ color: "#64748B" }} />
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar movimentação..."
                      style={searchInputStyle}
                    />
                  </div>
                </div>

                <div style={isMobile ? mobileTableWrapStyle : tableWrapStyle} className="giba-scroll-hidden">
                  {!isMobile && <div style={tableHeadStyle}>
                    <span style={{ flex: "0 0 84px" }}>Data</span>
                    <span style={{ flex: 2 }}>Descrição</span>
                    <span style={{ flex: 1.3 }}>Categoria</span>
                    <span style={{ flex: "0 0 90px" }}>Tipo</span>
                    <span style={{ flex: "0 0 120px", textAlign: "right" }}>Valor</span>
                    <span style={{ flex: "0 0 30px" }} />
                  </div>}

                  {carregando ? (
                    <p style={vazioStyle}>Carregando movimentações...</p>
                  ) : movsFiltradas.length === 0 ? (
                    <p style={vazioStyle}>Nenhuma movimentação neste período.</p>
                  ) : (
                    movsFiltradas.map((m) => {
                      const entrada = m.type === "Entrada"

                      if (isMobile) {
                        return (
                          <div key={m.id} style={mobileMovimentacaoItemStyle} onClick={() => setMovimentacaoSelecionada(m)} role="button" tabIndex={0}>
                            <div style={mobileMovimentacaoTopStyle}>
                              <span style={mobileMovimentacaoDateStyle}>
                                {formatarData(m.payment_date) !== "-"
                                  ? formatarData(m.payment_date)
                                  : new Date(m.created_at).toLocaleDateString("pt-BR")}
                              </span>
                              <span
                                style={{
                                  ...typeTagStyle,
                                  color: entrada ? "#37E884" : "#FF5B8A",
                                  background: entrada ? "rgba(55,232,132,0.12)" : "rgba(255,91,138,0.12)",
                                  border: `1px solid ${entrada ? "rgba(55,232,132,0.3)" : "rgba(255,91,138,0.3)"}`,
                                }}
                              >
                                {m.type}
                              </span>
                            </div>

                            <p style={mobileMovimentacaoTitleStyle}>{m.description || "—"}</p>
                            <p style={mobileMovimentacaoSubStyle}>{m.client_name || m.payment_method || "Sem cliente informado"}</p>

                            <div style={mobileMovimentacaoBottomStyle}>
                              <span
                                style={{
                                  ...categoryTagStyle,
                                  color: corCategoria(m.category),
                                  background: `${corCategoria(m.category)}1A`,
                                  border: `1px solid ${corCategoria(m.category)}40`,
                                }}
                              >
                                {m.category || "Outros"}
                              </span>

                              <strong style={{ color: entrada ? "#37E884" : "#FF5B8A", fontSize: "15px" }}>
                                {entrada ? "" : "-"}{formatarMoeda(Number(m.amount || 0))}
                              </strong>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                excluirMovimentacao(m.id)
                              }}
                              style={mobileMovimentacaoDeleteStyle}
                              aria-label="Excluir"
                            >
                              <Trash2 size={15} />
                              Excluir
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div key={m.id} style={tableRowStyle} onClick={() => setMovimentacaoSelecionada(m)} role="button" tabIndex={0}>
                          <span style={{ flex: "0 0 84px", ...cellMutedStyle }}>
                            {formatarData(m.payment_date) !== "-"
                              ? formatarData(m.payment_date)
                              : new Date(m.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <span style={{ flex: 2, minWidth: 0 }}>
                            <span style={cellMainStyle}>{m.description || "—"}</span>
                            <span style={cellSubStyle}>
                              {m.client_name || m.payment_method || ""}
                            </span>
                          </span>
                          <span style={{ flex: 1.3 }}>
                            <span
                              style={{
                                ...categoryTagStyle,
                                color: corCategoria(m.category),
                                background: `${corCategoria(m.category)}1A`,
                                border: `1px solid ${corCategoria(m.category)}40`,
                              }}
                            >
                              {m.category || "Outros"}
                            </span>
                          </span>
                          <span style={{ flex: "0 0 90px" }}>
                            <span
                              style={{
                                ...typeTagStyle,
                                color: entrada ? "#37E884" : "#FF5B8A",
                                background: entrada
                                  ? "rgba(55,232,132,0.12)"
                                  : "rgba(255,91,138,0.12)",
                                border: `1px solid ${entrada ? "rgba(55,232,132,0.3)" : "rgba(255,91,138,0.3)"}`,
                              }}
                            >
                              {m.type}
                            </span>
                          </span>
                          <span
                            style={{
                              flex: "0 0 120px",
                              textAlign: "right",
                              fontWeight: 800,
                              color: entrada ? "#37E884" : "#FF5B8A",
                            }}
                          >
                            {entrada ? "" : "-"}
                            {formatarMoeda(Number(m.amount || 0))}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              excluirMovimentacao(m.id)
                            }}
                            style={rowActionStyle}
                            aria-label="Excluir"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Nova movimentação */}
              <div style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), ...(isMobile ? mobileNovaMovimentacaoCardStyle : novaMovimentacaoCardStyle), minWidth: 0 }}>
                <div style={cardHeaderStyle}>
                  <h2 style={cardTitleStyle}>Nova Movimentação</h2>
                  <div style={toggleStyle}>
                    <button
                      onClick={() => {
                        setTipo("Entrada")
                        setCategoria(CATEGORIAS_ENTRADA[0])
                      }}
                      style={{
                        ...toggleBtnStyle,
                        ...(tipo === "Entrada" ? toggleActiveEntradaStyle : {}),
                      }}
                    >
                      Entrada
                    </button>
                    <button
                      onClick={() => {
                        setTipo("Saída")
                        setCategoria(CATEGORIAS_SAIDA[0])
                      }}
                      style={{
                        ...toggleBtnStyle,
                        ...(tipo === "Saída" ? toggleActiveSaidaStyle : {}),
                      }}
                    >
                      Saída
                    </button>
                    <button
                      onClick={() => {
                        setTipo("Recorrente")
                        setCategoria(CATEGORIAS_RECORRENTES[0])
                      }}
                      style={{
                        ...toggleBtnStyle,
                        ...(tipo === "Recorrente" ? toggleActiveRecorrenteStyle : {}),
                      }}
                    >
                      Recorrente
                    </button>
                  </div>
                </div>

                <div style={isMobile ? mobileFormGridStyle : formGridStyle}>
                  <Campo rotulo="Categoria">
                    <DropdownSearch
                      value={categoria}
                      placeholder="Selecione a categoria"
                      options={categoriasAtuais.map((c) => ({ value: c, label: c }))}
                      onChange={setCategoria}
                    />
                  </Campo>

                  {tipo !== "Recorrente" && (
                    <Campo rotulo="Evento">
                      <DropdownSearch
                        value={eventoId}
                        placeholder="Busque por data, evento ou cliente"
                        options={eventos.map((ev) => ({ value: ev.id, label: labelEvento(ev) }))}
                        onChange={(id) => {
                          setEventoId(id)
                          const ev = eventos.find((x) => x.id === id)

                          if (tipo === "Entrada" && ev?.client_name) {
                            setClienteNome(ev.client_name)
                          }

                          if (tipo === "Entrada" && ev?.fee) {
                            setValor(String(ev.fee))
                          }

                          if (ev?.title) {
                            setDescricao(
                              tipo === "Entrada"
                                ? `Pagamento referente ao evento: ${primeirosNomes(ev.client_name)} - ${formatarData(ev.event_date)}`
                                : `Despesa referente ao evento: ${primeirosNomes(ev.client_name)} - ${formatarData(ev.event_date)}`,
                            )
                          }
                        }}
                      />
                    </Campo>
                  )}

                  {tipo === "Saída" && (
                    <Campo rotulo="Colaborador">
                      <DropdownSearch
                        value={colaboradorId}
                        placeholder="Busque ou selecione o colaborador"
                        options={colaboradores.map((c) => ({
                          value: c.id,
                          label: `${nomeColaborador(c)}${funcaoColaborador(c) ? ` — ${funcaoColaborador(c)}` : ""}`,
                        }))}
                        onChange={(id) => {
                          setColaboradorId(id)
                          const colaborador = colaboradores.find((c) => c.id === id)
                          if (colaborador) setClienteNome(nomeColaborador(colaborador))
                        }}
                      />
                    </Campo>
                  )}

                  <Campo rotulo={tipo === "Recorrente" ? "Nome da despesa" : "Descrição"}>
                    <input
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder={tipo === "Recorrente" ? "Ex.: INSS, contador, internet" : "Ex.: Pagamento do show"}
                      style={inputStyle}
                    />
                  </Campo>

                  {tipo !== "Recorrente" && (
                    <Campo rotulo={tipo === "Saída" ? "Colaborador / Favorecido" : "Cliente"}>
                      <input
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        placeholder={tipo === "Saída" ? "Nome do favorecido" : "Nome do cliente"}
                        style={inputStyle}
                      />
                    </Campo>
                  )}

                  <Campo rotulo="Valor (R$)">
                    <input
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      placeholder="0,00"
                      inputMode="decimal"
                      style={inputStyle}
                    />
                  </Campo>

                  <Campo rotulo="Forma de Pagamento">
                    <DropdownSearch
                      value={formaPagamento}
                      placeholder="Forma de pagamento"
                      options={FORMAS_PAGAMENTO.map((f) => ({ value: f, label: f }))}
                      onChange={setFormaPagamento}
                    />
                  </Campo>

                  {tipo === "Recorrente" ? (
                    <>
                      <Campo rotulo="Dia do vencimento">
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={diaVencimento}
                          onChange={(e) => setDiaVencimento(e.target.value)}
                          style={inputStyle}
                        />
                      </Campo>
                      <Campo rotulo="Periodicidade">
                        <DropdownSearch
                          value={periodicidade}
                          placeholder="Periodicidade"
                          options={PERIODICIDADES.map((p) => ({ value: p, label: p }))}
                          onChange={setPeriodicidade}
                        />
                      </Campo>
                    </>
                  ) : (
                    <Campo rotulo="Data do Pagamento">
                      <input
                        type="date"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        style={inputStyle}
                      />
                    </Campo>
                  )}

                  <Campo rotulo="Notas (opcional)">
                    <input
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observações adicionais..."
                      style={inputStyle}
                    />
                  </Campo>
                </div>
                <button
                  onClick={salvarMovimentacao}
                  disabled={salvando}
                  style={{ ...saveBtnStyle, opacity: salvando ? 0.7 : 1 }}
                >
                  <Save size={17} />
                  {salvando ? "Salvando..." : tipo === "Recorrente" ? "Salvar Despesa Recorrente" : "Salvar Movimentação"}
                </button>
              </div>
            </section>

            {/* Gráficos */}
            <section style={isMobile ? mobileOneColStyle : threeColStyle}>
              <div style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), ...graficoCardCompactStyle, ...(isMobile ? mobileChartCardStyle : {}), minWidth: 0 }} className="giba-scroll-hidden">
                <div style={cardHeaderStyle}>
                  <h2 style={cardTitleStyle}>
                    Fluxo de Caixa{" "}
                    <span style={cardTitleHintStyle}>(últimos 6 meses)</span>
                  </h2>
                </div>
                <FluxoCaixaChart dados={fluxoCaixa} />
              </div>

              <div style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), ...graficoCardCompactStyle, ...(isMobile ? mobileChartCardStyle : {}), minWidth: 0 }} className="giba-scroll-hidden">
                <div style={cardHeaderStyle}>
                  <h2 style={cardTitleStyle}>Despesas por Categoria</h2>
                </div>
                <DespesasDonut dados={despesasCategoria} />
              </div>

              <div style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), ...(isMobile ? mobileRecebimentosCardStyle : recebimentosCardStyle), minWidth: 0 }} className="giba-scroll-hidden">
                <div style={cardHeaderStyle}>
                  <h2 style={cardTitleStyle}>Próximos Recebimentos</h2>
                </div>
                <div style={listStyle} className="giba-scroll-hidden">
                  {proximosRecebimentos.length === 0 ? (
                    <p style={vazioStyle}>Nenhum recebimento previsto.</p>
                  ) : (
                    proximosRecebimentos.map((r) => {
                      const data = r.due_date ? new Date(`${r.due_date}T00:00:00`) : null
                      return (
                        <div key={r.id} style={recebItemStyle}>
                          <div style={recebDateStyle}>
                            <span style={recebDayStyle}>
                              {data ? String(data.getDate()).padStart(2, "0") : "--"}
                            </span>
                            <span style={recebMonthStyle}>
                              {data ? MESES[data.getMonth()].slice(0, 3).toUpperCase() : ""}
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={recebTitleStyle}>{r.event_title || "Evento"}</p>
                            <p style={recebSubStyle}>{r.client_name || "Cliente"}</p>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <p style={recebValueStyle}>
                              {formatarMoeda(Number(r.total_amount) - Number(r.received_amount))}
                            </p>
                            <span style={recebTagStyle}>{r.status}</span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </section>

            {/* Despesas recorrentes */}
            <section style={{ ...cardStyle, ...(isMobile ? mobileCardStyle : {}), marginTop: "22px" }}>
              <div style={cardHeaderStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={recIconStyle}>
                    <RefreshCcw size={15} />
                  </span>
                  <h2 style={cardTitleStyle}>Despesas Recorrentes</h2>
                </div>
              </div>

              {recorrentes.length === 0 ? (
                <p style={vazioStyle}>
                  Cadastre despesas fixas (aluguel, salários, software) para acompanhar
                  vencimentos mensais.
                </p>
              ) : (
                <div style={isMobile ? mobileRecGridStyle : recGridStyle}>
                  {recorrentes.map((r) => (
                    <div key={r.id} style={isMobile ? mobileRecCardStyle : recCardStyle}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={recTopStyle}>
                          <span
                            style={{
                              ...categoryTagStyle,
                              color: corCategoria(r.category),
                              background: `${corCategoria(r.category)}1A`,
                              border: `1px solid ${corCategoria(r.category)}40`,
                            }}
                          >
                            {r.category || "Outros"}
                          </span>
                          <span style={recPeriodStyle}>
                            <Clock size={12} /> Dia {r.due_day || "--"}
                          </span>
                        </div>
                        <p style={recNameStyle}>{r.name}</p>
                        <p style={recAmountStyle}>{formatarMoeda(Number(r.amount || 0))}</p>
                      </div>
                      <div style={isMobile ? mobileRecActionsStyle : recActionsStyle}>
                        <button
                          onClick={() => alternarPagamentoRecorrente(r)}
                          style={{
                            ...recStatusBtnStyle,
                            color: r.is_paid ? "#37E884" : "#FFB454",
                            background: r.is_paid
                              ? "rgba(55,232,132,0.12)"
                              : "rgba(255,180,84,0.12)",
                            border: `1px solid ${r.is_paid ? "rgba(55,232,132,0.3)" : "rgba(255,180,84,0.3)"}`,
                          }}
                        >
                          <CheckCircle2 size={14} />
                          {r.is_paid ? "Pago" : "Em aberto"}
                        </button>

                        <button
                          onClick={() => excluirDespesaRecorrente(r.id)}
                          style={recDeleteBtnStyle}
                        >
                          <Trash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {movimentacaoSelecionada && (
            <div style={modalOverlayStyle} onClick={() => setMovimentacaoSelecionada(null)}>
              <div style={isMobile ? mobileModalCardStyle : modalCardStyle} onClick={(e) => e.stopPropagation()}>
                <div style={modalHeaderStyle}>
                  <div>
                    <span
                      style={{
                        ...typeTagStyle,
                        color: movimentacaoSelecionada.type === "Entrada" ? "#37E884" : "#FF5B8A",
                        background:
                          movimentacaoSelecionada.type === "Entrada"
                            ? "rgba(55,232,132,0.12)"
                            : "rgba(255,91,138,0.12)",
                        border: `1px solid ${
                          movimentacaoSelecionada.type === "Entrada"
                            ? "rgba(55,232,132,0.3)"
                            : "rgba(255,91,138,0.3)"
                        }`,
                      }}
                    >
                      {movimentacaoSelecionada.type}
                    </span>
                    <h2 style={modalTitleStyle}>{movimentacaoSelecionada.description || "Movimentação"}</h2>
                    <p style={modalSubtitleStyle}>
                      {formatarData(movimentacaoSelecionada.payment_date) !== "-"
                        ? formatarData(movimentacaoSelecionada.payment_date)
                        : new Date(movimentacaoSelecionada.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button style={modalCloseButtonStyle} onClick={() => setMovimentacaoSelecionada(null)} aria-label="Fechar">
                    <X size={18} />
                  </button>
                </div>

                <div style={isMobile ? mobileModalInfoGridStyle : modalInfoGridStyle}>
                  <InfoDetalhe label="Valor" value={formatarMoeda(Number(movimentacaoSelecionada.amount || 0))} highlight={movimentacaoSelecionada.type === "Entrada" ? "#37E884" : "#FF5B8A"} />
                  <InfoDetalhe label="Categoria" value={movimentacaoSelecionada.category || "—"} />
                  <InfoDetalhe label="Forma de pagamento" value={movimentacaoSelecionada.payment_method || "—"} />
                  <InfoDetalhe label={movimentacaoSelecionada.type === "Entrada" ? "Cliente" : "Favorecido / Colaborador"} value={movimentacaoSelecionada.client_name || "—"} />
                  <InfoDetalhe label="Evento vinculado" value={tituloEventoPorId(eventos, movimentacaoSelecionada.event_id) || movimentacaoSelecionada.event_name || "—"} />
                  <InfoDetalhe label="Status" value={movimentacaoSelecionada.status || "—"} />
                </div>

                {movimentacaoSelecionada.notes && (
                  <div style={modalNotesStyle}>
                    <p style={modalNotesLabelStyle}>Observações</p>
                    <p style={modalNotesTextStyle}>{movimentacaoSelecionada.notes}</p>
                  </div>
                )}

                <div style={modalActionsStyle}>
                  <button
                    style={modalDeleteButtonStyle}
                    onClick={() => {
                      const id = movimentacaoSelecionada.id
                      setMovimentacaoSelecionada(null)
                      excluirMovimentacao(id)
                    }}
                  >
                    <Trash2 size={15} />
                    Excluir movimentação
                  </button>
                  <button style={modalCancelButtonStyle} onClick={() => setMovimentacaoSelecionada(null)}>
                    Fechar
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

/* ----------------------------- Subcomponentes ----------------------------- */

function ResumoCard({
  rotulo,
  valor,
  detalhe,
  icon,
  cor,
  seta,
}: {
  rotulo: string
  valor: string
  detalhe: string
  icon: React.ReactNode
  cor: string
  seta?: "up" | "down"
}) {
  return (
    <div style={resumoCardStyle}>
      <div style={resumoTopStyle}>
        <div>
          <p style={resumoLabelStyle}>
            {rotulo}
            {seta === "up" && <TrendingUp size={13} style={{ color: "#37E884" }} />}
            {seta === "down" && (
              <TrendingUp size={13} style={{ color: "#FF5B8A", transform: "rotate(90deg)" }} />
            )}
          </p>
          <p style={{ ...resumoValueStyle, color: cor }}>{valor}</p>
          <p style={resumoDetailStyle}>{detalhe}</p>
        </div>
        <div
          style={{
            ...resumoIconStyle,
            background: `${cor}1F`,
            color: cor,
            border: `1px solid ${cor}40`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <label style={campoStyle}>
      <span style={campoLabelStyle}>{rotulo}</span>
      {children}
    </label>
  )
}

function InfoDetalhe({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div style={infoDetalheStyle}>
      <span style={infoDetalheLabelStyle}>{label}</span>
      <strong style={{ ...infoDetalheValueStyle, color: highlight || "#fff" }}>{value}</strong>
    </div>
  )
}

function DropdownSearch({
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

  const selecionado = options.find((o) => o.value === value)
  const filtradas = options.filter((o) =>
    o.label.toLowerCase().includes(term.toLowerCase()),
  )

  return (
    <div style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpen((v) => !v)} style={dropdownTriggerStyle}>
        <span style={{ color: selecionado ? "#fff" : "#94A3B8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selecionado?.label || placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" />
      </button>

      {open && (
        <div style={dropdownMenuStyle}>
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Digite para buscar..."
            style={dropdownSearchStyle}
          />
          <div style={dropdownOptionsStyle} className="giba-scroll-hidden">
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
                  ...dropdownOptionStyle,
                  ...(option.value === value ? dropdownOptionActiveStyle : {}),
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

/* --------------------------------- Estilos -------------------------------- */

const pageStyle: React.CSSProperties = {
  maxWidth: "1320px",
  margin: "0 auto",
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px",
  flexWrap: "wrap",
  marginBottom: "24px",
}

const headerLeftStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
}

const headerIconStyle: React.CSSProperties = {
  width: "62px",
  height: "62px",
  borderRadius: "20px",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  boxShadow: "0 18px 38px rgba(139,53,255,0.35)",
  flexShrink: 0,
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "32px",
  fontWeight: 900,
  color: "#fff",
  letterSpacing: "-0.5px",
}

const subtitleStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "14px",
  color: "#94A3B8",
}

const filtersStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
}

const selectWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  padding: "0 12px",
  height: "42px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
}

const selectStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
}

const optionStyle: React.CSSProperties = {
  background: "#0A0F1C",
  color: "#fff",
}

const filterBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  height: "42px",
  padding: "0 16px",
  borderRadius: "14px",
  background: "rgba(139,53,255,0.14)",
  border: "1px solid rgba(139,53,255,0.35)",
  color: "#fff",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
}

const cardsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "18px",
  marginBottom: "22px",
}

const resumoCardStyle: React.CSSProperties = {
  padding: "20px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 20px 45px rgba(0,0,0,0.22)",
}

const resumoTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
}

const resumoLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#94A3B8",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  gap: "6px",
}

const resumoValueStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: "26px",
  fontWeight: 900,
  letterSpacing: "-0.5px",
}

const resumoDetailStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "12px",
  color: "#64748B",
}

const resumoIconStyle: React.CSSProperties = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}

const cardStyle: React.CSSProperties = {
  padding: "22px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 22px 50px rgba(0,0,0,0.22)",
}

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "14px",
  flexWrap: "wrap",
  marginBottom: "18px",
}

const cardTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 800,
  color: "#fff",
}

const cardTitleHintStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#64748B",
}

const iaHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
}

const iaIconStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "11px",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
}

const insightsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "14px",
}

const insightCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "11px",
  padding: "14px 16px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.10)",
}

const insightDotStyle: React.CSSProperties = {
  width: "9px",
  height: "9px",
  borderRadius: "50%",
  marginTop: "6px",
  flexShrink: 0,
}

const insightTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "13px",
  color: "#CBD5E1",
  lineHeight: 1.5,
}

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
  gap: "22px",
  alignItems: "stretch",
}

const movimentacoesCardStyle: React.CSSProperties = {
  height: "640px",
  display: "flex",
  flexDirection: "column",
}

const novaMovimentacaoCardStyle: React.CSSProperties = {
  height: "640px",
  display: "flex",
  flexDirection: "column",
}

const threeColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "22px",
  marginTop: "22px",
  alignItems: "start",
}

const graficoCardCompactStyle: React.CSSProperties = {
  minHeight: "350px",
  height: "fit-content",
  overflowY: "visible",
}

const recebimentosCardStyle: React.CSSProperties = {
  height: "350px",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}

const graficoCardStyle: React.CSSProperties = {
  minHeight: "430px",
  overflow: "hidden",
}

const badgeCountStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 800,
  color: "#8B35FF",
  background: "rgba(139,53,255,0.16)",
  border: "1px solid rgba(139,53,255,0.3)",
  borderRadius: "999px",
  padding: "2px 10px",
}

const searchWrapStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "0 12px",
  height: "40px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  minWidth: "210px",
}

const searchInputStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#fff",
  fontSize: "13px",
  width: "100%",
}

const tableWrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  overflowY: "auto",
  paddingRight: "4px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}

const tableHeadStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "0 6px 10px",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  color: "#64748B",
  fontWeight: 700,
  borderBottom: "1px solid rgba(255,255,255,0.07)",
}

const tableRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "13px 6px",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  fontSize: "13px",
  color: "#E2E8F0",
  cursor: "pointer",
}


const cellMutedStyle: React.CSSProperties = {
  color: "#94A3B8",
  fontSize: "12px",
}

const cellMainStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  color: "#fff",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const cellSubStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  color: "#64748B",
  marginTop: "2px",
}

const categoryTagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
}

const typeTagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: 700,
}

const rowActionStyle: React.CSSProperties = {
  flex: "0 0 30px",
  width: "30px",
  height: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "9px",
  background: "transparent",
  border: "none",
  color: "#64748B",
  cursor: "pointer",
}

const vazioStyle: React.CSSProperties = {
  margin: "18px 0",
  fontSize: "13px",
  color: "#64748B",
  textAlign: "center",
  lineHeight: 1.5,
}

const toggleStyle: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  padding: "4px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
}

const toggleBtnStyle: React.CSSProperties = {
  padding: "7px 16px",
  borderRadius: "10px",
  border: "none",
  background: "transparent",
  color: "#94A3B8",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
}

const toggleActiveEntradaStyle: React.CSSProperties = {
  background: "#18B866",
  color: "#fff",
}

const toggleActiveSaidaStyle: React.CSSProperties = {
  background: "#FF5B8A",
  color: "#fff",
}

const toggleActiveRecorrenteStyle: React.CSSProperties = {
  background: "#F59E0B",
  color: "#fff",
}

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "14px",
}

const campoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "7px",
  minWidth: 0,
}

const campoLabelStyle: React.CSSProperties = {
  fontSize: "13px",
  color: "#CBD5E1",
  fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  height: "44px",
  padding: "0 13px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
}


const dropdownTriggerStyle: React.CSSProperties = {
  height: "44px",
  padding: "0 13px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#fff",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  cursor: "pointer",
}

const dropdownMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  zIndex: 30,
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#07111F",
  boxShadow: "0 24px 55px rgba(0,0,0,0.42)",
  overflow: "hidden",
}

const dropdownSearchStyle: React.CSSProperties = {
  width: "100%",
  height: "42px",
  padding: "0 12px",
  border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.04)",
  color: "#fff",
  outline: "none",
  boxSizing: "border-box",
}

const dropdownOptionsStyle: React.CSSProperties = {
  maxHeight: "220px",
  overflowY: "auto",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}

const dropdownOptionStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "none",
  background: "transparent",
  color: "#CBD5E1",
  textAlign: "left",
  cursor: "pointer",
  fontSize: "13px",
}

const dropdownOptionActiveStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, rgba(139,53,255,0.28), rgba(0,170,255,0.18))",
  color: "#fff",
}

const saveBtnStyle: React.CSSProperties = {
  marginTop: "18px",
  width: "100%",
  height: "50px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  borderRadius: "15px",
  border: "1px solid rgba(255,255,255,0.18)",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#fff",
  fontSize: "15px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 18px 38px rgba(139,53,255,0.30)",
}

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  maxHeight: "260px",
  overflowY: "auto",
  paddingRight: "4px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
}

const recebItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "13px",
  padding: "12px",
  borderRadius: "15px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
}

const recebDateStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "13px",
  background: "rgba(139,53,255,0.14)",
  border: "1px solid rgba(139,53,255,0.3)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
}

const recebDayStyle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 900,
  color: "#fff",
  lineHeight: 1,
}

const recebMonthStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 700,
  color: "#A78BFA",
}

const recebTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 700,
  color: "#fff",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}

const recebSubStyle: React.CSSProperties = {
  margin: "2px 0 0",
  fontSize: "12px",
  color: "#64748B",
}

const recebValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 800,
  color: "#37E884",
}

const recebTagStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "4px",
  fontSize: "11px",
  fontWeight: 700,
  color: "#00AAFF",
  background: "rgba(0,170,255,0.12)",
  border: "1px solid rgba(0,170,255,0.3)",
  borderRadius: "999px",
  padding: "2px 9px",
}

const recIconStyle: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "11px",
  background: "rgba(255,180,84,0.14)",
  border: "1px solid rgba(255,180,84,0.3)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFB454",
}

const recGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "14px",
}

const recCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "15px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
}

const recTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "8px",
  flexWrap: "wrap",
}

const recPeriodStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "11px",
  color: "#94A3B8",
  fontWeight: 600,
}

const recNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  fontWeight: 700,
  color: "#fff",
}

const recAmountStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "16px",
  fontWeight: 800,
  color: "#FF5B8A",
}

const recStatusBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
}

const recActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
}

const recDeleteBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  flexShrink: 0,
  color: "#FF8AAC",
  background: "rgba(255,91,138,0.12)",
  border: "1px solid rgba(255,91,138,0.30)",
}


const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.68)",
  backdropFilter: "blur(8px)",
  zIndex: 80,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
}

const modalCardStyle: React.CSSProperties = {
  width: "min(720px, 100%)",
  borderRadius: "24px",
  background: "linear-gradient(145deg, #080D19, #0D1D31)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
  padding: "24px",
  color: "#fff",
}

const modalHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "18px",
}

const modalTitleStyle: React.CSSProperties = {
  margin: "12px 0 0",
  fontSize: "22px",
  fontWeight: 900,
  lineHeight: 1.25,
}

const modalSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#94A3B8",
  fontSize: "13px",
}

const modalCloseButtonStyle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "13px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#CBD5E1",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

const modalInfoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "12px",
}

const infoDetalheStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  minWidth: 0,
}

const infoDetalheLabelStyle: React.CSSProperties = {
  display: "block",
  color: "#94A3B8",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "6px",
}

const infoDetalheValueStyle: React.CSSProperties = {
  display: "block",
  fontSize: "14px",
  lineHeight: 1.35,
  wordBreak: "break-word",
}

const modalNotesStyle: React.CSSProperties = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(139,53,255,0.08)",
  border: "1px solid rgba(139,53,255,0.18)",
}

const modalNotesLabelStyle: React.CSSProperties = {
  margin: "0 0 6px",
  color: "#94A3B8",
  fontSize: "12px",
  fontWeight: 800,
}

const modalNotesTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#CBD5E1",
  fontSize: "13px",
  lineHeight: 1.5,
}

const modalActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "18px",
  flexWrap: "wrap",
}

const modalDeleteButtonStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "11px 16px",
  borderRadius: "13px",
  border: "1px solid rgba(255,91,138,0.35)",
  background: "rgba(255,91,138,0.12)",
  color: "#FF8AAC",
  fontWeight: 800,
  cursor: "pointer",
}

const modalCancelButtonStyle: React.CSSProperties = {
  padding: "11px 16px",
  borderRadius: "13px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
}


const mobilePageStyle: React.CSSProperties = {
  ...pageStyle,
  width: "100%",
  maxWidth: "100%",
  overflowX: "hidden",
}

const mobileCardsGridStyle: React.CSSProperties = {
  ...cardsGridStyle,
  gridTemplateColumns: "1fr",
  gap: "14px",
}

const mobileOneColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "18px",
  marginTop: "22px",
  alignItems: "start",
}

const mobileCardStyle: React.CSSProperties = {
  padding: "18px",
  borderRadius: "22px",
}

const mobileSearchWrapStyle: React.CSSProperties = {
  ...searchWrapStyle,
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
}

const mobileMovimentacoesCardStyle: React.CSSProperties = {
  height: "auto",
  maxHeight: "none",
  display: "flex",
  flexDirection: "column",
}

const mobileNovaMovimentacaoCardStyle: React.CSSProperties = {
  height: "auto",
  display: "flex",
  flexDirection: "column",
}

const mobileFormGridStyle: React.CSSProperties = {
  ...formGridStyle,
  gridTemplateColumns: "1fr",
}

const mobileTableWrapStyle: React.CSSProperties = {
  ...tableWrapStyle,
  flex: "initial",
  maxHeight: "520px",
  gap: "12px",
  paddingRight: 0,
}

const mobileMovimentacaoItemStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "17px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
}

const mobileMovimentacaoTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "10px",
}

const mobileMovimentacaoDateStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#94A3B8",
  fontWeight: 700,
}

const mobileMovimentacaoTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: "15px",
  fontWeight: 800,
  lineHeight: 1.35,
}

const mobileMovimentacaoSubStyle: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#94A3B8",
  fontSize: "13px",
  lineHeight: 1.35,
}

const mobileMovimentacaoBottomStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "12px",
  flexWrap: "wrap",
}

const mobileMovimentacaoDeleteStyle: React.CSSProperties = {
  marginTop: "12px",
  width: "100%",
  height: "38px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  borderRadius: "12px",
  color: "#FF8AAC",
  background: "rgba(255,91,138,0.10)",
  border: "1px solid rgba(255,91,138,0.24)",
  fontSize: "12px",
  fontWeight: 800,
}

const mobileChartCardStyle: React.CSSProperties = {
  minHeight: "auto",
  height: "auto",
  overflow: "hidden",
}

const mobileRecebimentosCardStyle: React.CSSProperties = {
  minHeight: "auto",
  height: "auto",
  maxHeight: "none",
  overflowY: "visible",
}

const mobileRecGridStyle: React.CSSProperties = {
  ...recGridStyle,
  gridTemplateColumns: "1fr",
}

const mobileRecCardStyle: React.CSSProperties = {
  ...recCardStyle,
  alignItems: "stretch",
  flexDirection: "column",
}

const mobileRecActionsStyle: React.CSSProperties = {
  ...recActionsStyle,
  justifyContent: "stretch",
}

const mobileModalCardStyle: React.CSSProperties = {
  ...modalCardStyle,
  maxHeight: "88vh",
  overflowY: "auto",
  padding: "18px",
  borderRadius: "22px",
}

const mobileModalInfoGridStyle: React.CSSProperties = {
  ...modalInfoGridStyle,
  gridTemplateColumns: "1fr",
}

"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import {
  BarChart3,
  CalendarCheck2,
  DollarSign,
  Music2,
  Users,
  Wallet,
} from "lucide-react";

import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import ClientesCharts from "../../components/relatorios/ClientesCharts";
import ColaboradoresCharts from "../../components/relatorios/ColaboradoresCharts";
import EventosCharts from "../../components/relatorios/EventosCharts";
import ExportButtons from "../../components/relatorios/ExportButtons";
import FiltrosRelatorio from "../../components/relatorios/FiltrosRelatorio";
import FinanceiroCharts from "../../components/relatorios/FinanceiroCharts";
import FormatosCharts from "../../components/relatorios/FormatosCharts";
import ResumoCards from "../../components/relatorios/ResumoCards";
import type {
  ChartItem,
  ClienteRelatorio,
  EventoRelatorio,
  FiltrosRelatorioState,
  FinanceiroRelatorio,
  MensalItem,
  ResumoCardData,
} from "../../components/relatorios/types";
import { getEventStatus } from "../../lib/eventStatus";
import { supabase } from "../../lib/supabase";

const filtrosPadrao: FiltrosRelatorioState = {
  periodo: "30dias",
  dataInicial: "",
  dataFinal: "",
  evento: "",
  cliente: "",
  formato: "",
  cidade: "",
  tipoEvento: "",
  status: "",
};

export default function RelatoriosPage() {
  const [eventos, setEventos] = useState<EventoRelatorio[]>([]);
  const [financeiro, setFinanceiro] = useState<FinanceiroRelatorio[]>([]);
  const [clientes, setClientes] = useState<ClienteRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtrosRascunho, setFiltrosRascunho] = useState<FiltrosRelatorioState>(filtrosPadrao);
  const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosRelatorioState>(filtrosPadrao);

  useEffect(() => {
    carregarDados();
  }, []);

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarDados() {
    setCarregando(true);

    const user = await obterUsuarioLogado();

    if (!user) {
      setCarregando(false);
      return;
    }

    const eventosRes = await supabase.from("events").select("*").eq("user_id", user.id);
    const financeRes = await supabase.from("finance").select("*").eq("user_id", user.id);
    const clientesRes = await supabase.from("clients").select("*").eq("user_id", user.id);

    if (eventosRes.error) {
      console.error("Erro ao carregar eventos dos relatórios:", eventosRes.error);
      alert("Erro ao carregar eventos dos relatórios.");
      setCarregando(false);
      return;
    }

    if (financeRes.error) {
      console.error("Erro ao carregar financeiro dos relatórios:", financeRes.error);
      alert("Erro ao carregar financeiro dos relatórios.");
      setCarregando(false);
      return;
    }

    setEventos((eventosRes.data || []) as EventoRelatorio[]);
    setFinanceiro((financeRes.data || []) as FinanceiroRelatorio[]);
    setClientes(clientesRes.error ? [] : ((clientesRes.data || []) as ClienteRelatorio[]));
    setCarregando(false);
  }

  const periodoAtual = useMemo(() => obterPeriodo(filtrosAplicados), [filtrosAplicados]);
  const periodoAnterior = useMemo(() => obterPeriodoAnterior(periodoAtual), [periodoAtual]);

  const eventosFiltrados = useMemo(
    () => eventos.filter((evento) => eventoAtendeFiltros(evento, filtrosAplicados, periodoAtual)),
    [eventos, filtrosAplicados, periodoAtual]
  );

  const financeiroFiltrado = useMemo(
    () => financeiro.filter((item) => financeiroAtendeFiltros(item, filtrosAplicados, periodoAtual)),
    [financeiro, filtrosAplicados, periodoAtual]
  );

  const eventosPeriodoAnterior = useMemo(
    () => eventos.filter((evento) => eventoAtendeFiltros(evento, filtrosAplicados, periodoAnterior)),
    [eventos, filtrosAplicados, periodoAnterior]
  );

  const financeiroPeriodoAnterior = useMemo(
    () => financeiro.filter((item) => financeiroAtendeFiltros(item, filtrosAplicados, periodoAnterior)),
    [financeiro, filtrosAplicados, periodoAnterior]
  );

  const receitas = financeiroFiltrado.filter((item) => ehEntrada(item.type));
  const despesas = financeiroFiltrado.filter((item) => ehSaida(item.type));
  const receitasAnterior = financeiroPeriodoAnterior.filter((item) => ehEntrada(item.type));
  const despesasAnterior = financeiroPeriodoAnterior.filter((item) => ehSaida(item.type));

  const totalReceitas = somarFinanceiro(receitas);
  const totalDespesas = somarFinanceiro(despesas);
  const lucroLiquido = totalReceitas - totalDespesas;
  const totalReceitasAnterior = somarFinanceiro(receitasAnterior);
  const totalDespesasAnterior = somarFinanceiro(despesasAnterior);
  const lucroAnterior = totalReceitasAnterior - totalDespesasAnterior;

  const eventosRealizados = eventosFiltrados.filter((evento) => statusEvento(evento) === "realizado");
  const eventosPendentes = eventosFiltrados.filter((evento) => statusEvento(evento) === "pendente");
  const eventosFuturos = eventosFiltrados.filter((evento) => statusEvento(evento) !== "realizado");
  const clientesAtivos = quantidadeUnica(eventosFiltrados.map((evento) => textoOuPadrao(evento.client_name, "Cliente não informado")));
  const clientesCadastrados = clientes.length || quantidadeUnica(eventos.map((evento) => textoOuPadrao(evento.client_name, "Cliente não informado")));

  const resumoCards: ResumoCardData[] = [
    {
      titulo: "Total Faturado",
      valor: formatarMoeda(totalReceitas),
      detalhe: periodoAtual.rotulo,
      comparacao: comparar(totalReceitas, totalReceitasAnterior),
      cor: "#37E884",
      icon: <DollarSign size={24} />,
    },
    {
      titulo: "Receita Líquida",
      valor: formatarMoeda(lucroLiquido),
      detalhe: "Entradas - saídas",
      comparacao: comparar(lucroLiquido, lucroAnterior),
      cor: "#00AAFF",
      icon: <Wallet size={24} />,
    },
    {
      titulo: "Clientes Cadastrados",
      valor: String(clientesCadastrados),
      detalhe: "Base cadastrada",
      comparacao: `${clientesAtivos} com eventos no período`,
      cor: "#A855F7",
      icon: <Users size={24} />,
    },
    {
      titulo: "Total de Eventos",
      valor: String(eventosFiltrados.length),
      detalhe: `${eventosRealizados.length} realizados`,
      comparacao: comparar(eventosFiltrados.length, eventosPeriodoAnterior.length),
      cor: "#FFB454",
      icon: <CalendarCheck2 size={24} />,
    },
  ];

  const fluxoMensal = montarFluxoMensal(financeiroFiltrado);
  const receitasCategoria = limitar(agruparSoma(receitas, (item) => item.category || "Sem categoria", (item) => valorNumerico(item.amount)), 8);
  const despesasCategoria = limitar(agruparSoma(despesas, (item) => item.category || "Sem categoria", (item) => valorNumerico(item.amount)), 8);
  const receitasPagamento = limitar(agruparSoma(receitas, (item) => item.payment_method || "Não informado", (item) => valorNumerico(item.amount)), 8);

  const cidadesVisitadas = limitar(agruparContagem(eventosFiltrados, (evento) => cidadeEvento(evento)), 8);
  const eventosPorFormato = limitar(agruparContagem(eventosFiltrados, (evento) => evento.show_format || "Formato não informado"), 8);
  const eventosPorMes = montarEventosPorMes(eventosFiltrados);
  const duracaoMedia = calcularDuracaoMedia(eventosFiltrados);
  const eventosIndicadores: ChartItem[] = [
    { label: "Shows realizados", valor: eventosRealizados.length },
    { label: "Shows pendentes", valor: eventosPendentes.length },
    { label: "Shows futuros", valor: eventosFuturos.length },
    { label: "Maior cachê", valor: Math.max(...eventosFiltrados.map((evento) => valorNumerico(evento.fee)), 0) },
    { label: "Menor cachê", valor: menorValorPositivo(eventosFiltrados.map((evento) => valorNumerico(evento.fee))) },
  ];

  const clientesAgrupados = agruparContagem(eventosFiltrados, (evento) => evento.client_name || "Cliente não informado");
  const clientesRecorrentes = clientesAgrupados.filter((item) => item.valor > 1).length;
  const clientesOrigem = limitar(agruparContagem(eventosFiltrados, (evento) => origemCliente(evento)), 8);
  const clientesInativos = montarClientesInativos(eventosFiltrados);

  const formatosQuantidade = limitar(agruparContagem(eventosFiltrados, (evento) => evento.show_format || "Formato não informado"), 10);
  const formatosFaturamento = limitar(agruparSoma(eventosFiltrados, (evento) => evento.show_format || "Formato não informado", (evento) => valorNumerico(evento.fee)), 10);

  const financeiroColaboradores = financeiroFiltrado.filter((item) => normalizar(item.category || "").includes("colaborador"));
  const colaboradoresRanking = limitar(agruparContagem(financeiroColaboradores, (item) => nomeColaborador(item)), 10);
  const colaboradoresPagamentos = limitar(agruparSoma(financeiroColaboradores, (item) => nomeColaborador(item), (item) => valorNumerico(item.amount)), 10);

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório GIBA", 14, 20);

    doc.setFontSize(11);
    [
      `Período: ${periodoAtual.rotulo}`,
      `Total faturado: ${formatarMoeda(totalReceitas)}`,
      `Receita líquida: ${formatarMoeda(lucroLiquido)}`,
      `Clientes cadastrados: ${clientesCadastrados}`,
      `Total de eventos: ${eventosFiltrados.length}`,
    ].forEach((linha, index) => doc.text(linha, 14, 38 + index * 8));

    let y = 84;
    y = escreverSecaoPDF(doc, "Fluxo de Caixa", fluxoMensal.map((item) => [
      item.mes,
      `Entradas ${formatarMoeda(item.entradas)} | Saídas ${formatarMoeda(item.saidas)} | Lucro ${formatarMoeda(item.lucro)}`,
    ]), y);
    y = escreverSecaoPDF(doc, "Receitas por Categoria", chartParaLinhas(receitasCategoria, formatarMoeda), y);
    y = escreverSecaoPDF(doc, "Despesas por Categoria", chartParaLinhas(despesasCategoria, formatarMoeda), y);
    y = escreverSecaoPDF(doc, "Receitas por Forma de Pagamento", chartParaLinhas(receitasPagamento, formatarMoeda), y);
    y = escreverSecaoPDF(doc, "Indicadores de Eventos", eventosIndicadores.map((item) => [
      item.label,
      item.label.toLowerCase().includes("cachê") ? formatarMoeda(item.valor) : String(item.valor),
    ]).concat([["Tempo médio", duracaoMedia]]), y);
    y = escreverSecaoPDF(doc, "Cidades mais visitadas", chartParaLinhas(cidadesVisitadas), y);
    y = escreverSecaoPDF(doc, "Eventos por Formato", chartParaLinhas(eventosPorFormato), y);
    y = escreverSecaoPDF(doc, "Eventos por mês", chartParaLinhas(eventosPorMes), y);
    y = escreverSecaoPDF(doc, "Clientes", [
      ["Clientes novos", String(clientesAtivos)],
      ["Clientes recorrentes", String(clientesRecorrentes)],
    ], y);
    y = escreverSecaoPDF(doc, "Top 10 clientes", chartParaLinhas(limitar(clientesAgrupados, 10)), y);
    y = escreverSecaoPDF(doc, "Formatos - Quantidade", chartParaLinhas(formatosQuantidade), y);
    y = escreverSecaoPDF(doc, "Formatos - Faturamento", chartParaLinhas(formatosFaturamento, formatarMoeda), y);
    y = escreverSecaoPDF(doc, "Colaboradores - Participações", chartParaLinhas(colaboradoresRanking), y);
    escreverSecaoPDF(doc, "Colaboradores - Total recebido", chartParaLinhas(colaboradoresPagamentos, formatarMoeda), y);

    doc.save("relatorio-giba.pdf");
  }

  function exportarExcel() {
    const linhas = [
      ["Indicador", "Valor"],
      ["Período", periodoAtual.rotulo],
      ["Total Faturado", totalReceitas],
      ["Receita Líquida", lucroLiquido],
      ["Clientes Cadastrados", clientesCadastrados],
      ["Total de Eventos", eventosFiltrados.length],
      [],
      ["Fluxo de Caixa"],
      ["Mês", "Entradas", "Saídas", "Lucro"],
      ...fluxoMensal.map((item) => [item.mes, item.entradas, item.saidas, item.lucro]),
      [],
      ...secaoCSV("Receitas por Categoria", receitasCategoria),
      ...secaoCSV("Despesas por Categoria", despesasCategoria),
      ...secaoCSV("Receitas por Forma de Pagamento", receitasPagamento),
      ...secaoCSV("Indicadores de Eventos", eventosIndicadores.concat([{ label: "Tempo médio", valor: 0, detalhe: duracaoMedia }])),
      ...secaoCSV("Cidades mais visitadas", cidadesVisitadas),
      ...secaoCSV("Eventos por Formato", eventosPorFormato),
      ...secaoCSV("Eventos por mês", eventosPorMes),
      ...secaoCSV("Resumo de clientes", [
        { label: "Clientes novos", valor: clientesAtivos },
        { label: "Clientes recorrentes", valor: clientesRecorrentes },
      ]),
      ...secaoCSV("Origem dos clientes", clientesOrigem),
      ...secaoCSV("Top 10 clientes", limitar(clientesAgrupados, 10)),
      ...secaoCSV("Clientes sem contratar há mais tempo", clientesInativos),
      ...secaoCSV("Formatos - Quantidade", formatosQuantidade),
      ...secaoCSV("Formatos - Faturamento", formatosFaturamento),
      ...secaoCSV("Colaboradores - Participações", colaboradoresRanking),
      ...secaoCSV("Colaboradores - Total recebido", colaboradoresPagamentos),
    ];

    const csv = linhas.map((linha) => linha.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio-giba.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="relatorios">
        <AppLayout>
          <div className="min-h-screen text-white">
            <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-center gap-5">
                <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[24px] bg-gradient-to-br from-violet-600 to-sky-500 shadow-[0_20px_45px_rgba(59,130,246,0.22)]">
                  <BarChart3 size={36} />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-[-0.02em] text-white md:text-4xl">Relatórios</h1>
                  <p className="mt-2 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
                    Acompanhe indicadores financeiros, eventos, clientes e desempenho da sua carreira.
                  </p>
                </div>
              </div>

              <ExportButtons onExportPDF={exportarPDF} onExportExcel={exportarExcel} />
            </header>

            {carregando ? (
              <div className="rounded-3xl border border-white/[0.09] bg-white/[0.04] p-8 text-slate-300 shadow-[0_22px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
                Carregando relatórios...
              </div>
            ) : (
              <div className="grid gap-[26px]">
                <FiltrosRelatorio
                  filtros={filtrosRascunho}
                  onChange={(campo, valor) => setFiltrosRascunho((atual) => ({ ...atual, [campo]: valor }))}
                  onApply={() => setFiltrosAplicados(filtrosRascunho)}
                  onClear={() => {
                    setFiltrosRascunho(filtrosPadrao);
                    setFiltrosAplicados(filtrosPadrao);
                  }}
                />

                <ResumoCards cards={resumoCards} />

                <section className="grid gap-4">
                  <SectionTitle icon={<Wallet size={20} />} title="Relatórios Financeiros" />
                  <FinanceiroCharts
                    fluxo={fluxoMensal}
                    receitasCategoria={receitasCategoria}
                    despesasCategoria={despesasCategoria}
                    receitasPagamento={receitasPagamento}
                    formatarMoeda={formatarMoeda}
                  />
                </section>

                <section className="grid gap-4">
                  <SectionTitle icon={<CalendarCheck2 size={20} />} title="Relatórios de Eventos" />
                  <EventosCharts
                    cidades={cidadesVisitadas}
                    formatos={eventosPorFormato}
                    eventosMes={eventosPorMes}
                  />
                </section>

                <section className="grid gap-4">
                  <SectionTitle icon={<Users size={20} />} title="Relatórios de Clientes" />
                  <ClientesCharts
                    novos={clientesAtivos}
                    recorrentes={clientesRecorrentes}
                    origem={clientesOrigem}
                    topClientes={limitar(clientesAgrupados, 10)}
                    inativos={clientesInativos}
                  />
                </section>

                <section className="grid gap-4">
                  <SectionTitle icon={<Music2 size={20} />} title="Relatório de Formatos" />
                  <FormatosCharts
                    quantidade={formatosQuantidade}
                    faturamento={formatosFaturamento}
                    formatarMoeda={formatarMoeda}
                  />
                </section>

                <section className="grid gap-4">
                  <SectionTitle icon={<Users size={20} />} title="Relatório de Colaboradores" />
                  <ColaboradoresCharts
                    ranking={colaboradoresRanking}
                    pagamentos={colaboradoresPagamentos}
                    formatarMoeda={formatarMoeda}
                  />
                </section>
              </div>
            )}
          </div>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-violet-500/25 bg-violet-500/15 text-violet-200">
        {icon}
      </div>
      <h2 className="text-2xl font-black tracking-[-0.02em] text-white">{title}</h2>
    </div>
  );
}

function valorNumerico(valor: number | string | null | undefined) {
  if (typeof valor === "number") return valor;

  const valorLimpo = String(valor || "")
    .replace(/R\$/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  return Number(valorLimpo) || 0;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizar(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function ehEntrada(tipo: string) {
  return normalizar(tipo).includes("entrada") || normalizar(tipo).includes("receita");
}

function ehSaida(tipo: string) {
  const texto = normalizar(tipo);
  return texto.includes("saida") || texto.includes("despesa") || texto.includes("saã");
}

function somarFinanceiro(items: FinanceiroRelatorio[]) {
  return items.reduce((total, item) => total + valorNumerico(item.amount), 0);
}

function criarDataLocal(valor: string | null | undefined) {
  if (!valor) return null;
  const [data] = valor.split("T");
  const partes = data.split("-").map(Number);

  if (partes.length < 3 || partes.some(Number.isNaN)) return null;
  return new Date(partes[0], partes[1] - 1, partes[2]);
}

function inicioDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

function fimDoDia(data: Date) {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
}

function formatarDataInput(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterPeriodo(filtros: FiltrosRelatorioState) {
  const hoje = inicioDoDia(new Date());
  let inicio: Date | null = null;
  let fim: Date | null = fimDoDia(hoje);
  let rotulo = "Últimos 30 dias";

  if (filtros.periodo === "hoje") {
    inicio = hoje;
    rotulo = "Hoje";
  }

  if (filtros.periodo === "7dias") {
    inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 6);
    rotulo = "Últimos 7 dias";
  }

  if (filtros.periodo === "30dias") {
    inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 29);
  }

  if (filtros.periodo === "90dias") {
    inicio = new Date(hoje);
    inicio.setDate(hoje.getDate() - 89);
    rotulo = "Últimos 90 dias";
  }

  if (filtros.periodo === "ano") {
    inicio = new Date(hoje.getFullYear(), 0, 1);
    fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
    rotulo = `Ano ${hoje.getFullYear()}`;
  }

  if (filtros.periodo === "personalizado") {
    inicio = criarDataLocal(filtros.dataInicial);
    fim = filtros.dataFinal ? fimDoDia(criarDataLocal(filtros.dataFinal) || hoje) : null;
    rotulo = inicio && fim ? `${formatarDataInput(inicio)} até ${formatarDataInput(fim)}` : "Período personalizado";
  }

  return { inicio, fim, rotulo };
}

function obterPeriodoAnterior(periodo: { inicio: Date | null; fim: Date | null; rotulo: string }) {
  if (!periodo.inicio || !periodo.fim) return { inicio: null, fim: null, rotulo: "Período anterior" };

  const duracao = periodo.fim.getTime() - periodo.inicio.getTime();
  const fim = new Date(periodo.inicio.getTime() - 1);
  const inicio = new Date(fim.getTime() - duracao);
  return { inicio, fim, rotulo: "Período anterior" };
}

function dataDentroPeriodo(data: string, periodo: { inicio: Date | null; fim: Date | null }) {
  const dataObj = criarDataLocal(data);
  if (!dataObj) return false;
  if (periodo.inicio && dataObj < periodo.inicio) return false;
  if (periodo.fim && dataObj > periodo.fim) return false;
  return true;
}

function statusEvento(evento: EventoRelatorio) {
  return normalizar(evento.status || getEventStatus(evento.event_date) || "pendente");
}

function textoOuPadrao(valor: string | null | undefined, padrao: string) {
  return valor && valor.trim() ? valor.trim() : padrao;
}

function cidadeEvento(evento: EventoRelatorio) {
  const local = evento.location || "Cidade não informada";
  const partes = local.split(",").map((parte) => parte.trim()).filter(Boolean);
  return partes.length > 1 ? partes[partes.length - 2] : partes[0] || "Cidade não informada";
}

function eventoAtendeFiltros(evento: EventoRelatorio, filtros: FiltrosRelatorioState, periodo: { inicio: Date | null; fim: Date | null }) {
  if (!dataDentroPeriodo(evento.event_date, periodo)) return false;
  if (filtros.evento && evento.id !== filtros.evento) return false;
  if (filtros.cliente && evento.client_name !== filtros.cliente) return false;
  if (filtros.formato && evento.show_format !== filtros.formato) return false;
  if (filtros.cidade && cidadeEvento(evento) !== filtros.cidade) return false;
  if (filtros.tipoEvento && (evento.event_type || "") !== filtros.tipoEvento) return false;
  if (filtros.status && statusEvento(evento) !== filtros.status) return false;
  return true;
}

function financeiroAtendeFiltros(item: FinanceiroRelatorio, filtros: FiltrosRelatorioState, periodo: { inicio: Date | null; fim: Date | null }) {
  if (!dataDentroPeriodo(item.payment_date, periodo)) return false;
  if (filtros.cliente && item.client_name && item.client_name !== filtros.cliente) return false;
  return true;
}

function quantidadeUnica(items: string[]) {
  return new Set(items.filter(Boolean)).size;
}

function comparar(atual: number, anterior: number) {
  if (!anterior) return atual ? "Sem base anterior" : "Sem movimento";
  const percentual = ((atual - anterior) / Math.abs(anterior)) * 100;
  const sinal = percentual >= 0 ? "+" : "";
  return `${sinal}${percentual.toFixed(0)}% vs período anterior`;
}

function agruparContagem<T>(items: T[], labelFn: (item: T) => string) {
  const acc: Record<string, number> = {};
  items.forEach((item) => {
    const label = labelFn(item) || "Não informado";
    acc[label] = (acc[label] || 0) + 1;
  });
  return objectParaChartItems(acc);
}

function agruparSoma<T>(items: T[], labelFn: (item: T) => string, valueFn: (item: T) => number) {
  const acc: Record<string, number> = {};
  items.forEach((item) => {
    const label = labelFn(item) || "Não informado";
    acc[label] = (acc[label] || 0) + valueFn(item);
  });
  return objectParaChartItems(acc);
}

function objectParaChartItems(acc: Record<string, number>): ChartItem[] {
  return Object.entries(acc)
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function limitar(items: ChartItem[], limite: number) {
  return items.slice(0, limite);
}

function obterChaveMes(data: string) {
  const dataObj = criarDataLocal(data);
  if (!dataObj) return "Sem data";
  return `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, "0")}`;
}

function labelMes(chave: string) {
  if (chave === "Sem data") return chave;
  const [ano, mes] = chave.split("-").map(Number);
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

function montarFluxoMensal(items: FinanceiroRelatorio[]): MensalItem[] {
  const acc: Record<string, MensalItem> = {};

  items.forEach((item) => {
    const chave = obterChaveMes(item.payment_date);
    if (!acc[chave]) acc[chave] = { mes: labelMes(chave), entradas: 0, saidas: 0, lucro: 0 };

    if (ehEntrada(item.type)) acc[chave].entradas += valorNumerico(item.amount);
    if (ehSaida(item.type)) acc[chave].saidas += valorNumerico(item.amount);
    acc[chave].lucro = acc[chave].entradas - acc[chave].saidas;
  });

  return Object.entries(acc)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, item]) => item);
}

function montarEventosPorMes(eventos: EventoRelatorio[]) {
  const acc: Record<string, number> = {};
  eventos.forEach((evento) => {
    const chave = obterChaveMes(evento.event_date);
    acc[labelMes(chave)] = (acc[labelMes(chave)] || 0) + 1;
  });
  return objectParaChartItems(acc).sort((a, b) => a.label.localeCompare(b.label));
}

function menorValorPositivo(valores: number[]) {
  const positivos = valores.filter((valor) => valor > 0);
  return positivos.length ? Math.min(...positivos) : 0;
}

function calcularDuracaoMedia(eventos: EventoRelatorio[]) {
  const minutos = eventos
    .map((evento) => extrairMinutos(evento.show_duration || ""))
    .filter((valor) => valor > 0);

  if (minutos.length === 0) return "Não informado";
  const media = Math.round(minutos.reduce((total, valor) => total + valor, 0) / minutos.length);
  const horas = Math.floor(media / 60);
  const resto = media % 60;
  if (!horas) return `${resto} min`;
  return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

function extrairMinutos(valor: string) {
  const texto = normalizar(valor);
  const horas = texto.match(/(\d+)\s*h/);
  const minutos = texto.match(/(\d+)\s*m/);
  if (horas || minutos) return Number(horas?.[1] || 0) * 60 + Number(minutos?.[1] || 0);
  const numero = Number(texto.replace(/[^0-9]/g, ""));
  return numero > 10 ? numero : numero * 60;
}

function origemCliente(evento: EventoRelatorio) {
  const tipo = normalizar(evento.event_type || "");
  const origens = ["instagram", "whatsapp", "prefeitura", "site", "indicacao", "evento anterior", "outro"];
  const origem = origens.find((item) => tipo.includes(item));
  if (!origem) return "Não informado";
  if (origem === "indicacao") return "Indicação";
  return origem.charAt(0).toUpperCase() + origem.slice(1);
}

function montarClientesInativos(eventos: EventoRelatorio[]) {
  const acc: Record<string, Date> = {};
  eventos.forEach((evento) => {
    const cliente = evento.client_name || "Cliente não informado";
    const data = criarDataLocal(evento.event_date);
    if (!data) return;
    if (!acc[cliente] || data > acc[cliente]) acc[cliente] = data;
  });

  return Object.entries(acc)
    .sort((a, b) => a[1].getTime() - b[1].getTime())
    .slice(0, 10)
    .map(([label, data]) => ({ label, valor: Math.max(1, diasDesde(data)), detalhe: `Último evento em ${formatarData(formatarDataInput(data))}` }));
}

function diasDesde(data: Date) {
  const hoje = inicioDoDia(new Date());
  return Math.floor((hoje.getTime() - data.getTime()) / 86400000);
}

function nomeColaborador(item: FinanceiroRelatorio) {
  return item.client_name || item.description || item.category || "Colaborador não informado";
}

function formatarData(data: string) {
  const dataObj = criarDataLocal(data);
  if (!dataObj) return "Sem data";
  return dataObj.toLocaleDateString("pt-BR");
}

function chartParaLinhas(items: ChartItem[], formatValue?: (valor: number) => string) {
  return items.map((item) => [
    item.label,
    formatValue ? formatValue(item.valor) : String(item.valor),
    item.detalhe || "",
  ]);
}

function escreverSecaoPDF(doc: jsPDF, titulo: string, linhas: string[][], yInicial: number) {
  let y = yInicial;

  if (linhas.length === 0) return y;

  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text(titulo, 14, y);
  y += 8;
  doc.setFontSize(9);

  linhas.forEach((linha) => {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }

    const texto = linha.filter(Boolean).join(" | ");
    doc.text(texto.slice(0, 115), 14, y);
    y += 7;
  });

  return y + 5;
}

function secaoCSV(titulo: string, items: ChartItem[]) {
  return [
    [],
    [titulo],
    ["Descrição", "Valor", "Detalhe"],
    ...items.map((item) => [item.label, item.valor, item.detalhe || ""]),
  ];
}

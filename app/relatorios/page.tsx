"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";

import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import { supabase } from "../../lib/supabase";
import { getEventStatus } from "../../lib/eventStatus";

type Evento = {
  id: string;
  fee: number | string;
  event_date: string;
  show_format: string;
  client_name: string;
  user_id?: string;
};

type Financeiro = {
  id: string;
  type: string;
  category: string;
  amount: number;
  payment_date: string;
  user_id?: string;
};

export default function RelatoriosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [financeiro, setFinanceiro] = useState<Financeiro[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

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

    const eventosRes = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id);

    const financeRes = await supabase
      .from("finance")
      .select("*")
      .eq("user_id", user.id);

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

    setEventos((eventosRes.data || []) as Evento[]);
    setFinanceiro((financeRes.data || []) as Financeiro[]);

    setCarregando(false);
  }

  function valorNumerico(valor: number | string) {
    if (typeof valor === "number") return valor;

    const valorLimpo = String(valor || "")
      .replace(/R\$/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim();

    return Number(valorLimpo) || 0;
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function obterChaveMes(data: string) {
    if (!data) return "Sem data";

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return "Sem data";

    const mes = String(dataObj.getMonth() + 1).padStart(2, "0");
    const ano = dataObj.getFullYear();

    return `${mes}/${ano}`;
  }

  function exportarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Relatório GIBA", 14, 20);

    doc.setFontSize(11);

    const linhas = [
      `Shows realizados: ${eventosRealizados.length}`,
      `Shows futuros: ${eventosFuturos.length}`,
      `Receitas: ${formatarMoeda(totalReceitas)}`,
      `Despesas: ${formatarMoeda(totalDespesas)}`,
      `Lucro líquido: ${formatarMoeda(lucroLiquido)}`,
    ];

    linhas.forEach((linha, index) => {
      doc.text(linha, 14, 40 + index * 10);
    });

    let y = 105;

    doc.setFontSize(14);
    doc.text("Comparativo Mensal", 14, y);

    y += 10;

    doc.setFontSize(10);

    comparativoMensal.forEach((item) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(
        `${item.mes} | Receitas: ${formatarMoeda(item.receitas)} | Despesas: ${formatarMoeda(
          item.despesas
        )} | Lucro: ${formatarMoeda(item.lucro)}`,
        14,
        y
      );

      y += 8;
    });

    doc.save("relatorio-giba.pdf");
  }

  function exportarExcel() {
    const linhas = [
      ["Indicador", "Valor"],
      ["Shows Realizados", eventosRealizados.length],
      ["Shows Futuros", eventosFuturos.length],
      ["Receitas", totalReceitas],
      ["Despesas", totalDespesas],
      ["Lucro Líquido", lucroLiquido],
      [],
      ["Comparativo Mensal"],
      ["Mês", "Receitas", "Despesas", "Lucro"],
      ...comparativoMensal.map((item) => [
        item.mes,
        item.receitas,
        item.despesas,
        item.lucro,
      ]),
    ];

    const csv = linhas.map((linha) => linha.join(";")).join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "relatorio-giba.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();

  const eventosFiltrados = eventos.filter((evento) => {
    if (filtroPeriodo === "todos") return true;

    const dataEvento = new Date(evento.event_date);

    if (filtroPeriodo === "mes") {
      return (
        dataEvento.getMonth() + 1 === mesAtual &&
        dataEvento.getFullYear() === anoAtual
      );
    }

    if (filtroPeriodo === "ano") {
      return dataEvento.getFullYear() === anoAtual;
    }

    if (filtroPeriodo === "personalizado" && dataInicial && dataFinal) {
      return dataEvento >= new Date(dataInicial) && dataEvento <= new Date(dataFinal);
    }

    return true;
  });

  const financeiroFiltrado = financeiro.filter((item) => {
    if (filtroPeriodo === "todos") return true;

    const dataItem = new Date(item.payment_date);

    if (filtroPeriodo === "mes") {
      return (
        dataItem.getMonth() + 1 === mesAtual &&
        dataItem.getFullYear() === anoAtual
      );
    }

    if (filtroPeriodo === "ano") {
      return dataItem.getFullYear() === anoAtual;
    }

    if (filtroPeriodo === "personalizado" && dataInicial && dataFinal) {
      return dataItem >= new Date(dataInicial) && dataItem <= new Date(dataFinal);
    }

    return true;
  });

  const eventosRealizados = eventosFiltrados.filter(
    (evento) => getEventStatus(evento.event_date) === "realizado"
  );

  const eventosFuturos = eventosFiltrados.filter(
    (evento) => getEventStatus(evento.event_date) !== "realizado"
  );

  const receitas = financeiroFiltrado.filter((item) => item.type === "Entrada");
  const despesas = financeiroFiltrado.filter((item) => item.type === "Saída");

  const totalReceitas = receitas.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const totalDespesas = despesas.reduce(
    (total, item) => total + Number(item.amount || 0),
    0
  );

  const lucroLiquido = totalReceitas - totalDespesas;

  const despesasPorCategoria = despesas.reduce((acc, item) => {
    const categoria = item.category || "Sem categoria";

    if (!acc[categoria]) {
      acc[categoria] = 0;
    }

    acc[categoria] += Number(item.amount || 0);

    return acc;
  }, {} as Record<string, number>);

  const showsPorFormato = eventosFiltrados.reduce((acc, evento) => {
    const formato = evento.show_format || "Formato não informado";

    if (!acc[formato]) {
      acc[formato] = 0;
    }

    acc[formato] += 1;

    return acc;
  }, {} as Record<string, number>);

  const rankingClientes = eventosFiltrados.reduce(
    (acc, evento) => {
      const cliente = evento.client_name || "Cliente não informado";

      if (!acc[cliente]) {
        acc[cliente] = 0;
      }

      acc[cliente] += 1;

      return acc;
    },
    {} as Record<string, number>
  );

  const rankingOrdenado = Object.entries(rankingClientes).sort((a, b) => b[1] - a[1]);

  const comparativoMensalMap = financeiroFiltrado.reduce((acc, item) => {
    const mes = obterChaveMes(item.payment_date);

    if (!acc[mes]) {
      acc[mes] = {
        mes,
        receitas: 0,
        despesas: 0,
        lucro: 0,
      };
    }

    if (item.type === "Entrada") {
      acc[mes].receitas += Number(item.amount || 0);
    }

    if (item.type === "Saída") {
      acc[mes].despesas += Number(item.amount || 0);
    }

    acc[mes].lucro = acc[mes].receitas - acc[mes].despesas;

    return acc;
  }, {} as Record<string, { mes: string; receitas: number; despesas: number; lucro: number }>);

  const comparativoMensal = Object.values(comparativoMensalMap).sort((a, b) => {
    const [mesA, anoA] = a.mes.split("/").map(Number);
    const [mesB, anoB] = b.mes.split("/").map(Number);

    return anoA - anoB || mesA - mesB;
  });

  const maiorValorGrafico = Math.max(
    totalReceitas,
    totalDespesas,
    Math.abs(lucroLiquido),
    1
  );

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="relatorios">
        <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "34px" }}>Relatórios</h1>

          <div style={filtroBoxStyle}>
            <button
              onClick={() => setFiltroPeriodo("todos")}
              style={filtroPeriodo === "todos" ? filtroAtivoStyle : filtroButtonStyle}
            >
              Todos
            </button>

            <button
              onClick={() => setFiltroPeriodo("mes")}
              style={filtroPeriodo === "mes" ? filtroAtivoStyle : filtroButtonStyle}
            >
              Este mês
            </button>

            <button
              onClick={() => setFiltroPeriodo("ano")}
              style={filtroPeriodo === "ano" ? filtroAtivoStyle : filtroButtonStyle}
            >
              Ano Atual
            </button>

            <button
              onClick={() => setFiltroPeriodo("personalizado")}
              style={
                filtroPeriodo === "personalizado" ? filtroAtivoStyle : filtroButtonStyle
              }
            >
              Personalizado
            </button>
          </div>

          {filtroPeriodo === "personalizado" && (
            <div style={filtroDataStyle}>
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                style={inputFiltroStyle}
              />

              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                style={inputFiltroStyle}
              />
            </div>
          )}

          <div style={acoesRelatorioStyle}>
            <button onClick={exportarPDF} style={botaoAcaoStyle}>
              Exportar PDF
            </button>

            <button onClick={exportarExcel} style={botaoAcaoStyle}>
              Exportar Excel
            </button>
          </div>

          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <>
              <div style={gridStyle}>
                <CardRelatorio titulo="Receitas" valor={formatarMoeda(totalReceitas)} />

                <CardRelatorio titulo="Despesas" valor={formatarMoeda(totalDespesas)} />

                <CardRelatorio titulo="Lucro Líquido" valor={formatarMoeda(lucroLiquido)} />

                <CardRelatorio
                  titulo="Shows Realizados"
                  valor={String(eventosRealizados.length)}
                />
              </div>

              <section style={{ ...cardStyle, marginTop: "24px" }}>
                <h2>Gráfico Financeiro</h2>

                <div style={graficoContainerStyle}>
                  <div>
                    <p>Receitas</p>

                    <div
                      style={{
                        ...barraGraficoStyle,
                        width: `${(totalReceitas / maiorValorGrafico) * 100}%`,
                        background: "#22c55e",
                      }}
                    />

                    <strong>{formatarMoeda(totalReceitas)}</strong>
                  </div>

                  <div>
                    <p>Despesas</p>

                    <div
                      style={{
                        ...barraGraficoStyle,
                        width: `${(totalDespesas / maiorValorGrafico) * 100}%`,
                        background: "#ef4444",
                      }}
                    />

                    <strong>{formatarMoeda(totalDespesas)}</strong>
                  </div>

                  <div>
                    <p>Lucro Líquido</p>

                    <div
                      style={{
                        ...barraGraficoStyle,
                        width: `${(Math.abs(lucroLiquido) / maiorValorGrafico) * 100}%`,
                        background: lucroLiquido >= 0 ? "#3b82f6" : "#f97316",
                      }}
                    />

                    <strong>{formatarMoeda(lucroLiquido)}</strong>
                  </div>
                </div>
              </section>

              <section style={{ ...cardStyle, marginTop: "24px" }}>
                <h2>Comparativo Mensal</h2>

                {comparativoMensal.length === 0 ? (
                  <p style={{ color: "#b8b8d8" }}>Nenhum lançamento encontrado.</p>
                ) : (
                  <div style={tabelaScrollStyle}>
                    <table style={tabelaStyle}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Mês</th>
                          <th style={thStyle}>Receitas</th>
                          <th style={thStyle}>Despesas</th>
                          <th style={thStyle}>Lucro</th>
                        </tr>
                      </thead>

                      <tbody>
                        {comparativoMensal.map((item) => (
                          <tr key={item.mes}>
                            <td style={tdStyle}>{item.mes}</td>
                            <td style={tdStyle}>{formatarMoeda(item.receitas)}</td>
                            <td style={tdStyle}>{formatarMoeda(item.despesas)}</td>
                            <td
                              style={{
                                ...tdStyle,
                                color: item.lucro >= 0 ? "#22c55e" : "#ef4444",
                                fontWeight: "bold",
                              }}
                            >
                              {formatarMoeda(item.lucro)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section style={{ ...cardStyle, marginTop: "24px" }}>
                <h2>Despesas por Categoria</h2>

                {Object.entries(despesasPorCategoria).length === 0 ? (
                  <p style={{ color: "#b8b8d8" }}>Nenhuma despesa encontrada.</p>
                ) : (
                  Object.entries(despesasPorCategoria).map(([categoria, valor]) => (
                    <div key={categoria} style={linhaCategoriaStyle}>
                      <span>{categoria}</span>
                      <strong>{formatarMoeda(valor)}</strong>
                    </div>
                  ))
                )}
              </section>

              <section style={{ ...cardStyle, marginTop: "24px" }}>
                <h2>Shows por Formato</h2>

                {Object.entries(showsPorFormato).length === 0 ? (
                  <p style={{ color: "#b8b8d8" }}>Nenhum show encontrado.</p>
                ) : (
                  Object.entries(showsPorFormato).map(([formato, quantidade]) => (
                    <div key={formato} style={linhaCategoriaStyle}>
                      <span>{formato}</span>
                      <strong>{quantidade}</strong>
                    </div>
                  ))
                )}
              </section>

              <section style={{ ...cardStyle, marginTop: "24px" }}>
                <h2>Ranking de Clientes</h2>

                {rankingOrdenado.length === 0 ? (
                  <p style={{ color: "#b8b8d8" }}>Nenhum cliente encontrado.</p>
                ) : (
                  rankingOrdenado.slice(0, 5).map(([cliente, quantidade]) => (
                    <div key={cliente} style={linhaCategoriaStyle}>
                      <span>{cliente}</span>
                      <strong>
                        {quantidade} show{quantidade > 1 ? "s" : ""}
                      </strong>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </div>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

function CardRelatorio({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div style={cardStyle}>
      <p style={tituloStyle}>{titulo}</p>
      <h2 style={valorStyle}>{valor}</h2>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "18px",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
};

const tituloStyle: React.CSSProperties = {
  margin: 0,
  color: "#b8b8d8",
};

const valorStyle: React.CSSProperties = {
  marginTop: "12px",
  fontSize: "32px",
  fontWeight: "bold",
};

const linhaCategoriaStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px 0",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  gap: "16px",
};

const filtroBoxStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
  margin: "20px 0",
};

const filtroButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
};

const filtroAtivoStyle: React.CSSProperties = {
  ...filtroButtonStyle,
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
};

const filtroDataStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const inputFiltroStyle: React.CSSProperties = {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#fff",
};

const acoesRelatorioStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const botaoAcaoStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: "bold",
};

const graficoContainerStyle: React.CSSProperties = {
  display: "grid",
  gap: "18px",
};

const barraGraficoStyle: React.CSSProperties = {
  height: "24px",
  borderRadius: "999px",
  marginBottom: "6px",
};

const tabelaScrollStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tabelaStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "620px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,0.16)",
  color: "#b8b8d8",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

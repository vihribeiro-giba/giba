"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: string;
  title: string;
  client_name: string;
  event_date: string;
  fee: number;
};

type Financeiro = {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  event_id: string | null;
  event_name: string;
  client_name: string;
  payment_method: string;
  payment_date: string;
  notes: string;
  reference_month: number;
  reference_year: number;
};

export default function FinanceiroPage() {
  const hoje = new Date();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Financeiro[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [mesFiltro, setMesFiltro] = useState(hoje.getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState(hoje.getFullYear());

  const [type, setType] = useState("Entrada");
  const [category, setCategory] = useState("Cachê");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentDate, setPaymentDate] = useState("");
  const [notes, setNotes] = useState("");

  const categoriasEntrada = ["Cachê", "Sinal", "Pagamento Integral", "Patrocínio", "Extra"];
  const categoriasSaida = ["Combustível", "Colaboradores", "Hospedagem", "Transporte", "Alimentação", "Produção", "Outros"];

  async function carregarEventos() {
    const { data } = await supabase
      .from("events")
      .select("id, title, client_name, event_date, fee")
      .order("event_date", { ascending: false });

    setEventos(data || []);
  }

  async function carregarFinanceiro() {
    const { data } = await supabase
      .from("finance")
      .select("*")
      .order("payment_date", { ascending: false });

    setMovimentacoes(data || []);
  }

  function selecionarEvento(id: string) {
    setEventId(id);

    const evento = eventos.find((item) => item.id === id);

    if (evento) {
      setEventName(evento.title);
      setClientName(evento.client_name);
      setAmount(String(evento.fee || ""));
      setDescription(`Pagamento referente ao evento: ${evento.title}`);
    }
  }

  function limparFormulario() {
    setEditandoId(null);
    setType("Entrada");
    setCategory("Cachê");
    setDescription("");
    setAmount("");
    setEventId("");
    setEventName("");
    setClientName("");
    setPaymentMethod("PIX");
    setPaymentDate("");
    setNotes("");
  }

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();

    if (!amount || !paymentDate) {
      alert("Preencha valor e data.");
      return;
    }

    const dataPagamento = new Date(paymentDate + "T00:00:00");

    const dados = {
      type,
      category,
      description,
      amount: Number(amount),
      event_id: eventId || null,
      event_name: eventName,
      client_name: clientName,
      payment_method: paymentMethod,
      payment_date: paymentDate,
      notes,
      reference_month: dataPagamento.getMonth() + 1,
      reference_year: dataPagamento.getFullYear(),
    };

    if (editandoId) {
      const { error } = await supabase
        .from("finance")
        .update(dados)
        .eq("id", editandoId);

      if (error) {
        alert("Erro ao atualizar lançamento.");
        return;
      }
    } else {
      const { error } = await supabase.from("finance").insert(dados);

      if (error) {
        alert("Erro ao salvar lançamento.");
        return;
      }
    }

    limparFormulario();
    carregarFinanceiro();
  }

  function editarMovimentacao(item: Financeiro) {
    setEditandoId(item.id);
    setType(item.type || "Entrada");
    setCategory(item.category || "Cachê");
    setDescription(item.description || "");
    setAmount(String(item.amount || ""));
    setEventId(item.event_id || "");
    setEventName(item.event_name || "");
    setClientName(item.client_name || "");
    setPaymentMethod(item.payment_method || "PIX");
    setPaymentDate(item.payment_date || "");
    setNotes(item.notes || "");
  }

  async function excluirMovimentacao(id: string) {
    const confirmar = confirm("Deseja excluir este lançamento?");
    if (!confirmar) return;

    const { error } = await supabase.from("finance").delete().eq("id", id);

    if (error) {
      alert("Erro ao excluir lançamento.");
      return;
    }

    carregarFinanceiro();
  }

  const movimentacoesMes = useMemo(() => {
    return movimentacoes.filter(
      (item) =>
        Number(item.reference_month) === Number(mesFiltro) &&
        Number(item.reference_year) === Number(anoFiltro)
    );
  }, [movimentacoes, mesFiltro, anoFiltro]);

  const resumoMensal = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    movimentacoesMes.forEach((item) => {
      if (item.type === "Entrada") entradas += Number(item.amount);
      else saidas += Number(item.amount);
    });

    return {
      entradas,
      saidas,
      liquido: entradas - saidas,
    };
  }, [movimentacoesMes]);

  const resumoAnual = useMemo(() => {
    const itensAno = movimentacoes.filter(
      (item) => Number(item.reference_year) === Number(anoFiltro)
    );

    let entradas = 0;
    let saidas = 0;

    itensAno.forEach((item) => {
      if (item.type === "Entrada") entradas += Number(item.amount);
      else saidas += Number(item.amount);
    });

    return {
      bruto: entradas,
      despesas: saidas,
      liquido: entradas - saidas,
    };
  }, [movimentacoes, anoFiltro]);

  useEffect(() => {
    carregarEventos();
    carregarFinanceiro();
  }, []);

  useEffect(() => {
    setCategory(type === "Entrada" ? "Cachê" : "Combustível");
  }, [type]);

  return (
  <ProtectedRoute adminOnly>
    <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Financeiro GIBA
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Controle mensal e anual de entradas, pagamentos e despesas.
        </p>

        <div style={filterBar}>
          <select style={inputStyle} value={mesFiltro} onChange={(e) => setMesFiltro(Number(e.target.value))}>
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>

          <input
            style={inputStyle}
            type="number"
            value={anoFiltro}
            onChange={(e) => setAnoFiltro(Number(e.target.value))}
          />
        </div>

        <div style={cardsGrid}>
          <Card titulo="Entradas do Mês" valor={resumoMensal.entradas} cor="#37e884" />
          <Card titulo="Saídas do Mês" valor={resumoMensal.saidas} cor="#ff5b8a" />
          <Card titulo="Lucro Líquido do Mês" valor={resumoMensal.liquido} cor="#38bdf8" />
          <Card titulo="Faturamento Bruto Anual" valor={resumoAnual.bruto} cor="#8b35ff" />
          <Card titulo="Despesas Anuais" valor={resumoAnual.despesas} cor="#ff7aa2" />
          <Card titulo="Lucro Líquido Anual" valor={resumoAnual.liquido} cor="#00aaff" />
        </div>

        <div style={mainGrid}>
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>
              {editandoId ? "Editar Lançamento" : "Novo Lançamento"}
            </h2>

            <form onSubmit={salvarMovimentacao} style={{ display: "grid", gap: "12px" }}>
              <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
                <option>Entrada</option>
                <option>Saída</option>
              </select>

              <select style={inputStyle} value={category} onChange={(e) => setCategory(e.target.value)}>
                {(type === "Entrada" ? categoriasEntrada : categoriasSaida).map((cat) => (
                  <option key={cat}>{cat}</option>
                ))}
              </select>

              {type === "Entrada" && (
                <select style={inputStyle} value={eventId} onChange={(e) => selecionarEvento(e.target.value)}>
                  <option value="">Vincular a um evento</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.event_date} - {evento.client_name}
                    </option>
                  ))}
                </select>
              )}

              <input
                style={inputStyle}
                placeholder="Cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="Evento"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />

              <input
                style={inputStyle}
                placeholder="Descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <input
                style={inputStyle}
                type="number"
                placeholder="Valor"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              <select style={inputStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>PIX</option>
                <option>Dinheiro</option>
                <option>Cartão de Crédito</option>
                <option>Cartão de Débito</option>
                <option>Transferência</option>
                <option>Boleto</option>
              </select>

              <input
                style={inputStyle}
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />

              <textarea
                style={{ ...inputStyle, minHeight: "90px" }}
                placeholder="Observações"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <button type="submit" style={botaoPrincipal}>
                {editandoId ? "Salvar Alterações" : "Salvar Lançamento"}
              </button>

              {editandoId && (
                <button type="button" onClick={limparFormulario} style={botaoSecundario}>
                  Cancelar edição
                </button>
              )}
            </form>
          </section>

          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Movimentações do Mês</h2>

            <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
              {movimentacoesMes.map((item) => (
                <div key={item.id} style={movementCard}>
                  <div>
                    <strong>{item.description || item.category}</strong>
                    <p style={textoMuted}>
                      {item.type} • {item.category} • {item.payment_date}
                    </p>
                    <p style={textoMuted}>
                      {item.client_name || "-"} {item.event_name ? `| ${item.event_name}` : ""}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <strong style={{ color: item.type === "Entrada" ? "#37e884" : "#ff5b8a" }}>
                      R$ {Number(item.amount).toFixed(2)}
                    </strong>

                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <button onClick={() => editarMovimentacao(item)} style={botaoEditar}>
                        Editar
                      </button>
                      <button onClick={() => excluirMovimentacao(item.id)} style={botaoExcluir}>
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {movimentacoesMes.length === 0 && (
                <p style={{ color: "#b8b8d8" }}>
                  Nenhuma movimentação neste mês.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
        </AppLayout>
  </ProtectedRoute>
);
}

function Card({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#b8b8d8", margin: 0 }}>{titulo}</p>
      <h2 style={{ color: cor, margin: "12px 0 0" }}>
        R$ {valor.toFixed(2)}
      </h2>
    </div>
  );
}

const filterBar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px 160px",
  gap: "12px",
  marginBottom: "20px",
};

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
  marginBottom: "24px",
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "420px 1fr",
  gap: "24px",
  alignItems: "start",
};

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "20px",
  padding: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: "15px",
  boxSizing: "border-box",
};

const botaoPrincipal: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoSecundario: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
};

const movementCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "16px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const textoMuted: React.CSSProperties = {
  color: "#b8b8d8",
  margin: "6px 0",
};

const botaoEditar: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(0,170,255,0.18)",
  color: "#38bdf8",
  cursor: "pointer",
};

const botaoExcluir: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,91,138,0.18)",
  color: "#ff7aa2",
  cursor: "pointer",
};
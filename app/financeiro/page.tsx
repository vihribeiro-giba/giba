"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
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

type Vinculo = {
  id: string;
  event_id: string;
  collaborator_id: string;
};

type Colaborador = {
  id: string;
  user_id?: string;
  nome?: string;
  name?: string;
  role?: string;
  funcao?: string;
};

type Financeiro = {
  id: string;
  user_id?: string;
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
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");

  const [movimentacoes, setMovimentacoes] = useState<Financeiro[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  const categoriasEntrada = [
    "Cachê",
    "Sinal",
    "Pagamento Integral",
    "Patrocínio",
    "Extra",
  ];

  const categoriasSaida = [
    "Combustível",
    "Colaboradores",
    "Hospedagem",
    "Transporte",
    "Alimentação",
    "Produção",
    "Marketing",
    "Impostos",
    "Cachê Artista",
    "Efeitos Especiais",
    "Outros",
  ];

  async function obterUsuarioLogado() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Erro ao buscar usuário logado:", error);
      return null;
    }

    return user;
  }

  async function carregarEventos() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setEventos([]);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("id, title, client_name, event_date, fee")
      .eq("user_id", user.id)
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar eventos:", error);
      setEventos([]);
      return;
    }

    setEventos(data || []);
  }

  async function carregarColaboradores() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setColaboradores([]);
      return;
    }

    const { data, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao carregar colaboradores:", error);
      setColaboradores([]);
      return;
    }

    setColaboradores(data || []);
  }

  async function carregarVinculos() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setVinculos([]);
      return;
    }

    const { data: eventosDoUsuario, error: eventosError } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id);

    if (eventosError) {
      console.error("Erro ao buscar eventos para vínculos:", eventosError);
      setVinculos([]);
      return;
    }

    const eventIds = (eventosDoUsuario || []).map((evento) => evento.id);

    if (eventIds.length === 0) {
      setVinculos([]);
      return;
    }

    const { data, error } = await supabase
      .from("event_collaborators")
      .select("*")
      .in("event_id", eventIds);

    if (error) {
      console.error("Erro ao carregar vínculos:", error);
      setVinculos([]);
      return;
    }

    setVinculos(data || []);
  }

  async function carregarFinanceiro() {
    setCarregando(true);

    const user = await obterUsuarioLogado();

    if (!user) {
      setMovimentacoes([]);
      setCarregando(false);
      return;
    }

    const { data, error } = await supabase
      .from("finance")
      .select("*")
      .eq("user_id", user.id)
      .order("payment_date", { ascending: false });

    if (error) {
      console.error("Erro ao carregar financeiro:", error);
      alert("Erro ao carregar financeiro.");
      setMovimentacoes([]);
      setCarregando(false);
      return;
    }

    setMovimentacoes(data || []);
    setCarregando(false);
  }

  function nomeColaborador(colaborador: Colaborador) {
    return colaborador.nome || colaborador.name || "Colaborador sem nome";
  }

  function funcaoColaborador(colaborador: Colaborador) {
    return colaborador.role || colaborador.funcao || "";
  }

  function selecionarEvento(id: string) {
    setEventId(id);
    setColaboradorSelecionado("");

    const evento = eventos.find((item) => item.id === id);

    if (!evento) {
      setEventName("");
      setClientName("");
      return;
    }

    setEventName(evento.title || "");

    if (type === "Entrada") {
      setClientName(evento.client_name || "");
      setAmount(String(evento.fee || ""));
      setDescription(
        `Pagamento referente ao evento: ${evento.title || evento.client_name}`
      );
    } else {
      setClientName("");
      setAmount("");
      setDescription(
        `Despesa referente ao evento: ${evento.title || evento.client_name}`
      );
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
    setColaboradorSelecionado("");
    setPaymentMethod("PIX");
    setPaymentDate("");
    setNotes("");
  }

  async function salvarMovimentacao(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();

    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    if (!amount || !paymentDate) {
      alert("Preencha valor e data.");
      return;
    }

    if (
      type === "Saída" &&
      eventId &&
      category === "Colaboradores" &&
      !colaboradorSelecionado
    ) {
      alert("Selecione o colaborador vinculado ao evento.");
      return;
    }

    const dataPagamento = new Date(paymentDate + "T00:00:00");

    const descricaoFinal =
      type === "Saída" && colaboradorSelecionado
        ? `${description || "Pagamento de colaborador"} - ${colaboradorSelecionado}`
        : description;

    const dados = {
      user_id: user.id,
      type,
      category,
      description: descricaoFinal,
      amount: Number(amount),
      event_id: eventId || null,
      event_name: eventName,
      client_name: type === "Entrada" ? clientName : colaboradorSelecionado,
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
        .eq("id", editandoId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar lançamento:", error);
        alert("Erro ao atualizar lançamento.");
        return;
      }
    } else {
      const { error } = await supabase.from("finance").insert(dados);

      if (error) {
        console.error("Erro ao salvar lançamento:", error);
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
    setPaymentMethod(item.payment_method || "PIX");
    setPaymentDate(item.payment_date || "");
    setNotes(item.notes || "");

    if (item.type === "Saída") {
      setColaboradorSelecionado(item.client_name || "");
      setClientName("");
    } else {
      setClientName(item.client_name || "");
      setColaboradorSelecionado("");
    }
  }

  async function excluirMovimentacao(id: string) {
    const confirmar = confirm("Deseja excluir este lançamento?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();

    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    const { error } = await supabase
      .from("finance")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir lançamento:", error);
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
    carregarColaboradores();
    carregarVinculos();
  }, []);

  useEffect(() => {
    setCategory(type === "Entrada" ? "Cachê" : "Combustível");

    if (eventId) {
      const evento = eventos.find((item) => item.id === eventId);

      if (evento) {
        if (type === "Entrada") {
          setClientName(evento.client_name || "");
          setAmount(String(evento.fee || ""));
          setDescription(
            `Pagamento referente ao evento: ${evento.title || evento.client_name}`
          );
          setColaboradorSelecionado("");
        } else {
          setClientName("");
          setAmount("");
          setDescription(
            `Despesa referente ao evento: ${evento.title || evento.client_name}`
          );
        }
      }
    }
  }, [type]);

  const colaboradoresEvento = vinculos.filter((item) => item.event_id === eventId);

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="financeiro">
        <AppLayout>
        <div>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
            Financeiro GIBA
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
            Controle mensal e anual de entradas, pagamentos e despesas.
          </p>

          <div style={filterBar}>
            <select
              style={inputStyle}
              value={mesFiltro}
              onChange={(e) => setMesFiltro(Number(e.target.value))}
            >
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
                <select
                  style={inputStyle}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option>Entrada</option>
                  <option>Saída</option>
                </select>

                <select
                  style={inputStyle}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {(type === "Entrada" ? categoriasEntrada : categoriasSaida).map((cat) => (
                    <option key={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  style={inputStyle}
                  value={eventId}
                  onChange={(e) => selecionarEvento(e.target.value)}
                >
                  <option value="">Vincular a um evento</option>

                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.event_date} - {evento.client_name}
                    </option>
                  ))}
                </select>

                {type === "Entrada" && (
                  <input
                    style={inputStyle}
                    placeholder="Cliente"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                )}

                {type === "Saída" && eventId && (
                  <select
                    value={colaboradorSelecionado}
                    onChange={(e) => setColaboradorSelecionado(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Selecione o colaborador</option>

                    {colaboradoresEvento.map((vinculo) => {
                      const colaborador = colaboradores.find(
                        (c) => c.id === vinculo.collaborator_id
                      );

                      if (!colaborador) return null;

                      const nome = nomeColaborador(colaborador);
                      const funcao = funcaoColaborador(colaborador);

                      return (
                        <option key={colaborador.id} value={nome}>
                          {nome}
                          {funcao ? ` — ${funcao}` : ""}
                        </option>
                      );
                    })}
                  </select>
                )}

                {type === "Saída" && eventId && colaboradoresEvento.length === 0 && (
                  <p style={textoMuted}>
                    Nenhum colaborador vinculado a este evento.
                  </p>
                )}

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

                <select
                  style={inputStyle}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
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

              {carregando ? (
                <p style={textoMuted}>Carregando movimentações...</p>
              ) : movimentacoesMes.length === 0 ? (
                <p style={textoMuted}>Nenhuma movimentação encontrada neste mês.</p>
              ) : (
                <div style={movimentacoesScroll}>
                  {movimentacoesMes.map((item) => (
                    <div key={item.id} style={movimentacaoCard}>
                      <div>
                        <strong
                          style={{
                            color: item.type === "Entrada" ? "#37e884" : "#ff5b8a",
                          }}
                        >
                          {item.type} - {item.category}
                        </strong>

                        <p style={textoMuted}>{item.description || "-"}</p>

                        <p style={textoMuted}>
                          {item.payment_date} • {item.payment_method}
                        </p>

                        {item.event_name && (
                          <p style={textoMuted}>Evento: {item.event_name}</p>
                        )}

                        {item.client_name && (
                          <p style={textoMuted}>
                            {item.type === "Entrada" ? "Cliente" : "Colaborador"}:{" "}
                            {item.client_name}
                          </p>
                        )}
                      </div>

                      <div style={movimentacaoActions}>
                        <strong style={{ fontSize: "18px" }}>
                          {Number(item.amount || 0).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </strong>

                        <button
                          type="button"
                          onClick={() => editarMovimentacao(item)}
                          style={botaoEditar}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => excluirMovimentacao(item.id)}
                          style={botaoExcluir}
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

function Card({
  titulo,
  valor,
  cor,
}: {
  titulo: string;
  valor: number;
  cor: string;
}) {
  return (
    <div style={cardStyle}>
      <p style={{ color: "#b8b8d8", margin: 0 }}>{titulo}</p>

      <h2 style={{ color: cor, margin: "10px 0 0" }}>
        {Number(valor || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })}
      </h2>
    </div>
  );
}

const filterBar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px 160px",
  gap: "12px",
  marginBottom: "24px",
};

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
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

const textoMuted: React.CSSProperties = {
  color: "#b8b8d8",
  margin: "6px 0",
};

const movimentacoesScroll: React.CSSProperties = {
  display: "grid",
  gap: "14px",
  maxHeight: "720px",
  overflowY: "auto",
  paddingRight: "8px",
};

const movimentacaoCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "18px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const movimentacaoActions: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  justifyItems: "end",
  alignContent: "start",
  minWidth: "140px",
};

const botaoEditar: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(0,170,255,0.18)",
  color: "#38bdf8",
  cursor: "pointer",
  fontWeight: "bold",
};

const botaoExcluir: React.CSSProperties = {
  padding: "9px 14px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(255,91,138,0.18)",
  color: "#ff7aa2",
  cursor: "pointer",
  fontWeight: "bold",
};

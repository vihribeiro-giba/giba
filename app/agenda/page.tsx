"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  getEventStatus,
  getEventStatusColor,
  getEventStatusLabel,
} from "../../lib/eventStatus";

type Cliente = {
  id: string;
  nome: string;
};

type Colaborador = {
  id: string;
  nome: string;
  funcao: string;
  status: string;
};

type FormatoShow = {
  id: string;
  nome: string;
};

type EventCollaborator = {
  event_id: string;
  collaborator_id: string;
};

type Evento = {
  id: string;
  user_id?: string;
  title: string;
  event_type: string;
  show_format: string;
  client_name: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  fee: number;
  payment_format: string;
  status: string;
  notes: string;
};

export default function AgendaPage() {
  const hoje = new Date();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [formatos, setFormatos] = useState<FormatoShow[]>([]);
  const [eventCollaborators, setEventCollaborators] = useState<EventCollaborator[]>([]);
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<string[]>([]);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState<Evento | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [diaSelecionado, setDiaSelecionado] = useState("");

  const [clientName, setClientName] = useState("");
  const [eventType, setEventType] = useState("Show");
  const [showFormat, setShowFormat] = useState("");
  const [location, setLocation] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [showDuration, setShowDuration] = useState("");
  const [fee, setFee] = useState("");
  const [paymentFormat, setPaymentFormat] = useState(
    "Sinal de 50% e o restante na data do evento"
  );
  const [notes, setNotes] = useState("");

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const diasCalendario = useMemo(() => {
    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();

    const dias: Array<number | null> = [];

    for (let i = 0; i < primeiroDia; i++) dias.push(null);
    for (let dia = 1; dia <= totalDias; dia++) dias.push(dia);

    return dias;
  }, [mesAtual, anoAtual]);

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

  function formatarData(dia: number) {
    const mes = String(mesAtual + 1).padStart(2, "0");
    const diaFormatado = String(dia).padStart(2, "0");
    return `${anoAtual}-${mes}-${diaFormatado}`;
  }

  async function carregarClientes() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setClientes([]);
      return;
    }

    const { data, error } = await supabase
      .from("clients")
      .select("id, nome")
      .eq("user_id", user.id)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar clientes:", error);
      setClientes([]);
      return;
    }

    setClientes(data || []);
  }

  async function carregarFormatos() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setFormatos([]);
      return;
    }

    const { data, error } = await supabase
      .from("show_formats")
      .select("id, nome")
      .eq("user_id", user.id)
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar formatos:", error);
      setFormatos([]);
      return;
    }

    setFormatos(data || []);
  }

  async function carregarColaboradores() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setColaboradores([]);
      return;
    }

    const { data, error } = await supabase
      .from("collaborators")
      .select("id, nome, funcao, status")
      .eq("user_id", user.id)
      .eq("status", "Ativo")
      .order("nome", { ascending: true });

    if (error) {
      console.error("Erro ao carregar colaboradores:", error);
      setColaboradores([]);
      return;
    }

    setColaboradores(data || []);
  }

  async function carregarEventos() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setEventos([]);
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Erro ao carregar eventos:", error);
      setEventos([]);
      return;
    }

    setEventos(data || []);
  }

  async function carregarVinculos() {
    const user = await obterUsuarioLogado();

    if (!user) {
      setEventCollaborators([]);
      return;
    }

    const { data: eventosDoUsuario, error: eventosError } = await supabase
      .from("events")
      .select("id")
      .eq("user_id", user.id);

    if (eventosError) {
      console.error("Erro ao buscar eventos para vínculos:", eventosError);
      setEventCollaborators([]);
      return;
    }

    const eventIds = (eventosDoUsuario || []).map((evento) => evento.id);

    if (eventIds.length === 0) {
      setEventCollaborators([]);
      return;
    }

    const { data, error } = await supabase
      .from("event_collaborators")
      .select("event_id, collaborator_id")
      .in("event_id", eventIds);

    if (error) {
      console.error("Erro ao carregar vínculos:", error);
      setEventCollaborators([]);
      return;
    }

    setEventCollaborators(data || []);
  }

  function limparFormulario() {
    setEditandoId(null);
    setClientName("");
    setEventType("Show");
    setShowFormat("");
    setLocation("");
    setEventTime("");
    setShowDuration("");
    setFee("");
    setPaymentFormat("Sinal de 50% e o restante na data do evento");
    setNotes("");
    setColaboradoresSelecionados([]);
  }

  function alternarColaborador(id: string) {
    setColaboradoresSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
  }

  function colaboradoresDoEvento(eventId: string) {
    const ids = eventCollaborators
      .filter((item) => item.event_id === eventId)
      .map((item) => item.collaborator_id);

    return colaboradores.filter((colaborador) => ids.includes(colaborador.id));
  }

  async function salvarVinculosEvento(eventId: string) {
    await supabase.from("event_collaborators").delete().eq("event_id", eventId);

    if (colaboradoresSelecionados.length > 0) {
      const vinculos = colaboradoresSelecionados.map((collaboratorId) => ({
        event_id: eventId,
        collaborator_id: collaboratorId,
      }));

      await supabase.from("event_collaborators").insert(vinculos);
    }
  }

  async function salvarEvento(e: React.FormEvent) {
    e.preventDefault();

    const user = await obterUsuarioLogado();

    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    if (!diaSelecionado) {
      alert("Selecione uma data no calendário.");
      return;
    }

    if (!clientName) {
      alert("Selecione um cliente.");
      return;
    }

    const dados = {
      user_id: user.id,
      title: `${eventType} - ${clientName}`,
      event_type: eventType,
      show_format: showFormat,
      client_name: clientName,
      location,
      event_date: diaSelecionado,
      event_time: eventTime,
      show_duration: showDuration,
      fee: fee ? Number(fee) : 0,
      payment_format: paymentFormat,
      status: getEventStatus(diaSelecionado),
      notes,
    };

    if (editandoId) {
      const { error } = await supabase
        .from("events")
        .update(dados)
        .eq("id", editandoId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Erro ao atualizar evento:", error);
        alert("Erro ao atualizar evento.");
        return;
      }

      await salvarVinculosEvento(editandoId);
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert(dados)
        .select()
        .single();

      if (error || !data) {
        console.error("Erro ao cadastrar evento:", error);
        alert("Erro ao cadastrar evento.");
        return;
      }

      await salvarVinculosEvento(data.id);
    }

    limparFormulario();
    await carregarEventos();
    await carregarVinculos();
  }

  function eventosDoDia(data: string) {
    return eventos.filter((evento) => evento.event_date === data);
  }

  function mudarMes(tipo: "anterior" | "proximo") {
    if (tipo === "anterior") {
      if (mesAtual === 0) {
        setMesAtual(11);
        setAnoAtual(anoAtual - 1);
      } else {
        setMesAtual(mesAtual - 1);
      }
    }

    if (tipo === "proximo") {
      if (mesAtual === 11) {
        setMesAtual(0);
        setAnoAtual(anoAtual + 1);
      } else {
        setMesAtual(mesAtual + 1);
      }
    }
  }

  function editarEvento(evento: Evento) {
    const colaboradoresEvento = eventCollaborators
      .filter((item) => item.event_id === evento.id)
      .map((item) => item.collaborator_id);

    setEditandoId(evento.id);
    setDiaSelecionado(evento.event_date);
    setClientName(evento.client_name);
    setEventType(evento.event_type);
    setShowFormat(evento.show_format);
    setLocation(evento.location);
    setEventTime(evento.event_time);
    setShowDuration(evento.show_duration);
    setFee(String(evento.fee || ""));
    setPaymentFormat(evento.payment_format);
    setNotes(evento.notes || "");
    setColaboradoresSelecionados(colaboradoresEvento);
    setEventoSelecionado(null);
  }

  async function excluirEvento(id: string) {
    const confirmar = confirm("Deseja excluir este evento?");
    if (!confirmar) return;

    const user = await obterUsuarioLogado();

    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.");
      return;
    }

    await supabase.from("event_collaborators").delete().eq("event_id", id);

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao excluir evento:", error);
      alert("Erro ao excluir evento.");
      return;
    }

    setEventoSelecionado(null);
    await carregarEventos();
    await carregarVinculos();
  }

  function gerarContrato(evento: Evento) {
    window.location.href = `/contratos?eventId=${evento.id}`;
  }

  useEffect(() => {
    carregarClientes();
    carregarFormatos();
    carregarColaboradores();
    carregarEventos();
    carregarVinculos();
  }, []);

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div>
          <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
            Agenda GIBA
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
            Selecione uma data, cadastre eventos e defina os colaboradores de cada show.
          </p>

          <div style={mainGrid}>
            <section style={panelStyle}>
              <div style={calendarHeaderStyle}>
                <button onClick={() => mudarMes("anterior")} style={botaoMes}>
                  ←
                </button>

                <h2 style={{ margin: 0, fontSize: "22px" }}>
                  {meses[mesAtual]} {anoAtual}
                </h2>

                <button onClick={() => mudarMes("proximo")} style={botaoMes}>
                  →
                </button>
              </div>

              <div style={weekGridStyle}>
                {diasSemana.map((dia) => (
                  <div
                    key={dia}
                    style={{ textAlign: "center", color: "#b8b8d8" }}
                  >
                    {dia}
                  </div>
                ))}
              </div>

              <div style={calendarGridStyle}>
                {diasCalendario.map((dia, index) => {
                  if (!dia) return <div key={index}></div>;

                  const data = formatarData(dia);
                  const eventosDia = eventosDoDia(data);
                  const selecionado = diaSelecionado === data;

                  return (
                    <div
                      key={data}
                      onClick={() => setDiaSelecionado(data)}
                      style={{
                        minHeight: "150px",
                        padding: "10px",
                        borderRadius: "16px",
                        border: selecionado
                          ? "2px solid #00aaff"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: selecionado
                          ? "rgba(0,170,255,0.14)"
                          : "rgba(0,0,0,0.24)",
                        cursor: "pointer",
                      }}
                    >
                      <strong>{dia}</strong>

                      {eventosDia.map((evento) => (
                        <div
                          key={evento.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEventoSelecionado(evento);
                          }}
                          style={eventoCardStyle}
                        >
                          <strong>{evento.event_time || "Sem horário"}</strong>
                          <br />
                          {evento.event_type || "Evento"}
                          <br />
                          <span style={{ color: "#e4e4ff" }}>
                            {evento.show_format || "Formato não informado"}
                          </span>

                          {(() => {
                            const status = getEventStatus(evento.event_date);

                            return (
                              <span
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: "999px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                  background: getEventStatusColor(status),
                                  color: "#fff",
                                  display: "inline-block",
                                  marginTop: "8px",
                                }}
                              >
                                {getEventStatusLabel(status)}
                              </span>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </section>

            <aside style={panelStyle}>
              <h2 style={{ marginTop: 0 }}>
                {editandoId ? "Editar Evento" : "Cadastrar Evento"}
              </h2>

              <p style={{ color: "#b8b8d8" }}>
                Data do Evento:{" "}
                <strong style={{ color: "#fff" }}>
                  {diaSelecionado || "Selecione no calendário"}
                </strong>
              </p>

              <form
                onSubmit={salvarEvento}
                style={{ display: "grid", gap: "12px" }}
              >
                <select
                  style={inputStyle}
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.nome}>
                      {cliente.nome}
                    </option>
                  ))}
                </select>

                <select
                  style={inputStyle}
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option>Show</option>
                  <option>Ensaio</option>
                  <option>Reunião</option>
                  <option>Viagem</option>
                  <option>Bloqueio de Data</option>
                </select>

                <select
                  style={inputStyle}
                  value={showFormat}
                  onChange={(e) => setShowFormat(e.target.value)}
                >
                  <option value="">Selecione o formato</option>
                  {formatos.map((formato) => (
                    <option key={formato.id} value={formato.nome}>
                      {formato.nome}
                    </option>
                  ))}
                </select>

                <input
                  style={inputStyle}
                  placeholder="Endereço do Evento"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <input
                  style={inputStyle}
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />

                <input
                  style={inputStyle}
                  placeholder="Tempo de Show. Ex: 2 horas"
                  value={showDuration}
                  onChange={(e) => setShowDuration(e.target.value)}
                />

                <input
                  style={inputStyle}
                  type="number"
                  placeholder="Valor do Cachê"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />

                <select
                  style={inputStyle}
                  value={paymentFormat}
                  onChange={(e) => setPaymentFormat(e.target.value)}
                >
                  <option>Sinal de 50% e o restante na data do evento</option>
                  <option>Pagamento Integral</option>
                </select>

                <div style={collaboratorsBox}>
                  <strong>Colaboradores</strong>

                  {colaboradores.length === 0 && (
                    <p style={{ color: "#b8b8d8", marginBottom: 0 }}>
                      Nenhum colaborador ativo cadastrado.
                    </p>
                  )}

                  {colaboradores.map((colaborador) => (
                    <label key={colaborador.id} style={checkboxLine}>
                      <input
                        type="checkbox"
                        checked={colaboradoresSelecionados.includes(colaborador.id)}
                        onChange={() => alternarColaborador(colaborador.id)}
                      />

                      <span>
                        {colaborador.nome}
                        {colaborador.funcao ? ` — ${colaborador.funcao}` : ""}
                      </span>
                    </label>
                  ))}
                </div>

                <textarea
                  style={{ ...inputStyle, minHeight: "90px" }}
                  placeholder="Observações"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <button type="submit" style={botaoPrincipal}>
                  {editandoId ? "Salvar Alterações" : "Cadastrar Evento"}
                </button>

                {editandoId && (
                  <button
                    type="button"
                    onClick={limparFormulario}
                    style={botaoSecundario}
                  >
                    Cancelar edição
                  </button>
                )}
              </form>
            </aside>
          </div>

          {eventoSelecionado && (
            <div style={modalOverlay} onClick={() => setEventoSelecionado(null)}>
              <div style={modalBox} onClick={(e) => e.stopPropagation()}>
                <h2>{eventoSelecionado.client_name}</h2>

                <p>
                  <strong>Data:</strong> {eventoSelecionado.event_date}
                </p>
                <p>
                  <strong>Tipo de Evento:</strong> {eventoSelecionado.event_type}
                </p>
                <p>
                  <strong>Formato de Show:</strong> {eventoSelecionado.show_format}
                </p>
                <p>
                  <strong>Endereço:</strong> {eventoSelecionado.location}
                </p>
                <p>
                  <strong>Horário:</strong> {eventoSelecionado.event_time}
                </p>
                <p>
                  <strong>Tempo de Show:</strong> {eventoSelecionado.show_duration}
                </p>
                <p>
                  <strong>Cachê:</strong> R$ {Number(eventoSelecionado.fee).toFixed(2)}
                </p>
                <p>
                  <strong>Pagamento:</strong> {eventoSelecionado.payment_format}
                </p>
                <p>
                  <strong>Observações:</strong> {eventoSelecionado.notes || "-"}
                </p>

                <div style={teamBox}>
                  <strong>Equipe escalada:</strong>

                  {colaboradoresDoEvento(eventoSelecionado.id).length > 0 ? (
                    colaboradoresDoEvento(eventoSelecionado.id).map((colaborador) => (
                      <p key={colaborador.id} style={{ margin: "6px 0", color: "#b8b8d8" }}>
                        {colaborador.nome}
                        {colaborador.funcao ? ` — ${colaborador.funcao}` : ""}
                      </p>
                    ))
                  ) : (
                    <p style={{ color: "#b8b8d8" }}>
                      Nenhum colaborador escalado.
                    </p>
                  )}
                </div>

                <div style={modalButtonsGrid}>
                  <button onClick={() => gerarContrato(eventoSelecionado)} style={botaoPrincipal}>
                    Gerar Contrato
                  </button>

                  <button onClick={() => editarEvento(eventoSelecionado)} style={botaoEditar}>
                    Editar Evento
                  </button>

                  <button onClick={() => excluirEvento(eventoSelecionado.id)} style={botaoExcluir}>
                    Excluir Evento
                  </button>

                  <button onClick={() => setEventoSelecionado(null)} style={botaoSecundario}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.6fr 1fr",
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

const calendarHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  padding: "10px 14px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const weekGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "8px",
  marginBottom: "10px",
};

const calendarGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: "8px",
};

const eventoCardStyle: React.CSSProperties = {
  marginTop: "8px",
  padding: "8px",
  borderRadius: "10px",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  fontSize: "12px",
  lineHeight: "1.35",
};

const collaboratorsBox: React.CSSProperties = {
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  gap: "10px",
};

const checkboxLine: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  color: "#b8b8d8",
  cursor: "pointer",
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

const botaoMes: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  cursor: "pointer",
  fontSize: "18px",
};

const botaoEditar: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "rgba(0,170,255,0.18)",
  color: "#38bdf8",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoExcluir: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "none",
  background: "rgba(255,91,138,0.18)",
  color: "#ff7aa2",
  fontWeight: "bold",
  cursor: "pointer",
};

const modalOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.72)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const modalBox: React.CSSProperties = {
  width: "560px",
  maxWidth: "90%",
  background: "#0b1220",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "24px",
  padding: "28px",
  color: "#fff",
  boxShadow: "0 0 60px rgba(139,53,255,0.35)",
};

const modalButtonsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
  marginTop: "24px",
};

const teamBox: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
};

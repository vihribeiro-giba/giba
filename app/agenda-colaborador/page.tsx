"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import {
  getEventStatus,
  getEventStatusColor,
  getEventStatusLabel,
} from "../../lib/eventStatus";

type Evento = {
  id: string;
  user_id?: string;
  event_type: string;
  show_format: string;
  client_name: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  notes: string;
};

type Colaborador = {
  id: string;
  user_id?: string;
  nome: string;
  funcao: string;
  status: string;
  email?: string;
};

type Vinculo = {
  event_id: string;
  collaborator_id: string;
};

type ColaboradorSession = {
  id: string;
  nome: string;
  email: string;
  funcao?: string;
  user_id: string;
  tipo: string;
};

export default function AgendaColaboradorPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");
  const [carregando, setCarregando] = useState(true);

  function formatarDataBR(data: string) {
    if (!data) return "Não informado";

    const partes = data.split("-");

    if (partes.length === 3) {
      const [ano, mes, dia] = partes;
      return `${dia}/${mes}/${ano}`;
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) return data;

    return dataObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function obterSessaoColaboradorLocal(): ColaboradorSession | null {
    if (typeof window === "undefined") return null;

    const sessao = localStorage.getItem("giba_colaborador_session");

    if (!sessao) return null;

    try {
      const colaborador = JSON.parse(sessao) as ColaboradorSession;

      if (!colaborador?.id || !colaborador?.user_id || colaborador?.tipo !== "colaborador") {
        localStorage.removeItem("giba_colaborador_session");
        return null;
      }

      return colaborador;
    } catch (error) {
      console.error("Erro ao ler sessão do colaborador:", error);
      localStorage.removeItem("giba_colaborador_session");
      return null;
    }
  }

  async function obterColaboradorLogado() {
    const sessaoLocal = obterSessaoColaboradorLocal();

    if (sessaoLocal) {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .eq("id", sessaoLocal.id)
        .eq("user_id", sessaoLocal.user_id)
        .eq("status", "Ativo")
        .maybeSingle();

      if (error) {
        console.error("Erro ao validar colaborador:", error);
        alert("Erro ao validar acesso do colaborador.");
        window.location.href = "/login";
        return null;
      }

      if (!data) {
        localStorage.removeItem("giba_colaborador_session");
        alert("Acesso do colaborador não encontrado ou inativo.");
        window.location.href = "/login";
        return null;
      }

      return data as Colaborador;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      window.location.href = "/login";
      return null;
    }

    const { data: colaborador, error } = await supabase
      .from("collaborators")
      .select("*")
      .eq("email", user.email)
      .eq("status", "Ativo")
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar colaborador autenticado:", error);
      alert("Erro ao validar acesso do colaborador.");
      window.location.href = "/login";
      return null;
    }

    if (!colaborador?.id || !colaborador?.user_id) {
      alert("Este usuário não está cadastrado como colaborador ativo.");
      window.location.href = "/dashboard";
      return null;
    }

    localStorage.setItem(
      "giba_colaborador_session",
      JSON.stringify({
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email,
        funcao: colaborador.funcao,
        user_id: colaborador.user_id,
        tipo: "colaborador",
      })
    );

    return colaborador as Colaborador;
  }

  async function carregarDados() {
    setCarregando(true);

    const colaborador = await obterColaboradorLogado();

    if (!colaborador?.id || !colaborador?.user_id) {
      setEventos([]);
      setColaboradores([]);
      setVinculos([]);
      setColaboradorSelecionado("");
      setCarregando(false);
      return;
    }

    const { data: vinculosColaborador, error: erroVinculosColaborador } = await supabase
      .from("event_collaborators")
      .select("*")
      .eq("collaborator_id", colaborador.id);

    if (erroVinculosColaborador) {
      console.error("Erro ao carregar vínculos do colaborador:", erroVinculosColaborador);
      alert("Erro ao carregar agenda do colaborador.");
      setCarregando(false);
      return;
    }

    const idsEventos = vinculosColaborador?.map((item) => item.event_id) || [];

    if (idsEventos.length === 0) {
      setEventos([]);
      setColaboradores([colaborador]);
      setVinculos([]);
      setColaboradorSelecionado(colaborador.id);
      setCarregando(false);
      return;
    }

    const { data: eventosRes, error: erroEventos } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", colaborador.user_id)
      .in("id", idsEventos)
      .order("event_date", { ascending: true });

    if (erroEventos) {
      console.error("Erro ao carregar eventos do colaborador:", erroEventos);
      alert("Erro ao carregar eventos do colaborador.");
      setCarregando(false);
      return;
    }

    const idsEventosPermitidos = (eventosRes || []).map((evento) => evento.id);

    if (idsEventosPermitidos.length === 0) {
      setEventos([]);
      setColaboradores([colaborador]);
      setVinculos([]);
      setColaboradorSelecionado(colaborador.id);
      setCarregando(false);
      return;
    }

    const { data: todosVinculos, error: erroTodosVinculos } = await supabase
      .from("event_collaborators")
      .select("*")
      .in("event_id", idsEventosPermitidos);

    if (erroTodosVinculos) {
      console.error("Erro ao carregar equipe dos eventos:", erroTodosVinculos);
      alert("Erro ao carregar equipe dos eventos.");
      setCarregando(false);
      return;
    }

    const idsColaboradoresEquipe = Array.from(
      new Set((todosVinculos || []).map((item) => item.collaborator_id))
    );

    let colaboradoresEquipe: Colaborador[] = [colaborador];

    if (idsColaboradoresEquipe.length > 0) {
      const { data: colaboradoresRes, error: erroColaboradores } = await supabase
        .from("collaborators")
        .select("*")
        .eq("user_id", colaborador.user_id)
        .eq("status", "Ativo")
        .in("id", idsColaboradoresEquipe)
        .order("nome", { ascending: true });

      if (erroColaboradores) {
        console.error("Erro ao carregar colaboradores da equipe:", erroColaboradores);
        alert("Erro ao carregar equipe escalada.");
        setCarregando(false);
        return;
      }

      colaboradoresEquipe = (colaboradoresRes || []) as Colaborador[];
    }

    setEventos((eventosRes || []) as Evento[]);
    setColaboradores(colaboradoresEquipe);
    setVinculos((todosVinculos || []) as Vinculo[]);
    setColaboradorSelecionado(colaborador.id);
    setCarregando(false);
  }

  const eventosDoColaborador = useMemo(() => {
    if (!colaboradorSelecionado) return [];

    const eventosIds = vinculos
      .filter((item) => item.collaborator_id === colaboradorSelecionado)
      .map((item) => item.event_id);

    return eventos.filter((evento) => eventosIds.includes(evento.id));
  }, [eventos, vinculos, colaboradorSelecionado]);

  function equipeDoEvento(eventId: string) {
    const ids = vinculos
      .filter((item) => item.event_id === eventId)
      .map((item) => item.collaborator_id);

    return colaboradores.filter((colaborador) => ids.includes(colaborador.id));
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <AppLayout>
      <div>
        <h1 style={{ fontSize: "36px", marginBottom: "8px" }}>
          Agenda do Colaborador
        </h1>

        <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
          Visualização dos eventos escalados, sem informações financeiras.
        </p>

        <section style={panelStyle}>
          <h2 style={{ marginTop: 0 }}>Colaborador</h2>

          <select
            style={inputStyle}
            value={colaboradorSelecionado}
            onChange={(e) => setColaboradorSelecionado(e.target.value)}
            disabled
          >
            <option value="">Carregando colaborador...</option>

            {colaboradores
              .filter((colaborador) => colaborador.id === colaboradorSelecionado)
              .map((colaborador) => (
                <option key={colaborador.id} value={colaborador.id}>
                  {colaborador.nome}
                  {colaborador.funcao ? ` — ${colaborador.funcao}` : ""}
                </option>
              ))}
          </select>
        </section>

        <section style={{ ...panelStyle, marginTop: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Eventos escalados</h2>

          <div style={{ display: "grid", gap: "16px", marginTop: "20px" }}>
            {carregando && (
              <p style={{ color: "#b8b8d8" }}>
                Carregando agenda do colaborador...
              </p>
            )}

            {!carregando && !colaboradorSelecionado && (
              <p style={{ color: "#b8b8d8" }}>
                Não foi possível identificar o colaborador logado.
              </p>
            )}

            {!carregando && colaboradorSelecionado && eventosDoColaborador.length === 0 && (
              <p style={{ color: "#b8b8d8" }}>
                Nenhum evento escalado para este colaborador.
              </p>
            )}

            {!carregando &&
              eventosDoColaborador
                .filter(
                  (evento) =>
                    getEventStatus(evento.event_date) !== "realizado"
                )
                .map((evento) => (
                  <div key={evento.id} style={eventCard}>
                    <div>
                      <h3 style={{ margin: "0 0 10px" }}>
                        {evento.event_type} — {evento.show_format}
                      </h3>
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
                      <p style={textoMuted}>
                        <strong>Contratante:</strong>{" "}
                        {evento.client_name || "Não informado"}
                      </p>

                      <p style={textoMuted}>
                        <strong>Data:</strong> {formatarDataBR(evento.event_date)}
                      </p>

                      <p style={textoMuted}>
                        <strong>Horário:</strong>{" "}
                        {evento.event_time || "Não informado"}
                      </p>

                      <p style={textoMuted}>
                        <strong>Tempo de show:</strong>{" "}
                        {evento.show_duration || "Não informado"}
                      </p>

                      <p style={textoMuted}>
                        <strong>Endereço:</strong>{" "}
                        {evento.location || "Não informado"}
                      </p>

                      <p style={textoMuted}>
                        <strong>Observações:</strong> {evento.notes || "-"}
                      </p>

                      <div style={teamBox}>
                        <strong>Equipe escalada:</strong>

                        {equipeDoEvento(evento.id).length === 0 && (
                          <p style={{ margin: "6px 0", color: "#b8b8d8" }}>
                            Nenhuma equipe informada.
                          </p>
                        )}

                        {equipeDoEvento(evento.id).map((colaborador) => (
                          <p key={colaborador.id} style={{ margin: "6px 0", color: "#b8b8d8" }}>
                            {colaborador.nome}
                            {colaborador.funcao ? ` — ${colaborador.funcao}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "520px",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: "15px",
  boxSizing: "border-box",
};

const eventCard: React.CSSProperties = {
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.25)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const textoMuted: React.CSSProperties = {
  color: "#b8b8d8",
  margin: "7px 0",
};

const teamBox: React.CSSProperties = {
  marginTop: "18px",
  padding: "14px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
};

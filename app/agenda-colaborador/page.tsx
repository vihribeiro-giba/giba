"use client";

import { useEffect, useMemo, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type Evento = {
  id: string;
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
  nome: string;
  funcao: string;
  status: string;
};

type Vinculo = {
  event_id: string;
  collaborator_id: string;
};

export default function AgendaColaboradorPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState("");

  async function carregarDados() {
    const eventosRes = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    const colaboradoresRes = await supabase
      .from("collaborators")
      .select("id, nome, funcao, status")
      .eq("status", "Ativo")
      .order("nome", { ascending: true });

    const vinculosRes = await supabase
      .from("event_collaborators")
      .select("event_id, collaborator_id");

    setEventos(eventosRes.data || []);
    setColaboradores(colaboradoresRes.data || []);
    setVinculos(vinculosRes.data || []);
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
          <h2 style={{ marginTop: 0 }}>Selecionar colaborador</h2>

          <select
            style={inputStyle}
            value={colaboradorSelecionado}
            onChange={(e) => setColaboradorSelecionado(e.target.value)}
          >
            <option value="">Selecione um colaborador</option>

            {colaboradores.map((colaborador) => (
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
            {!colaboradorSelecionado && (
              <p style={{ color: "#b8b8d8" }}>
                Selecione um colaborador para visualizar a agenda.
              </p>
            )}

            {colaboradorSelecionado && eventosDoColaborador.length === 0 && (
              <p style={{ color: "#b8b8d8" }}>
                Nenhum evento escalado para este colaborador.
              </p>
            )}

            {eventosDoColaborador.map((evento) => (
              <div key={evento.id} style={eventCard}>
                <div>
                  <h3 style={{ margin: "0 0 10px" }}>
                    {evento.event_type} — {evento.show_format}
                  </h3>

                  <p style={textoMuted}>
                    <strong>Contratante:</strong>{" "}
                    {evento.client_name || "Não informado"}
                  </p>

                  <p style={textoMuted}>
                    <strong>Data:</strong> {evento.event_date}
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
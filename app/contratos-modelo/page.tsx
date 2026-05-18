"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";

type ContractSettings = {
  id: string;
  titulo: string;
  contratado_texto: string;
  clausula_obrigacao_contratado: string;
  clausula_obrigacao_contratante: string;
  multa_contratado: string;
  multa_contratante: string;
  foro: string;
  texto_final: string;
  cidade_assinatura: string;
};

export default function ContratosModeloPage() {
  const [modelo, setModelo] = useState<ContractSettings | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarModelo() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("contract_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      alert("Erro ao carregar modelo de contrato.");
      setCarregando(false);
      return;
    }

    setModelo(data);
    setCarregando(false);
  }

  function atualizarCampo(campo: keyof ContractSettings, valor: string) {
    if (!modelo) return;

    setModelo({
      ...modelo,
      [campo]: valor,
    });
  }

  async function salvarModelo() {
    if (!modelo) return;

    setSalvando(true);

    const { error } = await supabase
      .from("contract_settings")
      .update({
        titulo: modelo.titulo,
        contratado_texto: modelo.contratado_texto,
        clausula_obrigacao_contratado: modelo.clausula_obrigacao_contratado,
        clausula_obrigacao_contratante: modelo.clausula_obrigacao_contratante,
        multa_contratado: modelo.multa_contratado,
        multa_contratante: modelo.multa_contratante,
        foro: modelo.foro,
        texto_final: modelo.texto_final,
        cidade_assinatura: modelo.cidade_assinatura,
        updated_at: new Date().toISOString(),
      })
      .eq("id", modelo.id);

    setSalvando(false);

    if (error) {
      alert("Erro ao salvar modelo.");
      return;
    }

    alert("Modelo de contrato salvo com sucesso.");
  }

  useEffect(() => {
    carregarModelo();
  }, []);

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
            Modelo de Contrato
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
            Configure as cláusulas fixas usadas na geração dos contratos.
          </p>

          {carregando && (
            <section style={panelStyle}>
              <p style={{ color: "#b8b8d8" }}>Carregando modelo...</p>
            </section>
          )}

          {!carregando && modelo && (
            <section style={panelStyle}>
              <div style={gridStyle}>
                <CampoTexto
                  label="Título do contrato"
                  value={modelo.titulo}
                  onChange={(valor) => atualizarCampo("titulo", valor)}
                />

                <CampoArea
                  label="Texto do contratado"
                  value={modelo.contratado_texto}
                  onChange={(valor) =>
                    atualizarCampo("contratado_texto", valor)
                  }
                />

                <CampoArea
                  label="Cláusula 3ª — Obrigação do contratado"
                  value={modelo.clausula_obrigacao_contratado}
                  onChange={(valor) =>
                    atualizarCampo("clausula_obrigacao_contratado", valor)
                  }
                />

                <CampoArea
                  label="Cláusula 4ª — Obrigação do contratante"
                  value={modelo.clausula_obrigacao_contratante}
                  onChange={(valor) =>
                    atualizarCampo("clausula_obrigacao_contratante", valor)
                  }
                />

                <CampoArea
                  label="Cláusula 5ª — Multa / imprevisto do contratado"
                  value={modelo.multa_contratado}
                  onChange={(valor) =>
                    atualizarCampo("multa_contratado", valor)
                  }
                />

                <CampoArea
                  label="Cláusula 6ª — Cancelamento pelo contratante"
                  value={modelo.multa_contratante}
                  onChange={(valor) =>
                    atualizarCampo("multa_contratante", valor)
                  }
                />

                <CampoArea
                  label="Cláusula 7ª — Foro"
                  value={modelo.foro}
                  onChange={(valor) => atualizarCampo("foro", valor)}
                />

                <CampoArea
                  label="Texto final"
                  value={modelo.texto_final}
                  onChange={(valor) => atualizarCampo("texto_final", valor)}
                />

                <CampoTexto
                  label="Cidade da assinatura"
                  value={modelo.cidade_assinatura}
                  onChange={(valor) =>
                    atualizarCampo("cidade_assinatura", valor)
                  }
                />
              </div>

              <div style={{ marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={salvarModelo}
                  disabled={salvando}
                  style={buttonStyle}
                >
                  {salvando ? "Salvando..." : "Salvar Modelo"}
                </button>
              </div>
            </section>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={inputStyle}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CampoArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        style={textareaStyle}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "18px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#cbd5e1",
  fontSize: "14px",
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

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "130px",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: "15px",
  lineHeight: "1.6",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  cursor: "pointer",
};
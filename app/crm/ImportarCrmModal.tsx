"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  CheckCircle2,
  FileSpreadsheet,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { getAccountAuthUser } from "../../lib/access-session";

type LinhaImportacao = {
  municipio: string;
  estado: string;
  modelo_contratacao: string;
  evento: string;
  data_evento: string | null;
  prioridade: string;
  status: string;
  prefeito: string;
  email_prefeito: string;
  secretario_cultura: string;
  email_cultura: string;
  telefone_whatsapp: string;
  distancia_bh: number | null;
  habitantes: number | null;
  valor_proposto: number | null;
  observacoes: string;
};

type ImportarCrmModalProps = {
  onClose: () => void;
  onImported: () => Promise<void> | void;
};

export default function ImportarCrmModal({
  onClose,
  onImported,
}: ImportarCrmModalProps) {
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [importando, setImportando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  async function obterUsuarioLogado() {
    const { data, error } = await getAccountAuthUser();

    if (error || !data.user) {
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  function normalizarTexto(valor: any) {
    if (valor === null || valor === undefined) return "";
    return String(valor).trim();
  }

  function normalizarNumero(valor: any): number | null {
    if (valor === null || valor === undefined || valor === "") return null;

    let texto = String(valor)
      .replace("R$", "")
      .replace(/[^\d,.-]/g, "")
      .trim();

    if (!texto) return null;

    if (texto.includes(",")) {
      texto = texto.replace(/\./g, "").replace(",", ".");
    } else {
      const pontos = (texto.match(/\./g) || []).length;
      const pareceDecimal = pontos === 1 && /\.\d{1,2}$/.test(texto);
      if (!pareceDecimal) texto = texto.replace(/\./g, "");
    }

    const numero = Number(texto);
    return Number.isNaN(numero) ? null : numero;
  }

  function normalizarData(valor: any): string | null {
    if (!valor) return null;

    if (typeof valor === "number") {
      const data = XLSX.SSF.parse_date_code(valor);
      if (!data) return null;

      const ano = data.y;
      const mes = String(data.m).padStart(2, "0");
      const dia = String(data.d).padStart(2, "0");

      return `${ano}-${mes}-${dia}`;
    }

    const texto = String(valor).trim();
    if (!texto) return null;

    if (texto.includes("/")) {
      const partes = texto.split("/");

      if (partes.length === 3) {
        const dia = partes[0].padStart(2, "0");
        const mes = partes[1].padStart(2, "0");
        const ano = partes[2].length === 2 ? `20${partes[2]}` : partes[2];

        return `${ano}-${mes}-${dia}`;
      }
    }

    if (texto.includes("-")) return texto;

    return null;
  }

  function normalizarModelo(valor: any) {
    const texto = normalizarTexto(valor).toUpperCase();

    if (texto.includes("CIMVALPI")) return "CIMVALPI";
    if (texto.includes("LICITAR")) return "LICITAR";
    if (texto.includes("LICITA")) return "LICITAR";
    if (texto.includes("INEXIG")) return "INEXIGIBILIDADE";

    return "CIMVALPI";
  }

  function normalizarStatus(valor: any) {
    const texto = normalizarTexto(valor).toLowerCase();

    if (!texto) return "novo_lead";
    if (texto.includes("fechado")) return "fechado";
    if (texto.includes("perdido")) return "perdido";
    if (texto.includes("negocia")) return "negociacao";
    if (texto.includes("aguard")) return "aguardando_retorno";
    if (texto.includes("proposta")) return "proposta_enviada";
    if (texto.includes("email") || texto.includes("e-mail")) {
      return "email_enviado";
    }
    if (texto.includes("contato")) return "contato_realizado";

    return "novo_lead";
  }

  function buscarCampo(row: any, nomes: string[]) {
    const chaves = Object.keys(row);

    for (const nome of nomes) {
      const encontrado = chaves.find(
        (chave) =>
          chave
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim() ===
          nome
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim()
      );

      if (encontrado) return row[encontrado];
    }

    return "";
  }

  async function lerArquivo(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setArquivoNome(arquivo.name);

    const buffer = await arquivo.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const primeiraAba = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[primeiraAba];
    const dados = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    const linhasMapeadas: LinhaImportacao[] = dados
      .map((row: any) => {
        const municipio = normalizarTexto(
          buscarCampo(row, ["MUNICÍPIO", "MUNICIPIO", "CIDADE", "PREFEITURA"])
        );

        return {
          municipio,
          estado: normalizarTexto(buscarCampo(row, ["ESTADO", "UF"])) || "MG",
          modelo_contratacao: normalizarModelo(
            buscarCampo(row, [
              "MODELO DE CONTRATAÇÃO",
              "MODELO DE CONTRATACAO",
              "MODELO",
            ])
          ),
          evento: normalizarTexto(
            buscarCampo(row, ["EVENTO", "NOME DO EVENTO"])
          ),
          data_evento: normalizarData(
            buscarCampo(row, ["DATA DO EVENTO", "DATA EVENTO", "DATA"])
          ),
          prioridade: normalizarTexto(
            buscarCampo(row, ["STATUS PRIORIDADE", "PRIORIDADE"])
          ),
          status: normalizarStatus(buscarCampo(row, ["STATUS"])),
          prefeito: normalizarTexto(buscarCampo(row, ["PREFEITO"])),
          email_prefeito: normalizarTexto(
            buscarCampo(row, ["E-MAIL PREFEITO", "EMAIL PREFEITO"])
          ),
          secretario_cultura: normalizarTexto(
            buscarCampo(row, [
              "SEC DE CULTURA",
              "SECRETÁRIO DE CULTURA",
              "SECRETARIO DE CULTURA",
              "CULTURA",
            ])
          ),
          email_cultura: normalizarTexto(
            buscarCampo(row, ["E-MAIL CULTURA", "EMAIL CULTURA"])
          ),
          telefone_whatsapp: normalizarTexto(
            buscarCampo(row, [
              "TELEFONE/WHATSAPP",
              "TELEFONE",
              "WHATSAPP",
              "CELULAR",
            ])
          ),
          distancia_bh: normalizarNumero(
            buscarCampo(row, ["DISTÂNCIA BH", "DISTANCIA BH"])
          ),
          habitantes: normalizarNumero(buscarCampo(row, ["HABITANTES"])),
          valor_proposto: normalizarNumero(
            buscarCampo(row, ["VALOR PROPOSTO", "VALOR", "CACHÊ", "CACHE"])
          ),
          observacoes: normalizarTexto(
            buscarCampo(row, ["OBSERVAÇÕES", "OBSERVACOES", "OBS"])
          ),
        };
      })
      .filter((linha) => linha.municipio);

    setLinhas(linhasMapeadas);
  }

  async function importarParaCrm() {
    const user = await obterUsuarioLogado();

    if (!user) return;

    if (linhas.length === 0) {
      alert("Nenhuma linha válida para importar.");
      return;
    }

    const confirmar = window.confirm(
      `Deseja importar ${linhas.length} prefeitura(s) para o CRM?`
    );

    if (!confirmar) return;

    try {
      setImportando(true);

      for (const linha of linhas) {
        const { data: municipioCriado, error: erroMunicipio } = await supabase
          .from("municipios")
          .insert({
            user_id: user.id,
            nome: linha.municipio,
            estado: linha.estado,
            habitantes: linha.habitantes,
            distancia_bh: linha.distancia_bh,
            prefeito: linha.prefeito || null,
            email_prefeito: linha.email_prefeito || null,
            secretario_cultura: linha.secretario_cultura || null,
            email_cultura: linha.email_cultura || null,
            telefone_whatsapp: linha.telefone_whatsapp || null,
            observacoes: linha.observacoes || null,
          })
          .select()
          .single();

        if (erroMunicipio || !municipioCriado) {
          console.error("Erro ao importar município:", linha, erroMunicipio);
          continue;
        }

        const { data: oportunidadeCriada, error: erroOportunidade } =
          await supabase
            .from("crm_oportunidades")
            .insert({
              user_id: user.id,
              municipio_id: municipioCriado.id,
              status: linha.status,
              modelo_contratacao: linha.modelo_contratacao,
              valor_proposto: linha.valor_proposto,
              observacoes: linha.observacoes || null,
            })
            .select()
            .single();

        if (erroOportunidade) {
          console.error(
            "Erro ao importar oportunidade:",
            linha,
            erroOportunidade
          );
          continue;
        }

        if (linha.evento) {
          const { error: erroEvento } = await supabase
            .from("municipio_eventos")
            .insert({
              user_id: user.id,
              municipio_id: municipioCriado.id,
              nome_evento: linha.evento,
              data_evento: linha.data_evento,
              modelo_contratacao: linha.modelo_contratacao,
              prioridade: linha.prioridade || null,
              observacoes: linha.observacoes || null,
            });

          if (erroEvento) {
            console.error("Erro ao importar evento:", linha, erroEvento);
          }
        }

        if (linha.observacoes && oportunidadeCriada?.id) {
          const { error: erroInteracao } = await supabase
            .from("crm_interacoes")
            .insert({
              user_id: user.id,
              oportunidade_id: oportunidadeCriada.id,
              tipo: "Observacao",
              descricao: linha.observacoes,
              data_interacao: new Date().toISOString(),
            });

          if (erroInteracao) {
            console.error("Erro ao importar interação:", linha, erroInteracao);
          }
        }
      }

      alert("Importação concluída.");
      await onImported();
      onClose();
    } catch (error) {
      console.error("Erro inesperado na importação:", error);
      alert("Erro inesperado ao importar planilha.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <div style={overlayStyle} onMouseDown={onClose}>
      <div style={modalStyle} onMouseDown={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={iconStyle}>
              <Upload size={24} />
            </div>
            <div>
              <h2 style={titleStyle}>Importar Planilha</h2>
              <p style={subtitleStyle}>
                Confira os dados antes de gravar no CRM.
              </p>
            </div>
          </div>

          <button type="button" onClick={onClose} style={closeButtonStyle}>
            <X size={22} />
          </button>
        </div>

        <section style={uploadSectionStyle}>
          <button
            type="button"
            onClick={() => inputArquivoRef.current?.click()}
            style={uploadDropStyle}
          >
            <span style={uploadIconStyle}>
              <FileSpreadsheet size={28} />
            </span>
            <strong>{arquivoNome || "Clique para escolher a planilha"}</strong>
            <span style={hintStyle}>
              Aceita XLSX, XLS ou CSV. A importação só acontece depois da
              confirmação.
            </span>
          </button>

          <input
            ref={inputArquivoRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={lerArquivo}
            style={{ display: "none" }}
          />

          {arquivoNome && (
            <div style={successStyle}>
              <CheckCircle2 size={18} />
              Arquivo selecionado: <strong>{arquivoNome}</strong>
            </div>
          )}
        </section>

        {linhas.length > 0 && (
          <>
            <div style={summaryGridStyle}>
              <ResumoCard label="Linhas Válidas" valor={linhas.length} />
              <ResumoCard
                label="CIMVALPI"
                valor={
                  linhas.filter(
                    (linha) => linha.modelo_contratacao === "CIMVALPI"
                  ).length
                }
              />
              <ResumoCard
                label="LICITAR"
                valor={
                  linhas.filter(
                    (linha) => linha.modelo_contratacao === "LICITAR"
                  ).length
                }
              />
              <ResumoCard
                label="INEXIGIBILIDADE"
                valor={
                  linhas.filter(
                    (linha) =>
                      linha.modelo_contratacao === "INEXIGIBILIDADE"
                  ).length
                }
              />
            </div>

            <section style={previewStyle}>
              <div style={previewHeaderStyle}>
                <div>
                  <h3 style={sectionTitleStyle}>Prévia da Importação</h3>
                  <p style={subtitleStyle}>
                    Exibindo os primeiros 30 registros encontrados.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={importarParaCrm}
                  disabled={importando}
                  style={{
                    ...primaryButtonStyle,
                    opacity: importando ? 0.7 : 1,
                  }}
                >
                  <Upload size={18} />
                  {importando ? "Importando..." : "Importar para o CRM"}
                </button>
              </div>

              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Município</th>
                      <th style={thStyle}>Modelo</th>
                      <th style={thStyle}>Evento</th>
                      <th style={thStyle}>Data Evento</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Prefeito</th>
                      <th style={thStyle}>WhatsApp</th>
                      <th style={thStyle}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.slice(0, 30).map((linha, index) => (
                      <tr key={`${linha.municipio}-${index}`}>
                        <td style={tdStyle}>{linha.municipio}</td>
                        <td style={tdStyle}>{linha.modelo_contratacao}</td>
                        <td style={tdStyle}>{linha.evento || "-"}</td>
                        <td style={tdStyle}>{linha.data_evento || "-"}</td>
                        <td style={tdStyle}>{linha.status}</td>
                        <td style={tdStyle}>{linha.prefeito || "-"}</td>
                        <td style={tdStyle}>
                          {linha.telefone_whatsapp || "-"}
                        </td>
                        <td style={tdStyle}>
                          {linha.valor_proposto
                            ? linha.valor_proposto.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function ResumoCard({ label, valor }: { label: string; valor: number }) {
  return (
    <div style={summaryCardStyle}>
      <span>{label}</span>
      <strong>{valor}</strong>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  background: "rgba(2,6,18,0.78)",
  backdropFilter: "blur(14px)",
  display: "grid",
  placeItems: "center",
  padding: 16,
};

const modalStyle: React.CSSProperties = {
  width: "min(1040px, calc(100vw - 32px))",
  maxHeight: "calc(100vh - 32px)",
  overflowY: "auto",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.12)",
  background:
    "linear-gradient(135deg, rgba(20,18,42,0.97), rgba(7,39,62,0.97))",
  boxShadow: "0 30px 100px rgba(0,0,0,0.45)",
  padding: 28,
  color: "#fff",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 22,
};

const iconStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#8B35FF,#00AAFF)",
  flex: "0 0 auto",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.1,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
};

const subtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#9fb4d9",
  lineHeight: 1.45,
};

const closeButtonStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const uploadSectionStyle: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(5,10,24,0.42)",
  padding: 22,
  marginBottom: 18,
};

const uploadDropStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 150,
  borderRadius: 22,
  border: "1px dashed rgba(56,189,248,0.46)",
  background: "rgba(2, 10, 28, 0.62)",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: 22,
  cursor: "pointer",
  textAlign: "center",
  fontSize: 20,
};

const uploadIconStyle: React.CSSProperties = {
  width: 62,
  height: 62,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(135deg,#8B35FF,#00AAFF)",
};

const hintStyle: React.CSSProperties = {
  color: "#9fb4d9",
  fontSize: 15,
};

const successStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  marginTop: 14,
  padding: "11px 14px",
  borderRadius: 14,
  border: "1px solid rgba(34,197,94,0.28)",
  background: "rgba(34,197,94,0.10)",
  color: "#bbf7d0",
};

const summaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
  marginBottom: 18,
};

const summaryCardStyle: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.055)",
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 8,
  color: "#9fb4d9",
  fontWeight: 800,
};

const previewStyle: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(5,10,24,0.42)",
  padding: 22,
};

const previewHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  padding: "14px 18px",
  borderRadius: 16,
  border: "none",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  marginTop: 18,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 980,
  background: "rgba(2,10,28,0.45)",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "13px 15px",
  color: "#93c5fd",
  borderBottom: "1px solid rgba(255,255,255,0.10)",
  whiteSpace: "nowrap",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const tdStyle: React.CSSProperties = {
  padding: "13px 15px",
  color: "#fff",
  borderBottom: "1px solid rgba(255,255,255,0.07)",
  whiteSpace: "nowrap",
  fontWeight: 700,
};

"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import AppLayout from "../../../components/AppLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { supabase } from "../../../lib/supabase";

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

const MODELOS_CONTRATACAO = [
  "CIMVALPI",
  "LICITAR",
  "INEXIGIBILIDADE",
];

const STATUS_OPTIONS = [
  "novo_lead",
  "contato_realizado",
  "email_enviado",
  "proposta_enviada",
  "negociacao",
  "aguardando_retorno",
  "fechado",
  "perdido",
];

export default function ImportarCrmPage() {
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [importando, setImportando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

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

    if (texto.includes("-")) {
      return texto;
    }

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
    if (texto.includes("email") || texto.includes("e-mail")) return "email_enviado";
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

    const dados = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    const linhasMapeadas: LinhaImportacao[] = dados
      .map((row: any) => {
        const municipio = normalizarTexto(
          buscarCampo(row, ["MUNICÍPIO", "MUNICIPIO", "CIDADE", "PREFEITURA"])
        );

        return {
          municipio,
          estado:
            normalizarTexto(buscarCampo(row, ["ESTADO", "UF"])) || "MG",
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
            estado: linha.estado || "MG",
            habitantes: linha.habitantes,
            distancia_bh: linha.distancia_bh,
            prefeito: linha.prefeito || null,
            email_prefeito: linha.email_prefeito || null,
            secretario_cultura: linha.secretario_cultura || null,
            email_cultura: linha.email_cultura || null,
            telefone_whatsapp: linha.telefone_whatsapp || null,
            observacoes: linha.observacoes || null,
          })
          .select("*")
          .single();

        if (erroMunicipio) {
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
              data_contato: null,
              proximo_contato: null,
              responsavel: null,
              observacoes: linha.observacoes || null,
            })
            .select("*")
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
              tipo: "Observação",
              descricao: linha.observacoes,
              data_interacao: new Date().toISOString(),
            });

          if (erroInteracao) {
            console.error("Erro ao importar interação:", linha, erroInteracao);
          }
        }
      }

      alert("Importação concluída.");
      window.location.href = "/crm";
    } catch (error) {
      console.error("Erro inesperado na importação:", error);
      alert("Erro inesperado ao importar planilha.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <Link href="/crm" style={voltarStyle}>
            ← Voltar para o CRM
          </Link>

          <p style={tagStyle}>IMPORTAÇÃO</p>

          <h1 style={tituloStyle}>Importar Prefeituras</h1>

          <p style={subtituloStyle}>
            Importe sua planilha Excel e transforme os dados em municípios,
            oportunidades, eventos e histórico dentro do CRM.
          </p>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Selecionar planilha</h2>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={lerArquivo}
              style={inputFileStyle}
            />

            {arquivoNome && (
              <p style={{ color: "#b8b8d8" }}>
                Arquivo selecionado: <strong>{arquivoNome}</strong>
              </p>
            )}
          </section>

          {linhas.length > 0 && (
            <>
              <section style={resumoGridStyle}>
                <div style={cardResumoStyle}>
                  <p style={cardLabelStyle}>Linhas válidas</p>
                  <h2 style={cardNumeroStyle}>{linhas.length}</h2>
                </div>

                <div style={cardResumoStyle}>
                  <p style={cardLabelStyle}>CIMVALPI</p>
                  <h2 style={cardNumeroStyle}>
                    {
                      linhas.filter(
                        (linha) => linha.modelo_contratacao === "CIMVALPI"
                      ).length
                    }
                  </h2>
                </div>

                <div style={cardResumoStyle}>
                  <p style={cardLabelStyle}>LICITAR</p>
                  <h2 style={cardNumeroStyle}>
                    {
                      linhas.filter(
                        (linha) => linha.modelo_contratacao === "LICITAR"
                      ).length
                    }
                  </h2>
                </div>

                <div style={cardResumoStyle}>
                  <p style={cardLabelStyle}>INEXIGIBILIDADE</p>
                  <h2 style={cardNumeroStyle}>
                    {
                      linhas.filter(
                        (linha) =>
                          linha.modelo_contratacao === "INEXIGIBILIDADE"
                      ).length
                    }
                  </h2>
                </div>
              </section>

              <section style={cardStyle}>
                <div style={topoPreviewStyle}>
                  <div>
                    <h2 style={{ marginTop: 0 }}>Prévia da importação</h2>
                    <p style={{ color: "#b8b8d8" }}>
                      Confira os primeiros registros antes de importar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={importarParaCrm}
                    disabled={importando}
                    style={{
                      ...botaoPrincipal,
                      opacity: importando ? 0.7 : 1,
                    }}
                  >
                    {importando ? "Importando..." : "Importar para o CRM"}
                  </button>
                </div>

                <div style={tabelaContainerStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Município</th>
                        <th style={thStyle}>Modelo</th>
                        <th style={thStyle}>Evento</th>
                        <th style={thStyle}>Data Evento</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Prefeito</th>
                        <th style={thStyle}>Cultura</th>
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
                            {linha.secretario_cultura || "-"}
                          </td>
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

                {linhas.length > 30 && (
                  <p style={{ color: "#b8b8d8" }}>
                    Exibindo apenas os primeiros 30 registros na prévia.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

const voltarStyle: React.CSSProperties = {
  display: "inline-block",
  marginBottom: "18px",
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: "bold",
};

const tagStyle: React.CSSProperties = {
  margin: 0,
  color: "#38bdf8",
  fontWeight: "bold",
  letterSpacing: "2px",
  fontSize: "14px",
};

const tituloStyle: React.CSSProperties = {
  fontSize: "38px",
  margin: "10px 0",
};

const subtituloStyle: React.CSSProperties = {
  color: "#b8b8d8",
  fontSize: "18px",
  margin: "0 0 28px",
  maxWidth: "850px",
  lineHeight: 1.5,
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
};

const inputFileStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.22)",
  color: "#fff",
};

const resumoGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "24px",
};

const cardResumoStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "22px",
};

const cardLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#9fb4d9",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "1px",
  fontSize: "13px",
};

const cardNumeroStyle: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: "30px",
};

const topoPreviewStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const botaoPrincipal: React.CSSProperties = {
  padding: "14px 20px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(90deg,#8b35ff,#00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  textDecoration: "none",
};

const tabelaContainerStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  marginTop: "20px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "1100px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  color: "#dbeafe",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  color: "#fff",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  whiteSpace: "nowrap",
};

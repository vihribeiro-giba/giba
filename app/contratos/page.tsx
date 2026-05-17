"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { Suspense, useEffect, useState } from "react";import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

type Evento = {
  id: string;
  event_type: string;
  show_format: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  fee: number;
  payment_format: string;
  client_name: string;
};

type Cliente = {
  id: string;
  nome: string;
  cpf_cnpj: string;
  endereco_completo: string;
};

type Empresa = {
  nome_artistico: string;
  razao_social: string;
  cnpj: string;
  responsavel: string;
  cpf: string;
  telefone: string;
  email: string;
  endereco_completo: string;
  cidade: string;
  estado: string;
  pix: string;
  banco: string;
  logo_url: string;
};

type WordPart = {
  text: string;
  bold: boolean;
};

function ContratosContent() {
  const searchParams = useSearchParams();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [eventoSelecionado, setEventoSelecionado] = useState("");
  const [textoContrato, setTextoContrato] = useState("");

  async function carregarDados() {
    const eventosRes = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    const clientesRes = await supabase.from("clients").select("*");

    const empresaRes = await supabase
      .from("company_settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setEventos(eventosRes.data || []);
    setClientes(clientesRes.data || []);
    setEmpresa(empresaRes.data || null);

    const eventIdUrl = searchParams.get("eventId");
    if (eventIdUrl) setEventoSelecionado(eventIdUrl);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function normalizar(texto: string) {
    return (texto || "").toLowerCase().trim();
  }

  function formatarDataBR(data: string) {
    if (!data) return "";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function formatarHora(hora: string) {
    if (!hora) return "";
    const [h, m] = hora.split(":");
    return `${h}h${m}min`;
  }

  function calcularHorarioFinal(hora: string, duracao: string) {
    if (!hora || !duracao) return "";

    const [h, m] = hora.split(":").map(Number);

    let horas = 0;
    let minutos = 0;

    const matchHoras = duracao.match(/(\d+)\s*hora/i);
    const matchMinutos = duracao.match(/(\d+)\s*min/i);

    if (matchHoras) horas = Number(matchHoras[1]);
    if (matchMinutos) minutos = Number(matchMinutos[1]);

    const data = new Date();
    data.setHours(h || 0);
    data.setMinutes(m || 0);
    data.setHours(data.getHours() + horas);
    data.setMinutes(data.getMinutes() + minutos);

    const hf = String(data.getHours()).padStart(2, "0");
    const mf = String(data.getMinutes()).padStart(2, "0");

    return `${hf}h${mf}min`;
  }

  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function valorPorExtenso(valor: number) {
    const numero = Number(valor || 0);

    if (numero === 500) return "Quinhentos Reais";
    if (numero === 1000) return "Um Mil Reais";
    if (numero === 1500) return "Mil e Quinhentos Reais";
    if (numero === 2000) return "Dois Mil Reais";
    if (numero === 2500) return "Dois Mil e Quinhentos Reais";
    if (numero === 3000) return "Três Mil Reais";
    if (numero === 3500) return "Três Mil e Quinhentos Reais";
    if (numero === 4000) return "Quatro Mil Reais";
    if (numero === 4500) return "Quatro Mil e Quinhentos Reais";
    if (numero === 5000) return "Cinco Mil Reais";

    return "Valor descrito em reais";
  }

  function dataAtualContrato() {
    const hoje = new Date();
    return hoje.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function gerarContrato() {
    const evento = eventos.find((e) => e.id === eventoSelecionado);

    if (!evento) {
      alert("Selecione um evento.");
      return;
    }

    if (!empresa) {
      alert("Cadastre os dados da empresa em Configurações.");
      return;
    }

    const cliente = clientes.find(
      (c) => normalizar(c.nome) === normalizar(evento.client_name)
    );

    if (!cliente) {
      alert(
        "Cliente não encontrado no cadastro. Verifique se o nome do cliente no evento está igual ao cadastro."
      );
      return;
    }

    const dataEvento = formatarDataBR(evento.event_date);
    const horaInicio = formatarHora(evento.event_time);
    const horaFim = calcularHorarioFinal(evento.event_time, evento.show_duration);
    const valor = formatarMoeda(evento.fee);
    const valorExtenso = valorPorExtenso(evento.fee);

    const texto = `Contrato de Prestação de Serviços Artísticos

CONTRATANTE:

**${cliente.nome}** com moradia na **${cliente.endereco_completo}**, inscrito(a) no CPF/CNPJ sob **${cliente.cpf_cnpj}**.

CONTRATADO:

**${empresa.razao_social}**, de CNPJ **${empresa.cnpj}**, com Sede na **${empresa.endereco_completo}**, **${empresa.cidade}**. Representado por **${empresa.responsavel}**, portador do CPF nº **${empresa.cpf}**, residente e domiciliado na **${empresa.endereco_completo}**, **${empresa.cidade}, ${empresa.estado}**.

DO OBJETO DO CONTRATO

Cláusula 1ª. O presente contrato tem como OBJETO, a realização, pelo artista **${empresa.nome_artistico}**, neste ato representado pelo CONTRATADO, de apresentação Artística Musical, no local, **${evento.location}** no dia **${dataEvento}**, iniciando-se às **${horaInicio}**, e terminando às **${horaFim}** sendo o show de **${evento.show_duration}**, sendo feito o trabalho de **${empresa.nome_artistico} ${evento.show_format}**, Incluso Equipamento de Som para a Apresentação.

DA REMUNERAÇÃO

Cláusula 2ª. O CONTRATANTE  pagará o valor de **${valor} (${valorExtenso})** pela apresentação do artista contratado, efetuando o pagamento de 50% na contratação e o restante do valor na data de **${dataEvento}**.

DAS OBRIGAÇÕES

Cláusula 3ª. Será de responsabilidade do CONTRATADO pela presença do artista no dia, local e com antecedência como combinado, para que seja feita a apresentação como descrito na cláusula 1ª.

Cláusula 4ª. Será de responsabilidade do CONTRATANTE a disponibilização do local para apresentação, alimentação para que o artista se prepare para tal apresentação.

DA MULTA

Cláusula 5ª. Fica acordado caso haja imprevisto por parte do contratado o mesmo fará a devolução do sinal descrito na cláusula 2ª.

Cláusula 6ª. Caso haja o cancelamento do show por parte do contratante ficará a parte contratada isenta da devolução do Sinal na cláusula 2ª, Exceto em caso de uma Crise Pandêmica ou Problema de Saúde comprovado com Atestado Médico, valor fica como saldo para contratações futuras por um período de Seis Meses.

Cláusula 7ª. Fica eleito o Foro da Comarca de **Sabará**, no Estado de **Minas Gerais** para dirimir toda e qualquer questão oriunda deste CONTRATO.

E, por estarem assim de comum acordo, as partes assinam o presente CONTRATO em 02 (duas) vias de igual teor e forma, para um mesmo fim.

**Sabará, ${dataAtualContrato()}.**`;

    setTextoContrato(texto);
  }

  function parseBoldText(texto: string): WordPart[] {
    const partes = texto.split(/(\*\*.*?\*\*)/g);

    return partes
      .filter((parte) => parte.length > 0)
      .map((parte) => {
        const bold = parte.startsWith("**") && parte.endsWith("**");
        return {
          text: parte.replace(/\*\*/g, ""),
          bold,
        };
      });
  }

  function getTextWidth(doc: jsPDF, texto: string, bold: boolean) {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(12);
    return doc.getTextWidth(texto);
  }

  function quebrarLinhasComNegrito(
    doc: jsPDF,
    partes: WordPart[],
    larguraMaxima: number
  ) {
    const palavras: WordPart[] = [];

    partes.forEach((parte) => {
      const split = parte.text.split(/(\s+)/);

      split.forEach((p) => {
        if (p !== "") {
          palavras.push({
            text: p,
            bold: parte.bold,
          });
        }
      });
    });

    const linhas: WordPart[][] = [];
    let linhaAtual: WordPart[] = [];
    let larguraAtual = 0;

    palavras.forEach((palavra) => {
      const larguraPalavra = getTextWidth(doc, palavra.text, palavra.bold);

      if (larguraAtual + larguraPalavra > larguraMaxima && linhaAtual.length > 0) {
        linhas.push(linhaAtual);
        linhaAtual = [palavra];
        larguraAtual = larguraPalavra;
      } else {
        linhaAtual.push(palavra);
        larguraAtual += larguraPalavra;
      }
    });

    if (linhaAtual.length > 0) {
      linhas.push(linhaAtual);
    }

    return linhas;
  }

  function desenharLinha(
    doc: jsPDF,
    linha: WordPart[],
    x: number,
    y: number,
    largura: number,
    justificar: boolean
  ) {
    const textoSemEspacos = linha.filter((p) => p.text.trim() !== "");
    const espacos = linha.filter((p) => /^\s+$/.test(p.text)).length;

    let larguraLinha = 0;

    linha.forEach((parte) => {
      larguraLinha += getTextWidth(doc, parte.text, parte.bold);
    });

    const sobra = largura - larguraLinha;
    const extraPorEspaco = justificar && espacos > 0 ? sobra / espacos : 0;

    let cursorX = x;

    linha.forEach((parte) => {
      const isSpace = /^\s+$/.test(parte.text);

      doc.setFont("times", parte.bold ? "bold" : "normal");
      doc.setFontSize(12);

      if (!isSpace) {
        doc.text(parte.text, cursorX, y);
      }

      cursorX += getTextWidth(doc, parte.text, parte.bold);

      if (isSpace) {
        cursorX += extraPorEspaco;
      }
    });
  }

  function escreverParagrafo(
    doc: jsPDF,
    texto: string,
    x: number,
    y: number,
    largura: number,
    alturaLinha: number
  ) {
    const partes = parseBoldText(texto);
    const linhas = quebrarLinhasComNegrito(doc, partes, largura);

    linhas.forEach((linha, index) => {
      if (y > 265) {
        doc.addPage();
        y = 25;
      }

      const ultimaLinha = index === linhas.length - 1;
      desenharLinha(doc, linha, x, y, largura, !ultimaLinha);
      y += alturaLinha;
    });

    return y;
  }

  function gerarPDF(texto: string, cliente: string) {
    const doc = new jsPDF("p", "mm", "a4");

    const x = 20;
    const largura = 170;
    const alturaLinha = 6.8;
    let y = 24;

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Contrato de Prestação de Serviços Artísticos", 105, y, {
      align: "center",
    });

    y += 18;

    const blocos = texto
      .replace("Contrato de Prestação de Serviços Artísticos", "")
      .split("\n\n")
      .map((bloco) => bloco.trim())
      .filter(Boolean);

    blocos.forEach((bloco) => {
      if (y > 260) {
        doc.addPage();
        y = 25;
      }

      const ehTitulo =
        bloco === "CONTRATANTE:" ||
        bloco === "CONTRATADO:" ||
        bloco === "DO OBJETO DO CONTRATO" ||
        bloco === "DA REMUNERAÇÃO" ||
        bloco === "DAS OBRIGAÇÕES" ||
        bloco === "DA MULTA";

      if (ehTitulo) {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(bloco, x, y);
        y += 8;
        return;
      }

      y = escreverParagrafo(doc, bloco, x, y, largura, alturaLinha);
      y += 5;
    });

    if (y > 230) {
      doc.addPage();
      y = 45;
    } else {
      y += 20;
    }

    doc.setFont("times", "normal");
    doc.setFontSize(12);

    doc.line(25, y, 85, y);
    doc.line(125, y, 185, y);

    y += 7;

    doc.setFont("times", "bold");
    doc.text("Contratante", 55, y, { align: "center" });
    doc.text("Contratado", 155, y, { align: "center" });

    const nomeArquivo = `contrato-${cliente
      .toLowerCase()
      .replaceAll(" ", "-")
      .replace(/[^\w-]/g, "")}.pdf`;

    doc.save(nomeArquivo);
  }

  async function salvarContrato() {
    const evento = eventos.find((e) => e.id === eventoSelecionado);

    if (!evento || !textoContrato) {
      alert("Gere o contrato antes de salvar.");
      return;
    }

    const { error } = await supabase.from("contracts").insert({
      event_id: evento.id,
      client_name: evento.client_name,
      contract_text: textoContrato,
      status: "Gerado",
    });

    if (error) {
      alert("Erro ao salvar contrato.");
      return;
    }

    gerarPDF(textoContrato, evento.client_name);

    alert("Contrato salvo e PDF baixado com sucesso.");
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
            Contratos
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "28px" }}>
            Gere contratos automáticos dos eventos cadastrados.
          </p>

          <section style={panelStyle}>
            <label style={labelStyle}>Selecionar Evento</label>

            <select
              value={eventoSelecionado}
              onChange={(e) => setEventoSelecionado(e.target.value)}
              style={inputStyle}
            >
              <option value="">Selecione</option>

              {eventos.map((evento) => (
  <option key={evento.id} value={evento.id}>
    {formatarDataBR(evento.event_date)} — {evento.event_type} — {evento.client_name}
  </option>
))}
            </select>

            <div style={{ marginTop: "20px" }}>
              <button style={buttonStyle} onClick={gerarContrato}>
                Gerar Contrato
              </button>
            </div>
          </section>

          {textoContrato && (
            <section style={{ ...panelStyle, marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                  gap: "12px",
                }}
              >
                <h2 style={{ margin: 0 }}>Contrato Gerado</h2>

                <button style={buttonStyle} onClick={salvarContrato}>
                  Salvar e Baixar PDF
                </button>
              </div>

              <textarea
                value={textoContrato}
                onChange={(e) => setTextoContrato(e.target.value)}
                style={textareaStyle}
              />
            </section>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
export default function ContratosPage() {
  return (
    <Suspense fallback={<div style={{ color: "#fff", padding: "40px" }}>Carregando contratos...</div>}>
      <ContratosContent />
    </Suspense>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 0 35px rgba(0,0,0,0.25)",
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
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.22)",
  color: "#fff",
  fontSize: "15px",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "700px",
  padding: "20px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.22)",
  color: "#fff",
  fontSize: "15px",
  lineHeight: "1.8",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};
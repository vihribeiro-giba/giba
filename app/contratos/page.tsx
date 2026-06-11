"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";

type Evento = {
  id: string;
  user_id?: string;
  event_type: string;
  show_format: string;
  location: string;
  event_date: string;
  event_time: string;
  show_duration: string;
  fee: number | string;
  payment_format: string;
  client_name: string;
};

type Cliente = {
  id: string;
  user_id?: string;
  nome: string;
  cpf_cnpj: string;
  endereco_completo: string;
};

type Empresa = {
  user_id?: string;
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

type ContractSettings = {
  id?: string;
  titulo: string;
  contratado_texto: string;
  objeto_base: string;
  remuneracao_base: string;
  obrigacao_contratado: string;
  obrigacao_contratante: string;
  multa_contratado: string;
  multa_contratante: string;
  foro: string;
  texto_final: string;
  cidade_assinatura: string;
};

type WordToken = {
  text: string;
  bold: boolean;
};

const modeloPadrao: ContractSettings = {
  titulo: "Contrato de Prestação de Serviços Artísticos",
  contratado_texto:
    "**32.419.876 Vinicius Ribeiro Duarte**, de CNPJ **32.419.876/0001-63**, com Sede na **Rua França, 373, Nações Unidas**, **Sabará**. Representado por **Vinicius Ribeiro Duarte**, portador do CPF nº **127.376.726-86**, residente e domiciliado na **Rua França, 373, Nações Unidas**, **Sabará, Minas Gerais**.",
  objeto_base:
    "O presente contrato tem como OBJETO, a realização, pelo artista **VIH RIBEIRO**, neste ato representado pelo CONTRATADO, de apresentação Artística Musical.",
  remuneracao_base:
    "O CONTRATANTE pagará o valor acordado pela apresentação do artista contratado.",
  obrigacao_contratado:
    "Será de responsabilidade do CONTRATADO pela presença do artista no dia, local e com antecedência como combinado, para que seja feita a apresentação como descrito na cláusula 1ª.",
  obrigacao_contratante:
    "Será de responsabilidade do CONTRATANTE a disponibilização do local para apresentação, alimentação para que o artista se prepare para tal apresentação.",
  multa_contratado:
    "Fica acordado caso haja imprevisto por parte do contratado o mesmo fará a devolução do sinal descrito na cláusula 2ª.",
  multa_contratante:
    "Caso haja o cancelamento do show por parte do contratante ficará a parte contratada isenta da devolução do Sinal na cláusula 2ª, Exceto em caso de uma Crise Pandêmica ou Problema de Saúde comprovado com Atestado Médico, valor fica como saldo para contratações futuras por um período de Seis Meses.",
  foro:
    "Fica eleito o Foro da Comarca de **Sabará**, no Estado de **Minas Gerais** para dirimir toda e qualquer questão oriunda deste CONTRATO.",
  texto_final:
    "E, por estarem assim de comum acordo, as partes assinam o presente CONTRATO em 02 (duas) vias de igual teor e forma, para um mesmo fim.",
  cidade_assinatura: "Sabará",
};

function ContratosContent() {
  const searchParams = useSearchParams();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [modeloContrato, setModeloContrato] = useState<ContractSettings>(modeloPadrao);
  const [eventoSelecionado, setEventoSelecionado] = useState("");
  const [textoContrato, setTextoContrato] = useState("");
  const [carregando, setCarregando] = useState(true);

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
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    const clientesRes = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id);

    const empresaRes = await supabase
      .from("company_settings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const modeloRes = await supabase
      .from("contract_settings")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    setEventos(eventosRes.data || []);
    setClientes(clientesRes.data || []);
    setEmpresa(empresaRes.data || null);

    if (modeloRes.data) {
      setModeloContrato({
        id: modeloRes.data.id,
        titulo: modeloRes.data.titulo || modeloPadrao.titulo,
        contratado_texto: modeloRes.data.contratado_texto || modeloPadrao.contratado_texto,
        objeto_base: modeloRes.data.objeto_base || modeloPadrao.objeto_base,
        remuneracao_base: modeloRes.data.remuneracao_base || modeloPadrao.remuneracao_base,
        obrigacao_contratado:
          modeloRes.data.obrigacao_contratado || modeloPadrao.obrigacao_contratado,
        obrigacao_contratante:
          modeloRes.data.obrigacao_contratante || modeloPadrao.obrigacao_contratante,
        multa_contratado: modeloRes.data.multa_contratado || modeloPadrao.multa_contratado,
        multa_contratante:
          modeloRes.data.multa_contratante || modeloPadrao.multa_contratante,
        foro: modeloRes.data.foro || modeloPadrao.foro,
        texto_final: modeloRes.data.texto_final || modeloPadrao.texto_final,
        cidade_assinatura:
          modeloRes.data.cidade_assinatura || modeloPadrao.cidade_assinatura,
      });
    }

    const eventIdUrl = searchParams.get("eventId");
    if (eventIdUrl) setEventoSelecionado(eventIdUrl);

    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const textoDuracao = String(duracao).toLowerCase();

    let totalMinutos = 0;

    // Soma todas as ocorrências de horas.
    // Exemplo: "2 horas 30 minutos mais intervalo de 30 minutos" = 2h + 30min + 30min.
    const horasEncontradas = textoDuracao.matchAll(/(\d+)\s*(?:h|hora|horas)/g);
    for (const item of horasEncontradas) {
      totalMinutos += Number(item[1]) * 60;
    }

    // Soma todas as ocorrências de minutos, incluindo intervalo.
    const minutosEncontrados = textoDuracao.matchAll(/(\d+)\s*(?:min|minuto|minutos)/g);
    for (const item of minutosEncontrados) {
      totalMinutos += Number(item[1]);
    }

    // Suporte extra para formatos simples como "2h30" ou "2:30".
    if (totalMinutos === 0) {
      const compacto = textoDuracao.match(/(\d+)\s*h\s*(\d+)?/);
      const doisPontos = textoDuracao.match(/(\d+)\s*:\s*(\d+)/);

      if (compacto) {
        totalMinutos += Number(compacto[1]) * 60;
        totalMinutos += compacto[2] ? Number(compacto[2]) : 0;
      } else if (doisPontos) {
        totalMinutos += Number(doisPontos[1]) * 60;
        totalMinutos += Number(doisPontos[2]);
      }
    }

    const data = new Date();
    data.setHours(h || 0);
    data.setMinutes(m || 0);
    data.setMinutes(data.getMinutes() + totalMinutos);

    const hf = String(data.getHours()).padStart(2, "0");
    const mf = String(data.getMinutes()).padStart(2, "0");

    return `${hf}h${mf}min`;
  }

  function formatarPagamentoContrato(pagamentoOriginal: string, dataEvento: string) {
    const pagamento = pagamentoOriginal || "Sinal de 50% e o restante na data do evento";

    return pagamento
      .replace(/data do evento/gi, `data de ${dataEvento}`)
      .replace(/dia do evento/gi, `dia ${dataEvento}`);
  }

  function valorNumerico(valor: number | string) {
    if (typeof valor === "number") return valor;

    const valorLimpo = String(valor || "")
      .replace(/R\$/gi, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const numero = Number(valorLimpo);
    return Number.isFinite(numero) ? numero : 0;
  }

  function formatarMoeda(valor: number | string) {
    return valorNumerico(valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function numeroInteiroPorExtenso(numero: number): string {
    const n = Math.floor(Number(numero || 0));

    if (n === 0) return "zero";

    const unidades = [
      "",
      "um",
      "dois",
      "três",
      "quatro",
      "cinco",
      "seis",
      "sete",
      "oito",
      "nove",
    ];

    const especiais = [
      "dez",
      "onze",
      "doze",
      "treze",
      "quatorze",
      "quinze",
      "dezesseis",
      "dezessete",
      "dezoito",
      "dezenove",
    ];

    const dezenas = [
      "",
      "",
      "vinte",
      "trinta",
      "quarenta",
      "cinquenta",
      "sessenta",
      "setenta",
      "oitenta",
      "noventa",
    ];

    const centenas = [
      "",
      "cento",
      "duzentos",
      "trezentos",
      "quatrocentos",
      "quinhentos",
      "seiscentos",
      "setecentos",
      "oitocentos",
      "novecentos",
    ];

    function ate999(valorAte999: number): string {
      if (valorAte999 === 0) return "";
      if (valorAte999 === 100) return "cem";

      const c = Math.floor(valorAte999 / 100);
      const resto = valorAte999 % 100;
      const d = Math.floor(resto / 10);
      const u = resto % 10;

      const partes: string[] = [];

      if (c > 0) partes.push(centenas[c]);

      if (resto >= 10 && resto <= 19) {
        partes.push(especiais[resto - 10]);
      } else {
        if (d > 0) partes.push(dezenas[d]);
        if (u > 0) partes.push(unidades[u]);
      }

      return partes.filter(Boolean).join(" e ");
    }

    if (n < 1000) return ate999(n);

    if (n < 1000000) {
      const milhar = Math.floor(n / 1000);
      const resto = n % 1000;
      const textoMilhar = milhar === 1 ? "mil" : `${ate999(milhar)} mil`;

      if (resto === 0) return textoMilhar;

      const conector = resto < 100 || resto % 100 === 0 ? " e " : " ";
      return `${textoMilhar}${conector}${ate999(resto)}`;
    }

    const milhoes = Math.floor(n / 1000000);
    const restoMilhoes = n % 1000000;
    const textoMilhoes = milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`;

    if (restoMilhoes === 0) return textoMilhoes;

    return `${textoMilhoes} e ${numeroInteiroPorExtenso(restoMilhoes)}`;
  }

  function valorPorExtenso(valor: number | string) {
    const numero = valorNumerico(valor);
    const reais = Math.floor(numero);
    const centavos = Math.round((numero - reais) * 100);

    const textoReais = `${numeroInteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}`;

    if (centavos > 0) {
      const textoCentavos = `${numeroInteiroPorExtenso(centavos)} ${
        centavos === 1 ? "centavo" : "centavos"
      }`;

      return `${textoReais} e ${textoCentavos}`.replace(/^./, (letra) =>
        letra.toUpperCase()
      );
    }

    return textoReais.replace(/^./, (letra) => letra.toUpperCase());
  }

  function dataAtualContrato() {
    const hoje = new Date();
    return hoje.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function textoContratado() {
    if (modeloContrato.contratado_texto) return modeloContrato.contratado_texto;

    if (!empresa) return "";

    return `**${empresa.razao_social}**, de CNPJ **${empresa.cnpj}**, com Sede na **${empresa.endereco_completo}**, **${empresa.cidade}**. Representado por **${empresa.responsavel}**, portador do CPF nº **${empresa.cpf}**, residente e domiciliado na **${empresa.endereco_completo}**, **${empresa.cidade}, ${empresa.estado}**.`;
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
    const pagamento = formatarPagamentoContrato(
      evento.payment_format || "Sinal de 50% e o restante na data do evento",
      dataEvento
    );

    const objetoEditavel = modeloContrato.objeto_base || modeloPadrao.objeto_base;
    const remuneracaoEditavel = modeloContrato.remuneracao_base || modeloPadrao.remuneracao_base;

    const texto = `${modeloContrato.titulo || modeloPadrao.titulo}

CONTRATANTE:

**${cliente.nome}** com moradia na **${cliente.endereco_completo}**, inscrito(a) no CPF/CNPJ sob **${cliente.cpf_cnpj}**.

CONTRATADO:

${textoContratado()}

DO OBJETO DO CONTRATO

Cláusula 1ª. ${objetoEditavel} A apresentação será realizada no local **${evento.location}**, no dia **${dataEvento}**, iniciando-se às **${horaInicio}**, e terminando às **${horaFim}**, sendo o show de **${evento.show_duration}**, sendo feito o trabalho de **${evento.show_format}**, Incluso Equipamento de Som para a Apresentação.

DA REMUNERAÇÃO

Cláusula 2ª. ${remuneracaoEditavel} O CONTRATANTE pagará o valor de **${valor} (${valorExtenso})** pela apresentação do artista contratado, efetuando o pagamento de **${pagamento}**.

DAS OBRIGAÇÕES

Cláusula 3ª. ${modeloContrato.obrigacao_contratado || modeloPadrao.obrigacao_contratado}

Cláusula 4ª. ${modeloContrato.obrigacao_contratante || modeloPadrao.obrigacao_contratante}

DA MULTA

Cláusula 5ª. ${modeloContrato.multa_contratado || modeloPadrao.multa_contratado}

Cláusula 6ª. ${modeloContrato.multa_contratante || modeloPadrao.multa_contratante}

Cláusula 7ª. ${modeloContrato.foro || modeloPadrao.foro}

${modeloContrato.texto_final || modeloPadrao.texto_final}

**${modeloContrato.cidade_assinatura || "Sabará"}, ${dataAtualContrato()}.**`;

    setTextoContrato(texto);
  }

  function parseBoldText(texto: string): WordToken[] {
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    const tokens: WordToken[] = [];

    partes.forEach((parte) => {
      if (!parte) return;

      const bold = parte.startsWith("**") && parte.endsWith("**");
      const textoLimpo = parte.replace(/\*\*/g, "");
      const palavras = textoLimpo.split(/\s+/).filter(Boolean);

      palavras.forEach((palavra) => {
        tokens.push({ text: palavra, bold });
      });
    });

    return tokens;
  }

  function larguraToken(doc: jsPDF, token: WordToken) {
    doc.setFont("times", token.bold ? "bold" : "normal");
    return doc.getTextWidth(token.text);
  }

  function renderizarLinhaJustificada(
    doc: jsPDF,
    linha: WordToken[],
    x: number,
    y: number,
    larguraMaxima: number,
    justificar: boolean
  ) {
    if (linha.length === 0) return;

    const larguraPalavras = linha.reduce((total, token) => total + larguraToken(doc, token), 0);
    const larguraEspacoNormal = doc.getTextWidth(" ");
    const quantidadeEspacos = Math.max(linha.length - 1, 0);

    let espacoEntrePalavras = larguraEspacoNormal;

    if (justificar && quantidadeEspacos > 0) {
      const sobra = larguraMaxima - larguraPalavras;
      espacoEntrePalavras = sobra / quantidadeEspacos;
    }

    let xAtual = x;

    linha.forEach((token, index) => {
      doc.setFont("times", token.bold ? "bold" : "normal");
      doc.text(token.text, xAtual, y);
      xAtual += larguraToken(doc, token);

      if (index < linha.length - 1) {
        xAtual += espacoEntrePalavras;
      }
    });
  }

  function adicionarTextoComNegritoJustificado(
    doc: jsPDF,
    texto: string,
    x: number,
    yInicial: number,
    larguraMaxima: number,
    lineHeight: number
  ) {
    let y = yInicial;
    const paragrafos = texto.split("\n");

    paragrafos.forEach((paragrafo) => {
      if (!paragrafo.trim()) {
        y += lineHeight;
        return;
      }

      const tokens = parseBoldText(paragrafo);
      let linhaAtual: WordToken[] = [];
      let larguraLinha = 0;
      const larguraEspaco = doc.getTextWidth(" ");

      tokens.forEach((token) => {
        const largura = larguraToken(doc, token);
        const larguraComEspaco = linhaAtual.length > 0 ? largura + larguraEspaco : largura;

        if (larguraLinha + larguraComEspaco > larguraMaxima && linhaAtual.length > 0) {
          renderizarLinhaJustificada(doc, linhaAtual, x, y, larguraMaxima, true);
          y += lineHeight;
          linhaAtual = [token];
          larguraLinha = largura;
        } else {
          linhaAtual.push(token);
          larguraLinha += larguraComEspaco;
        }
      });

      if (linhaAtual.length > 0) {
        renderizarLinhaJustificada(doc, linhaAtual, x, y, larguraMaxima, false);
        y += lineHeight;
      }
    });

    return y;
  }

  function baixarPDF() {
  if (!textoContrato) {
    alert("Gere o contrato antes de baixar o PDF.");
    return;
  }

  const evento = eventos.find((e) => e.id === eventoSelecionado);

  const cliente = evento
    ? clientes.find((c) => normalizar(c.nome) === normalizar(evento.client_name))
    : null;

  const nomeContratante = cliente?.nome || "CONTRATANTE";
  const nomeContratado =
    empresa?.responsavel || empresa?.razao_social || "CONTRATADO";

  const doc = new jsPDF("p", "mm", "a4");
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const margemX = 18;
  const larguraTexto = 174;
  const lineHeight = 6;
  let y = 20;

  const blocos = textoContrato.split("\n\n");

  blocos.forEach((bloco) => {
    const blocoLimpo = bloco.trim();
    if (!blocoLimpo) return;

    if (y > 267) {
      doc.addPage();
      y = 20;
    }

    const isTitulo =
      blocoLimpo === (modeloContrato.titulo || modeloPadrao.titulo);

    const isSecao =
      blocoLimpo === blocoLimpo.toUpperCase() && blocoLimpo.length < 45;

    if (isTitulo) {
      doc.setFontSize(14);
      doc.setFont("times", "bold");

      // Título principal alinhado à esquerda
      doc.text(blocoLimpo, margemX, y);

      doc.setFontSize(11);
      doc.setFont("times", "normal");
      y += 10;
      return;
    }

    if (isSecao) {
      doc.setFont("times", "bold");

      // Títulos das seções alinhados à esquerda
      doc.text(blocoLimpo.replace(":", ""), margemX, y);

      doc.setFont("times", "normal");
      y += 8;
      return;
    }

    y = adicionarTextoComNegritoJustificado(
      doc,
      blocoLimpo,
      margemX,
      y,
      larguraTexto,
      lineHeight
    );

    y += 3;
  });

  // Garante espaço para as assinaturas
  if (y > 230) {
    doc.addPage();
    y = 40;
  } else {
    y += 28;
  }

  const larguraAssinatura = 75;
  const xContratante = 18;
  const xContratado = 117;

  doc.setLineWidth(0.2);

  // Linhas de assinatura lado a lado
  doc.line(xContratante, y, xContratante + larguraAssinatura, y);
  doc.line(xContratado, y, xContratado + larguraAssinatura, y);

  y += 6;

  doc.setFontSize(10);
  doc.setFont("times", "bold");

  doc.text("CONTRATANTE", xContratante + larguraAssinatura / 2, y, {
    align: "center",
  });

  doc.text("CONTRATADO", xContratado + larguraAssinatura / 2, y, {
    align: "center",
  });

  y += 6;

  doc.setFont("times", "normal");

  doc.text(nomeContratante, xContratante + larguraAssinatura / 2, y, {
    align: "center",
    maxWidth: larguraAssinatura,
  });

  doc.text(nomeContratado, xContratado + larguraAssinatura / 2, y, {
    align: "center",
    maxWidth: larguraAssinatura,
  });

  doc.save(`Contrato-Prestação-de-Serviços(${nomeContratante}).pdf`);
}

  function textoPreviewSemMarkdown(texto: string) {
    return texto.replace(/\*\*/g, "");
  }

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="contratos">
        <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>Contratos</h1>

          <p style={{ color: "#b8b8d8", marginBottom: "22px" }}>
            Gere contratos automáticos dos eventos cadastrados.
          </p>

          <div style={{ marginBottom: "24px" }}>
            <Link href="/contratos-modelo">
              <button style={botaoConfigurarContrato}>Configurar Contrato</button>
            </Link>
          </div>

          <section style={panelStyle}>
            <label style={labelStyle}>Selecione o evento</label>

            <select
              style={inputStyle}
              value={eventoSelecionado}
              onChange={(e) => setEventoSelecionado(e.target.value)}
            >
              <option value="">Selecione um evento</option>

              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.event_date} - {evento.client_name} - {evento.show_format}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "12px", marginTop: "18px", flexWrap: "wrap" }}>
              <button type="button" onClick={gerarContrato} style={buttonStyle}>
                Gerar Contrato
              </button>

              <button type="button" onClick={baixarPDF} style={buttonSecondaryStyle}>
                Baixar PDF
              </button>
            </div>

            {carregando && (
              <p style={{ color: "#b8b8d8", marginTop: "16px" }}>
                Carregando informações...
              </p>
            )}
          </section>

          {textoContrato && (
            <section style={{ ...panelStyle, marginTop: "24px" }}>
              <h2 style={{ marginTop: 0 }}>Prévia do Contrato</h2>

              <div style={previewStyle}>
                {textoPreviewSemMarkdown(textoContrato)}
              </div>
            </section>
          )}
        </div>
        </AppLayout>
      </PlanProtectedRoute>
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
  fontWeight: "bold",
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

const buttonStyle: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const buttonSecondaryStyle: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const botaoConfigurarContrato: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const previewStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "520px",
  padding: "22px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.30)",
  color: "#fff",
  fontSize: "15px",
  lineHeight: "1.7",
  boxSizing: "border-box",
  whiteSpace: "pre-wrap",
  textAlign: "justify",
};

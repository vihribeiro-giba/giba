"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import AppLayout from "../../components/AppLayout";
import { supabase } from "../../lib/supabase";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  FileText,
  MapPin,
  Plus,
  Search,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";

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
  status?: string | null;
  created_at?: string | null;
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
  const [busca, setBusca] = useState("");

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

  const eventosFiltrados = useMemo(() => {
    const termo = normalizar(busca);

    return eventos
      .filter((evento) => statusContrato(evento) !== "Assinado")
      .filter((evento) => {
        if (!termo) return true;

        const numeroContrato = numeroContratoEvento(evento);

        return [
          evento.client_name,
          evento.event_type,
          evento.show_format,
          evento.location,
          evento.event_date,
          numeroContrato,
        ]
          .filter(Boolean)
          .some((valor) => normalizar(String(valor)).includes(termo));
      })
      .sort((a, b) => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const dataA = a.event_date ? new Date(`${a.event_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const dataB = b.event_date ? new Date(`${b.event_date}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const aPassado = dataA < hoje.getTime();
        const bPassado = dataB < hoje.getTime();

        if (aPassado !== bPassado) return aPassado ? 1 : -1;
        return dataA - dataB;
      });
  }, [eventos, busca, textoContrato, eventoSelecionado]);

  const eventoAtual = useMemo(
    () => eventos.find((evento) => evento.id === eventoSelecionado) || null,
    [eventos, eventoSelecionado]
  );

  function numeroContratoEvento(evento: Evento) {
    return `CTR-${String(evento.id || "").slice(0, 8).toUpperCase()}`;
  }

  function dataCriacaoEvento(evento: Evento) {
    if (!evento.created_at) return "Data não informada";
    return new Date(evento.created_at).toLocaleDateString("pt-BR");
  }

  function cidadeEvento(evento: Evento) {
    return (evento.location || "").split(",").map((item) => item.trim()).filter(Boolean).slice(-2).join(", ") || "Local não informado";
  }

  function statusContrato(evento: Evento) {
    const status = normalizar(evento.status || "");

    if (status.includes("cancel")) return "Cancelado";
    if (status.includes("assin")) return "Assinado";
    if (status.includes("envi")) return "Enviado";
    if (textoContrato && evento.id === eventoSelecionado) return "Gerado";

    return "Pendente";
  }

  function selecionarEvento(id: string) {
    setEventoSelecionado(id);
    setTextoContrato("");
  }

  async function marcarComoAssinado(id: string) {
    const user = await obterUsuarioLogado();
    if (!user) return;

    const { error } = await supabase
      .from("events")
      .update({ status: "assinado" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao marcar contrato como assinado:", error);
      alert("Erro ao marcar contrato como assinado.");
      return;
    }

    setEventos((atuais) =>
      atuais.map((evento) => (evento.id === id ? { ...evento, status: "assinado" } : evento))
    );

    if (eventoSelecionado === id) setTextoContrato("");
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

  function gerarContrato(eventoId = eventoSelecionado) {
    const evento = eventos.find((e) => e.id === eventoId);

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

    setEventoSelecionado(evento.id);
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
        <div className="contratos-page">
          <header className="page-header">
            <div className="header-left">
              <div className="header-icon" aria-hidden="true">
                <FileText size={26} />
              </div>
              <div>
                <h1>Contratos</h1>
                <p>Gerencie contratos, modelos e documentos gerados pela plataforma.</p>
              </div>
            </div>

            <button type="button" className="btn-primary header-btn" onClick={() => gerarContrato()}>
              <Plus size={18} aria-hidden="true" />
              Novo Contrato
            </button>
          </header>

          <section className="hero-grid">
            <div className="metric-card">
              <div>
                <span>Eventos disponíveis</span>
                <strong>{eventos.length}</strong>
                <p>Base da agenda</p>
              </div>
              <CalendarDays size={24} aria-hidden="true" />
            </div>

            <div className="metric-card">
              <div>
                <span>Contratos filtrados</span>
                <strong>{eventosFiltrados.length}</strong>
                <p>Resultado atual</p>
              </div>
              <Search size={24} aria-hidden="true" />
            </div>

            <Link href="/contratos-modelo" className="config-card-link">
              <div className="config-card">
                <div>
                  <span>Modelo ativo</span>
                  <strong>Configurar Contrato</strong>
                  <p>{modeloContrato.titulo || modeloPadrao.titulo}</p>
                </div>
                <Settings2 size={24} aria-hidden="true" />
              </div>
            </Link>
          </section>

          <div className="main-grid">
            <section className="panel contracts-panel">
              <div className="panel-header">
                <div>
                  <h2>Contratos pendentes e gerados</h2>
                  <p>Mais próximos primeiro. Busque por cliente, evento, cidade ou número.</p>
                </div>
                <span className="count-badge">{eventosFiltrados.length}</span>
              </div>

              <div className="search-box">
                <Search size={18} aria-hidden="true" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por cliente, evento, cidade ou número..."
                />
              </div>

              {carregando ? (
                <div className="empty-state">
                  <div className="spinner" aria-hidden="true" />
                  <h3>Carregando contratos</h3>
                  <p>Estamos preparando os dados da agenda, clientes e modelos.</p>
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <div className="empty-state">
                  <FileCheck2 size={34} aria-hidden="true" />
                  <h3>Nenhum contrato encontrado</h3>
                  <p>Contratos assinados saem desta lista. Ajuste a busca para ver outros pendentes.</p>
                </div>
              ) : (
                <div className="contracts-list">
                  {eventosFiltrados.map((evento) => {
                    const selecionado = evento.id === eventoSelecionado;
                    const status = statusContrato(evento);

                    return (
                      <article key={evento.id} className={`contract-card ${selecionado ? "active" : ""}`}>
                        <div className="contract-main">
                          <div className="contract-top">
                            <div className="doc-icon" aria-hidden="true">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h3>{evento.event_type || evento.show_format || "Contrato de show"}</h3>
                              <p>{numeroContratoEvento(evento)}</p>
                            </div>
                          </div>

                          <div className="contract-info">
                            <span><User size={14} aria-hidden="true" />{evento.client_name || "Cliente não informado"}</span>
                            <span><FileCheck2 size={14} aria-hidden="true" />{evento.show_format || "Evento sem formato"}</span>
                            <span><CalendarDays size={14} aria-hidden="true" />{formatarDataBR(evento.event_date)}</span>
                            <span><MapPin size={14} aria-hidden="true" />{cidadeEvento(evento)}</span>
                          </div>

                          <div className="contract-meta">
                            <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                            <span>Criado em {dataCriacaoEvento(evento)}</span>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button type="button" onClick={() => gerarContrato(evento.id)} className="icon-action">
                            <Eye size={15} aria-hidden="true" />
                            Visualizar
                          </button>
                          <button type="button" onClick={baixarPDF} className="icon-action">
                            <Download size={15} aria-hidden="true" />
                            Baixar PDF
                          </button>
                          <button type="button" onClick={() => selecionarEvento(evento.id)} className="icon-action">
                            <Edit3 size={15} aria-hidden="true" />
                            Editar
                          </button>
                          <button type="button" onClick={() => marcarComoAssinado(evento.id)} className="icon-action success">
                            <CheckCircle2 size={15} aria-hidden="true" />
                            Assinado
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="side-stack">
              <section className="panel quick-panel">
                <div className="panel-header compact">
                  <div>
                    <h2>Ações rápidas</h2>
                    <p>Selecione um evento, gere a prévia e baixe o PDF.</p>
                  </div>
                </div>

            <label className="field-label">Selecione o evento</label>

            <select
              className="select-field"
              value={eventoSelecionado}
              onChange={(e) => selecionarEvento(e.target.value)}
            >
              <option value="">Selecione um evento</option>

              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.event_date} - {evento.client_name} - {evento.show_format}
                </option>
              ))}
            </select>

            {eventoAtual && (
              <div className="selected-event">
                <span>{numeroContratoEvento(eventoAtual)}</span>
                <strong>{eventoAtual.client_name}</strong>
                <p>{formatarDataBR(eventoAtual.event_date)} - {cidadeEvento(eventoAtual)}</p>
                <div className="selected-status">
                  <span className={`status-badge status-${statusContrato(eventoAtual).toLowerCase()}`}>
                    {statusContrato(eventoAtual)}
                  </span>
                  <small>{textoContrato ? "Prévia gerada" : "Aguardando geração"}</small>
                </div>
              </div>
            )}

            <div className="quick-actions">
              <button type="button" onClick={() => gerarContrato()} className="btn-primary">
                <Sparkles size={17} aria-hidden="true" />
                Gerar Contrato
              </button>

              <button type="button" onClick={baixarPDF} className="btn-secondary">
                <Download size={17} aria-hidden="true" />
                Baixar PDF
              </button>

              {eventoAtual && (
                <button type="button" onClick={() => marcarComoAssinado(eventoAtual.id)} className="btn-success">
                  <CheckCircle2 size={17} aria-hidden="true" />
                  Marcar como assinado
                </button>
              )}
            </div>

            {carregando && (
              <p style={{ color: "#b8b8d8", marginTop: "16px" }}>
                Carregando informações...
              </p>
            )}
              </section>

            </aside>
          </div>

          {textoContrato && (
            <section className="panel preview-panel">
              <div className="panel-header">
                <div>
                  <h2>Prévia do Contrato</h2>
                  <p>Revise o documento antes de baixar o PDF.</p>
                </div>
                <button type="button" onClick={baixarPDF} className="btn-secondary small">
                  <Download size={16} aria-hidden="true" />
                  Baixar PDF
                </button>
              </div>

              <div className="preview-box">
                {textoPreviewSemMarkdown(textoContrato)}
              </div>
            </section>
          )}

          <style jsx>{`
            .contratos-page {
              width: 100%;
              max-width: 1320px;
              margin: 0 auto;
              color: #ffffff;
            }

            .page-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 18px;
              flex-wrap: wrap;
              margin-bottom: 24px;
            }

            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .header-icon {
              width: 62px;
              height: 62px;
              border-radius: 20px;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              display: grid;
              place-items: center;
              color: #fff;
              box-shadow: 0 18px 38px rgba(139, 53, 255, 0.35);
              flex-shrink: 0;
            }

            h1,
            h2,
            h3,
            p {
              margin: 0;
            }

            h1 {
              font-size: 32px;
              line-height: 1.1;
              font-weight: 900;
              letter-spacing: -0.5px;
            }

            .page-header p,
            .panel-header p,
            .config-card p,
            .selected-event p {
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.45;
              margin-top: 4px;
            }

            .hero-grid {
              display: grid;
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 18px;
              margin-bottom: 22px;
            }

            .metric-card,
            .config-card,
            .panel {
              border-radius: 24px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.09);
              box-shadow: 0 22px 50px rgba(0, 0, 0, 0.22);
              backdrop-filter: blur(18px);
            }

            .metric-card,
            .config-card {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 14px;
              padding: 20px;
              text-decoration: none;
            }

            .config-card-link {
              display: block;
              min-width: 0;
              color: inherit;
              text-decoration: none;
            }

            .metric-card span,
            .config-card span {
              display: block;
              color: #94a3b8;
              font-size: 13px;
              font-weight: 700;
            }

            .metric-card strong,
            .config-card strong {
              display: block;
              margin-top: 8px;
              color: #ffffff;
              font-size: 26px;
              font-weight: 900;
            }

            .config-card strong {
              font-size: 20px;
            }

            .metric-card p,
            .config-card p {
              margin-top: 5px;
              color: #64748b;
              font-size: 12px;
              line-height: 1.4;
            }

            .metric-card svg,
            .config-card svg {
              width: 50px;
              height: 50px;
              padding: 13px;
              border-radius: 16px;
              color: #8b35ff;
              background: rgba(139, 53, 255, 0.16);
              border: 1px solid rgba(139, 53, 255, 0.28);
              flex-shrink: 0;
            }

            .main-grid {
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
              gap: 22px;
              align-items: start;
            }

            .panel {
              padding: 22px;
            }

            .side-stack {
              display: grid;
              gap: 22px;
            }

            .panel-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 14px;
              margin-bottom: 18px;
            }

            .panel-header.compact {
              display: block;
            }

            .panel-header h2 {
              color: #fff;
              font-size: 21px;
              font-weight: 900;
              letter-spacing: -0.02em;
            }

            .count-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 34px;
              height: 30px;
              padding: 0 12px;
              border-radius: 999px;
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.16);
              border: 1px solid rgba(139, 53, 255, 0.28);
              font-size: 13px;
              font-weight: 900;
            }

            .search-box {
              display: flex;
              align-items: center;
              gap: 10px;
              height: 50px;
              padding: 0 16px;
              border-radius: 16px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #94a3b8;
              margin-bottom: 18px;
            }

            .search-box input,
            .select-field {
              width: 100%;
              border: 0;
              outline: 0;
              color: #fff;
              background: transparent;
              font-size: 14px;
            }

            .search-box input::placeholder {
              color: rgba(148, 163, 184, 0.72);
            }

            .contracts-list {
              display: grid;
              gap: 14px;
              max-height: 590px;
              overflow-y: auto;
              padding-right: 4px;
              scrollbar-width: none;
              -ms-overflow-style: none;
            }

            .contracts-list::-webkit-scrollbar {
              display: none;
            }

            .contract-card {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 150px;
              gap: 16px;
              padding: 18px;
              border-radius: 20px;
              background: rgba(15, 23, 42, 0.58);
              border: 1px solid rgba(255, 255, 255, 0.09);
              transition: border-color 0.18s ease, transform 0.18s ease;
            }

            .contract-card:hover,
            .contract-card.active {
              border-color: rgba(139, 53, 255, 0.35);
              transform: translateY(-1px);
            }

            .contract-top {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 14px;
            }

            .doc-icon {
              width: 44px;
              height: 44px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.14);
              border: 1px solid rgba(139, 53, 255, 0.22);
              flex-shrink: 0;
            }

            .contract-card h3 {
              color: #fff;
              font-size: 17px;
              font-weight: 900;
              line-height: 1.25;
            }

            .contract-top p {
              margin-top: 4px;
              color: #38bdf8;
              font-size: 12px;
              font-weight: 800;
            }

            .contract-info {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 9px;
              margin-bottom: 14px;
            }

            .contract-info span {
              display: flex;
              align-items: center;
              gap: 7px;
              min-width: 0;
              color: #cbd5e1;
              font-size: 13px;
              line-height: 1.35;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .contract-info svg {
              color: #93c5fd;
              flex-shrink: 0;
            }

            .contract-meta {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
              color: #64748b;
              font-size: 12px;
              font-weight: 700;
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              min-height: 26px;
              padding: 0 10px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 900;
              border: 1px solid transparent;
            }

            .status-gerado {
              color: #38bdf8;
              background: rgba(14, 165, 233, 0.14);
              border-color: rgba(14, 165, 233, 0.28);
            }

            .status-enviado {
              color: #c4b5fd;
              background: rgba(139, 53, 255, 0.16);
              border-color: rgba(139, 53, 255, 0.3);
            }

            .status-assinado {
              color: #37e884;
              background: rgba(55, 232, 132, 0.12);
              border-color: rgba(55, 232, 132, 0.26);
            }

            .status-pendente {
              color: #ffb454;
              background: rgba(255, 180, 84, 0.12);
              border-color: rgba(255, 180, 84, 0.28);
            }

            .status-cancelado {
              color: #fb7185;
              background: rgba(244, 63, 94, 0.14);
              border-color: rgba(244, 63, 94, 0.28);
            }

            .card-actions,
            .quick-actions {
              display: grid;
              gap: 9px;
              align-content: start;
            }

            .btn-primary,
            .btn-secondary,
            .icon-action,
            .btn-success {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 42px;
              border-radius: 14px;
              border: 1px solid transparent;
              color: #fff;
              font-size: 14px;
              font-weight: 900;
              cursor: pointer;
              text-decoration: none;
              transition: transform 0.16s ease, opacity 0.16s ease;
            }

            .btn-primary:hover,
            .btn-secondary:hover,
            .icon-action:hover,
            .btn-success:hover {
              transform: translateY(-1px);
              opacity: 0.94;
            }

            .btn-primary {
              width: 100%;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              box-shadow: 0 16px 32px rgba(139, 53, 255, 0.28);
              padding: 0 16px;
            }

            .header-btn {
              width: auto;
            }

            .btn-secondary,
            .icon-action,
            .btn-success {
              background: rgba(255, 255, 255, 0.07);
              border-color: rgba(255, 255, 255, 0.12);
            }

            .btn-secondary.small {
              width: auto;
              padding: 0 16px;
            }

            .icon-action {
              color: #dbeafe;
            }

            .icon-action.danger {
              color: #fb7185;
              background: rgba(244, 63, 94, 0.12);
              border-color: rgba(244, 63, 94, 0.22);
            }

            .icon-action.success,
            .btn-success {
              color: #37e884;
              background: rgba(55, 232, 132, 0.12);
              border-color: rgba(55, 232, 132, 0.26);
            }

            button:disabled {
              cursor: not-allowed;
              opacity: 0.52;
              transform: none !important;
            }

            .field-label {
              display: block;
              margin: 18px 0 8px;
              color: #cbd5e1;
              font-size: 13px;
              font-weight: 900;
            }

            .select-field {
              height: 50px;
              padding: 0 14px;
              border-radius: 16px;
              background: rgba(2, 6, 23, 0.45);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .select-field option {
              color: #fff;
              background: #0a0f1c;
            }

            .selected-event {
              margin-top: 14px;
              padding: 14px;
              border-radius: 16px;
              background: rgba(15, 23, 42, 0.58);
              border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .selected-event > span {
              color: #38bdf8;
              font-size: 12px;
              font-weight: 900;
            }

            .selected-event strong {
              display: block;
              margin-top: 4px;
              color: #fff;
              font-size: 16px;
            }

            .selected-status {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 1px solid rgba(255, 255, 255, 0.08);
            }

            .selected-status small {
              color: #94a3b8;
              font-size: 12px;
              font-weight: 800;
            }

            .quick-actions {
              margin-top: 16px;
            }

            .preview-panel {
              margin-top: 22px;
            }

            .preview-box {
              width: 100%;
              min-height: 520px;
              padding: 22px;
              border-radius: 18px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(2, 6, 23, 0.45);
              color: #fff;
              font-size: 15px;
              line-height: 1.7;
              box-sizing: border-box;
              white-space: pre-wrap;
              text-align: justify;
            }

            .empty-state {
              min-height: 280px;
              display: grid;
              place-items: center;
              text-align: center;
              padding: 32px;
              border-radius: 20px;
              border: 1px dashed rgba(255, 255, 255, 0.14);
              background: rgba(2, 6, 23, 0.3);
              color: #94a3b8;
            }

            .empty-state svg {
              color: #c4b5fd;
            }

            .empty-state h3 {
              margin-top: 12px;
              color: #fff;
              font-size: 18px;
              font-weight: 900;
            }

            .empty-state p {
              margin-top: 8px;
              max-width: 380px;
              line-height: 1.6;
            }

            .spinner {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              border: 3px solid rgba(255, 255, 255, 0.12);
              border-top-color: #8b35ff;
              animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }

            @media (max-width: 1100px) {
              .hero-grid,
              .main-grid {
                grid-template-columns: 1fr;
              }
            }

            @media (max-width: 720px) {
              .page-header {
                align-items: flex-start;
              }

              .header-btn {
                width: 100%;
              }

              h1 {
                font-size: 30px;
              }

              .panel,
              .metric-card {
                border-radius: 20px;
                padding: 18px;
              }

              .contract-card {
                grid-template-columns: 1fr;
              }

              .contract-info {
                grid-template-columns: 1fr;
              }

              .card-actions {
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }
            }
          `}</style>
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


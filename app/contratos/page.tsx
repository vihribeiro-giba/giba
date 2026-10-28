"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import AppLayout from "../../components/AppLayout";
import ContractDocumentPreview from "../../components/contratos/ContractDocumentPreview";
import ContractEventSelect, { type ContractEventOption } from "../../components/contratos/ContractEventSelect";
import { supabase } from "../../lib/supabase";
import { getAccountAuthUser } from "../../lib/access-session";
import {
  buildContractText,
  normalizeContractTopics,
  type ContractTopic,
} from "../../lib/contracts/template";
import { createContractPdfDocument } from "../../lib/contracts/pdf";
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
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  User,
  X,
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
  topicos: ContractTopic[];
};

type ContractRecord = {
  id: string;
  user_id: string;
  event_id: string | null;
  contract_number: string;
  title: string;
  status: string;
  content: string;
  client_name: string;
  format_name: string;
  event_date: string | null;
  location: string;
  pdf_url?: string | null;
  client_snapshot?: Record<string, unknown>;
  company_snapshot?: Record<string, unknown>;
  event_snapshot?: Record<string, unknown>;
  created_at: string;
  updated_at?: string | null;
};

type WordToken = { text: string; bold: boolean };

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
  topicos: [],
};

function ContratosContent() {
  const searchParams = useSearchParams();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [modeloContrato, setModeloContrato] = useState<ContractSettings>(modeloPadrao);
  const [contratos, setContratos] = useState<ContractRecord[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState("");
  const [textoContrato, setTextoContrato] = useState("");
  const [contratoSelecionado, setContratoSelecionado] = useState<ContractRecord | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvandoContrato, setSalvandoContrato] = useState(false);
  const [gerandoContrato, setGerandoContrato] = useState(false);
  const [snapshotDisponivel, setSnapshotDisponivel] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  async function obterUsuarioLogado() {
    const { data, error } = await getAccountAuthUser();

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

    const contratosRes = await supabase
      .from("contracts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setEventos(eventosRes.data || []);
    setClientes(clientesRes.data || []);
    setEmpresa(empresaRes.data || null);
    if (contratosRes.error) {
      console.info("Snapshots de contratos ainda não estão disponíveis:", contratosRes.error.message);
      setSnapshotDisponivel(false);
      setContratos([]);
    } else {
      setSnapshotDisponivel(true);
      setContratos((contratosRes.data || []) as ContractRecord[]);
    }

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
          empresaRes.data?.cidade?.trim() ||
          modeloRes.data.cidade_assinatura ||
          modeloPadrao.cidade_assinatura,
        topicos: normalizeContractTopics(modeloRes.data.topicos, modeloRes.data),
      });
    } else if (empresaRes.data?.cidade?.trim()) {
      setModeloContrato((current) => ({
        ...current,
        cidade_assinatura: empresaRes.data.cidade.trim(),
      }));
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

  const contratoPorEvento = useMemo(() => {
    const map = new Map<string, ContractRecord>();
    contratos.forEach((contrato) => {
      if (contrato.event_id) map.set(contrato.event_id, contrato);
    });
    return map;
  }, [contratos]);

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
        return Math.abs(dataA - hoje.getTime()) - Math.abs(dataB - hoje.getTime());
      });
  }, [eventos, busca, contratos]);

  const contratosAssinados = useMemo(
    () => eventos.filter((evento) => statusContrato(evento) === "Assinado").length,
    [eventos, contratos],
  );

  const contratosSemAssinatura = useMemo(
    () => eventos.filter((evento) => statusContrato(evento) !== "Assinado").length,
    [eventos, contratos],
  );

  const eventoAtual = useMemo(
    () => eventos.find((evento) => evento.id === eventoSelecionado) || null,
    [eventos, eventoSelecionado]
  );

  const opcoesEventos = useMemo<ContractEventOption[]>(
    () => eventos.map((evento) => ({
      id: evento.id,
      date: evento.event_date,
      client: evento.client_name,
      event: evento.event_type,
      format: evento.show_format,
      city: cidadeEvento(evento),
    })),
    [eventos],
  );

  const nomeClientePreview = contratoSelecionado?.client_name || eventoAtual?.client_name || "CONTRATANTE";
  const nomeContratadoPreview = empresa?.responsavel || empresa?.razao_social || "CONTRATADO";

  function numeroContratoEvento(evento: Evento) {
    return contratoPorEvento.get(evento.id)?.contract_number || `CTR-${String(evento.id || "").slice(0, 8).toUpperCase()}`;
  }

  function dataCriacaoEvento(evento: Evento) {
    const createdAt = contratoPorEvento.get(evento.id)?.created_at || evento.created_at;
    if (!createdAt) return "";
    return new Date(createdAt).toLocaleDateString("pt-BR");
  }

  function cidadeEvento(evento: Evento) {
    return (evento.location || "").split(",").map((item) => item.trim()).filter(Boolean).slice(-2).join(", ");
  }

  function statusContrato(evento: Evento) {
    const snapshot = contratoPorEvento.get(evento.id);
    const status = normalizar(snapshot?.status || evento.status || "");

    if (status.includes("cancel")) return "Cancelado";
    if (status.includes("assin")) return "Assinado";
    if (status.includes("envi")) return "Enviado";
    if (snapshot || (textoContrato && evento.id === eventoSelecionado)) return "Gerado";

    return "Pendente";
  }

  function selecionarEvento(id: string) {
    setEventoSelecionado(id);
    setTextoContrato("");
    setContratoSelecionado(null);
    setTextoEdicao("");
    setModoEdicao(false);
  }

  async function marcarComoAssinado(id: string) {
    const contrato = contratoPorEvento.get(id);
    if (!contrato) {
      alert("Gere e revise o contrato antes de marcá-lo como assinado.");
      return;
    }
    const user = await obterUsuarioLogado();
    if (!user) return;

    const { error } = await supabase
      .from("contracts")
      .update({ status: "assinado" })
      .eq("id", contrato.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Erro ao marcar contrato como assinado:", error);
      alert("Erro ao marcar contrato como assinado.");
      return;
    }

    setContratos((atuais) =>
      atuais.map((item) => item.id === contrato.id ? { ...item, status: "assinado" } : item),
    );
    setContratoSelecionado((current) => current?.id === contrato.id ? { ...current, status: "assinado" } : current);
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

    if (!dataEvento) {
      return pagamento
        .replace(/data do evento/gi, "data a definir")
        .replace(/dia do evento/gi, "dia a definir");
    }

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
    if (!empresa) return modeloContrato.contratado_texto || "";

    const nome = empresa.razao_social || empresa.nome_artistico || "CONTRATADO";
    const endereco = [empresa.endereco_completo, empresa.cidade, empresa.estado].filter(Boolean).join(", ");
    const partes = [`**${nome}**`];
    partes.push(empresa.cnpj ? `de CNPJ **${empresa.cnpj}**` : "com CNPJ não informado");
    if (endereco) partes.push(`com sede em **${endereco}**`);
    if (empresa.responsavel) {
      partes.push(`representado por **${empresa.responsavel}**${empresa.cpf ? `, CPF nº **${empresa.cpf}**` : ", com CPF não informado"}`);
    }
    return `${partes.join(", ")}.`;
  }

  function textoContratante(cliente: Cliente) {
    const partes = [`**${cliente.nome || "CONTRATANTE"}**`];
    partes.push(cliente.cpf_cnpj ? `inscrito(a) no CPF/CNPJ sob **${cliente.cpf_cnpj}**` : "com CPF/CNPJ não informado");
    if (cliente.endereco_completo) partes.push(`residente em **${cliente.endereco_completo}**`);
    return `${partes.join(", ")}.`;
  }

  function corrigirDadosAusentes(texto: string) {
    return texto
      .replace(/iniciando-se às \*\*a definir\*\* e terminando às \*\*a definir\*\*/gi, "com horário a definir")
      .replace(/iniciando às \*\*a definir\*\* e terminando às \*\*a definir\*\*/gi, "com horário a definir")
      .replace(/iniciando-se às (\*\*.*?\*\*) e terminando às \*\*a definir\*\*/gi, "iniciando-se às $1, com término a definir")
      .replace(/iniciando às (\*\*.*?\*\*) e terminando às \*\*a definir\*\*/gi, "iniciando às $1, com término a definir");
  }

  async function gerarContrato(eventoId = eventoSelecionado, editarDepois = false) {
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

    const existente = contratoPorEvento.get(evento.id);
    if (existente?.content) {
      abrirContrato(existente, editarDepois);
      return;
    }

    if (!snapshotDisponivel) {
      alert("A estrutura de snapshots de contratos ainda precisa ser criada no Supabase.");
      return;
    }

    setGerandoContrato(true);

    const dataEvento = formatarDataBR(evento.event_date);
    const horaInicio = formatarHora(evento.event_time);
    const horaFim = calcularHorarioFinal(evento.event_time, evento.show_duration);
    const valor = formatarMoeda(evento.fee);
    const valorExtenso = valorPorExtenso(evento.fee);
    const pagamento = formatarPagamentoContrato(
      evento.payment_format || "Sinal de 50% e o restante na data do evento",
      dataEvento
    );

    const topics = normalizeContractTopics(modeloContrato.topicos, modeloContrato);
    const texto = corrigirDadosAusentes(buildContractText({
      title: modeloContrato.titulo || modeloPadrao.titulo,
      client: textoContratante(cliente),
      contractor: textoContratado(),
      topics,
      variables: {
        local: `**${evento.location || "a definir"}**`,
        data_evento: `**${dataEvento || "a definir"}**`,
        hora_inicio: `**${horaInicio || "a definir"}**`,
        hora_fim: `**${horaFim || "a definir"}**`,
        duracao: `**${evento.show_duration || "a definir"}**`,
        formato: `**${evento.show_format || evento.event_type || "a definir"}**`,
        valor: `**${valor}**`,
        valor_extenso: `**${valorExtenso}**`,
        pagamento: `**${pagamento}**`,
      },
      city: modeloContrato.cidade_assinatura || "Sabará",
      signatureDate: dataAtualContrato(),
    }));

    const user = await obterUsuarioLogado();
    if (!user) {
      setGerandoContrato(false);
      return;
    }

    const payload = {
      user_id: user.id,
      event_id: evento.id,
      contract_number: numeroContratoEvento(evento),
      title: modeloContrato.titulo || modeloPadrao.titulo,
      status: normalizar(evento.status || "").includes("assin") ? "assinado" : "gerado",
      content: texto,
      client_name: cliente.nome || evento.client_name || "",
      format_name: evento.show_format || evento.event_type || "",
      event_date: evento.event_date || null,
      location: evento.location || "",
      client_snapshot: cliente,
      company_snapshot: empresa,
      event_snapshot: evento,
    };

    const camposObrigatorios = [
      "user_id",
      "contract_number",
      "title",
      "content",
      "client_name",
      "format_name",
      "location",
      "status",
      "client_snapshot",
      "company_snapshot",
      "event_snapshot",
    ] as const;

    const camposAusentes = camposObrigatorios.filter(
      (campo) => !Object.prototype.hasOwnProperty.call(payload, campo) || payload[campo] === null || payload[campo] === undefined,
    );
    const camposTextuaisVazios = (["user_id", "contract_number", "title", "content", "client_name", "status"] as const)
      .filter((campo) => !String(payload[campo] || "").trim());

    if (camposAusentes.length || camposTextuaisVazios.length) {
      console.group("Erro ao criar contrato");
      console.error("Mensagem:", "O payload do snapshot está incompleto.");
      console.error("Campos ausentes:", camposAusentes);
      console.error("Campos obrigatórios vazios:", camposTextuaisVazios);
      console.error("Objeto enviado:", payload);
      console.groupEnd();
      setGerandoContrato(false);
      alert("Não foi possível gerar o contrato porque o snapshot está incompleto.");
      return;
    }

    const { data, error } = await supabase
      .from("contracts")
      .insert(payload)
      .select("id,user_id,event_id,contract_number,title,content,client_name,format_name,event_date,location,status,pdf_url,client_snapshot,company_snapshot,event_snapshot,created_at,updated_at")
      .single();

    setGerandoContrato(false);
    if (error) {
      console.group("Erro ao criar contrato");
      console.error("Mensagem:", error.message);
      console.error("Detalhes:", error.details);
      console.error("Hint:", error.hint);
      console.error("Código:", error.code);
      console.error("Objeto enviado:", payload);
      console.error("Erro completo:", error);
      console.groupEnd();
      alert("Não foi possível criar o contrato. Consulte o console para ver os detalhes do Supabase.");
      return;
    }

    if (!data) {
      console.group("Erro ao criar contrato");
      console.error("Mensagem:", "O Supabase não retornou o contrato após o insert.");
      console.error("Objeto enviado:", payload);
      console.groupEnd();
      alert("O contrato foi enviado ao Supabase, mas o registro criado não foi retornado.");
      return;
    }

    const novo = data as ContractRecord;
    setContratos((atuais) => [novo, ...atuais.filter((item) => item.id !== novo.id)]);
    abrirContrato(novo, editarDepois);
  }

  function abrirContrato(contrato: ContractRecord, editar = false) {
    setContratoSelecionado(contrato);
    setEventoSelecionado(contrato.event_id || "");
    setTextoContrato(contrato.content);
    setTextoEdicao(contrato.content);
    setModoEdicao(editar);
    window.setTimeout(() => document.getElementById("contract-preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  async function visualizarContrato(evento: Evento, editar = false) {
    const contrato = contratoPorEvento.get(evento.id);
    if (contrato?.content) abrirContrato(contrato, editar);
    else await gerarContrato(evento.id, editar);
  }

  async function salvarAlteracoesContrato() {
    if (!contratoSelecionado) return;
    const user = await obterUsuarioLogado();
    if (!user) return;
    setSalvandoContrato(true);
    const { data, error } = await supabase
      .from("contracts")
      .update({ content: textoEdicao })
      .eq("id", contratoSelecionado.id)
      .eq("user_id", user.id)
      .select("*")
      .single();
    setSalvandoContrato(false);
    if (error || !data) {
      console.error("Erro ao salvar contrato:", error);
      alert("Não foi possível salvar as alterações do contrato.");
      return;
    }
    const atualizado = data as ContractRecord;
    setContratos((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
    setContratoSelecionado(atualizado);
    setTextoContrato(atualizado.content);
    setTextoEdicao(atualizado.content);
    setModoEdicao(false);
  }

  async function excluirContrato(contrato: ContractRecord) {
    if (!confirm(`Excluir o contrato ${contrato.contract_number}? O evento da Agenda será preservado.`)) return;
    const user = await obterUsuarioLogado();
    if (!user) return;
    const { error } = await supabase.from("contracts").delete().eq("id", contrato.id).eq("user_id", user.id);
    if (error) {
      console.error("Erro ao excluir contrato:", error);
      alert("Não foi possível excluir o contrato.");
      return;
    }
    setContratos((atuais) => atuais.filter((item) => item.id !== contrato.id));
    if (contratoSelecionado?.id === contrato.id) {
      setContratoSelecionado(null);
      setTextoContrato("");
      setTextoEdicao("");
      setModoEdicao(false);
    }
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
    const garantirEspaco = () => {
      if (y > 277) {
        doc.addPage();
        y = 20;
      }
    };

    paragrafos.forEach((paragrafo) => {
      if (!paragrafo.trim()) {
        y += lineHeight;
        garantirEspaco();
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
          garantirEspaco();
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
        garantirEspaco();
        renderizarLinhaJustificada(doc, linhaAtual, x, y, larguraMaxima, false);
        y += lineHeight;
      }
    });

    return y;
  }

  function baixarPDF(contrato = contratoSelecionado) {
  const conteudo = contrato?.content || textoContrato;
  if (!conteudo) {
    alert("Abra e revise o contrato antes de baixar o PDF.");
    return;
  }

  const eventoId = contrato?.event_id || eventoSelecionado;
  const evento = eventos.find((e) => e.id === eventoId);

  const cliente = evento
    ? clientes.find((c) => normalizar(c.nome) === normalizar(evento.client_name))
    : null;

  const nomeContratante = cliente?.nome || "CONTRATANTE";
  const nomeContratado =
    empresa?.responsavel || empresa?.razao_social || "CONTRATADO";

  const documento = createContractPdfDocument({
    text: conteudo,
    title: contrato?.title || modeloContrato.titulo || modeloPadrao.titulo,
    clientName: nomeContratante,
    contractorName: nomeContratado,
  });
  documento.save(`Contrato-Prestação-de-Serviços(${nomeContratante}).pdf`);
  return;

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
      blocoLimpo === blocoLimpo.toUpperCase() && blocoLimpo.length < 90;

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
    <ProtectedRoute modulo="contratos">
      <PlanProtectedRoute modulo="contratos">
        <AppLayout>
        <div className="contratos-page">
          <header className="page-header">
            <div className="header-left">
              <div className="header-icon" aria-hidden="true">
                <FileText size={24} />
              </div>
              <div>
                <h1>Contratos</h1>
                <p>Gerencie contratos, modelos e documentos gerados pela plataforma.</p>
              </div>
            </div>

          </header>

          <section className="hero-grid">
            <div className="metrics-pair">
              <div className="metric-card">
                <div>
                  <span>Contratos Assinados</span>
                  <strong>{contratosAssinados}</strong>
                  <p>Contratos finalizados</p>
                </div>
                <CheckCircle2 size={24} aria-hidden="true" />
              </div>

              <div className="metric-card">
                <div>
                  <span>Contratos sem Assinatura</span>
                  <strong>{contratosSemAssinatura}</strong>
                  <p>Aguardando assinatura</p>
                </div>
                <FileCheck2 size={24} aria-hidden="true" />
              </div>
            </div>

            <Link href="/contratos-modelo" className="config-card-link" aria-label="Visualizar e configurar o modelo de contrato">
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
                  <h2>Contratos Pendentes e Gerados</h2>
                  <p>Mais próximos primeiro. Busque por cliente, evento, cidade ou número.</p>
                </div>
                <span className="count-badge">{eventosFiltrados.length}</span>
              </div>

              <div className="search-box">
                <Search size={18} aria-hidden="true" />
                <input
                  aria-label="Buscar contratos"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por cliente, evento, cidade ou número..."
                />
              </div>

              {carregando ? (
                <div className="empty-state">
                  <div className="spinner" aria-hidden="true" />
                  <h3>Carregando Contratos</h3>
                  <p>Estamos preparando os dados da agenda, clientes e modelos.</p>
                </div>
              ) : eventosFiltrados.length === 0 ? (
                <div className="empty-state">
                  <FileCheck2 size={34} aria-hidden="true" />
                  <h3>Nenhum Contrato Encontrado</h3>
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
                            {cidadeEvento(evento) && <span><MapPin size={14} aria-hidden="true" />{cidadeEvento(evento)}</span>}
                          </div>

                          <div className="contract-meta">
                            <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>
                            {dataCriacaoEvento(evento) && <span>Criado em {dataCriacaoEvento(evento)}</span>}
                          </div>
                        </div>

                        <div className="card-actions">
                          <button type="button" onClick={() => void visualizarContrato(evento)} className="icon-action primary-action">
                            <Eye size={15} aria-hidden="true" />
                            Visualizar
                          </button>
                          <button type="button" onClick={() => void visualizarContrato(evento, true)} className="icon-action">
                            <Edit3 size={15} aria-hidden="true" />
                            Editar
                          </button>
                          <button type="button" disabled={!contratoPorEvento.get(evento.id)} onClick={() => baixarPDF(contratoPorEvento.get(evento.id) || null)} className="icon-action">
                            <Download size={15} aria-hidden="true" />
                            Baixar PDF
                          </button>
                          {status !== "Assinado" && (
                            <button type="button" disabled={!contratoPorEvento.get(evento.id)} onClick={() => void marcarComoAssinado(evento.id)} className="icon-action success">
                              <CheckCircle2 size={15} aria-hidden="true" />
                              Marcar como assinado
                            </button>
                          )}
                          {contratoPorEvento.get(evento.id) && (
                            <button type="button" onClick={() => void excluirContrato(contratoPorEvento.get(evento.id)!)} className="icon-action danger">
                              <Trash2 size={15} aria-hidden="true" />
                              Excluir
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <aside className="side-stack">
              <section className="panel quick-panel" id="contract-quick-actions">
                <div className="panel-header compact">
                  <div>
                    <h2>Ações Rápidas</h2>
                    <p>Selecione um evento para gerar o contrato.</p>
                  </div>
                </div>

            <label className="field-label">Selecione o evento</label>

            <ContractEventSelect
              value={eventoSelecionado}
              events={opcoesEventos}
              onChange={selecionarEvento}
              disabled={carregando}
            />

            {eventoAtual && (
              <div className="selected-event">
                <span>{numeroContratoEvento(eventoAtual)}</span>
                <strong>{eventoAtual.client_name}</strong>
                <p>{formatarDataBR(eventoAtual.event_date)}{cidadeEvento(eventoAtual) ? ` · ${cidadeEvento(eventoAtual)}` : ""}</p>
                <div className="selected-status">
                  <span className={`status-badge status-${statusContrato(eventoAtual).toLowerCase()}`}>
                    {statusContrato(eventoAtual)}
                  </span>
                  <small>{textoContrato ? "Prévia gerada" : "Aguardando geração"}</small>
                </div>
              </div>
            )}

            <div className="quick-actions">
              <button type="button" disabled={!eventoSelecionado || gerandoContrato} onClick={() => void gerarContrato()} className="btn-primary">
                <Sparkles size={17} aria-hidden="true" />
                {gerandoContrato ? "Gerando..." : "Gerar Contrato"}
              </button>
            </div>

            {!snapshotDisponivel && (
              <p className="snapshot-warning">Execute a migration de snapshots no Supabase para gerar e editar contratos.</p>
            )}

            {carregando && (
              <p style={{ color: "#b8b8d8", marginTop: "16px" }}>
                Carregando informações...
              </p>
            )}
              </section>

            </aside>
          </div>

          {textoContrato && (
            <section className="panel preview-panel" id="contract-preview">
              <div className="panel-header">
                <div>
                  <h2>Prévia do Contrato</h2>
                  <p>{modoEdicao ? "Faça ajustes somente neste contrato." : "A prévia utiliza o mesmo conteúdo e formatação do PDF."}</p>
                </div>
                <div className="preview-actions">
                  {modoEdicao ? (
                    <>
                      <button type="button" onClick={() => { setTextoEdicao(textoContrato); setModoEdicao(false); }} className="btn-secondary small"><X size={16} />Cancelar</button>
                      <button type="button" disabled={salvandoContrato} onClick={() => void salvarAlteracoesContrato()} className="btn-primary small"><Save size={16} />{salvandoContrato ? "Salvando..." : "Salvar alterações"}</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => { setTextoEdicao(textoContrato); setModoEdicao(true); }} className="btn-secondary small"><Edit3 size={16} />Editar contrato</button>
                      <button type="button" onClick={() => baixarPDF()} className="btn-secondary small"><Download size={16} />Baixar PDF</button>
                    </>
                  )}
                </div>
              </div>

              {modoEdicao ? (
                <textarea value={textoEdicao} onChange={(event) => setTextoEdicao(event.target.value)} className="preview-editor" aria-label="Conteúdo editável do contrato" />
              ) : (
                <ContractDocumentPreview text={textoContrato} title={contratoSelecionado?.title || modeloContrato.titulo || modeloPadrao.titulo} clientName={nomeClientePreview} contractorName={nomeContratadoPreview} />
              )}
            </section>
          )}

          <style jsx>{`
            .contratos-page {
              width: 100%;
              max-width: 1360px;
              margin: 0 auto;
              color: #ffffff;
            }

            .page-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 16px;
              flex-wrap: wrap;
              margin-bottom: 22px;
            }

            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .header-icon {
              width: 46px;
              height: 46px;
              border-radius: 14px;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              display: grid;
              place-items: center;
              color: #fff;
              box-shadow: 0 10px 24px rgba(76, 29, 149, 0.24);
              flex-shrink: 0;
            }

            h1,
            h2,
            h3,
            p {
              margin: 0;
            }

            h1 {
              font-size: 27px;
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
              grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
              align-items: stretch;
              gap: 16px;
              margin-bottom: 16px;
            }

            .metrics-pair {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 16px;
              min-width: 0;
            }

            .hero-grid > * {
              min-width: 0;
              height: 100%;
            }

            .metric-card,
            .config-card,
            .panel {
              border-radius: 18px;
              background: rgba(10, 18, 33, 0.62);
              border: 1px solid rgba(148, 163, 184, 0.14);
              box-shadow: none;
            }

            .metric-card,
            .config-card {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 12px;
              padding: 18px;
              min-height: 122px;
              height: 100%;
              box-sizing: border-box;
              text-decoration: none;
            }

            .metric-card > div,
            .config-card > div {
              display: flex;
              min-width: 0;
              flex: 1;
              flex-direction: column;
              align-items: flex-start;
            }

            .config-card-link {
              display: block;
              min-width: 0;
              height: 100%;
              color: inherit;
              text-decoration: none;
              cursor: pointer;
              border-radius: 18px;
              transition: border-color 0.16s ease, background-color 0.16s ease;
            }

            .config-card-link:hover {
              transform: none;
              filter: none;
            }

            .config-card-link:hover .config-card {
              border-color: rgba(56, 189, 248, 0.34);
              background: rgba(15, 29, 48, 0.78);
            }

            .config-action {
              display: flex;
              align-items: center;
              gap: 5px;
              margin-top: auto !important;
              color: #67e8f9 !important;
              font-weight: 800;
            }

            .config-card .model-card-title {
              max-width: 100%;
              margin-top: 0;
              font-size: 22px;
              line-height: 1.25;
            }

            .config-action svg {
              width: 14px !important;
              height: 14px !important;
              padding: 0 !important;
              border: 0 !important;
              border-radius: 0 !important;
              background: transparent !important;
            }

            .config-card-link:focus-visible {
              outline: 2px solid rgba(56, 189, 248, 0.72);
              outline-offset: 2px;
            }

            .contract-modal-overlay {
              position: fixed;
              inset: 0;
              z-index: 3000;
              display: grid;
              place-items: center;
              padding: 20px;
              background: rgba(2, 6, 23, 0.76);
              backdrop-filter: blur(8px);
            }

            .contract-modal {
              width: min(620px, 100%);
              max-height: 90vh;
              overflow: visible;
              padding: 24px;
              border-radius: 26px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              background: linear-gradient(145deg, #0b0f1c, #0a1426);
              box-shadow: 0 40px 90px rgba(0, 0, 0, 0.58);
            }

            .contract-modal-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 22px;
              padding-bottom: 18px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.09);
            }

            .contract-modal-header span {
              color: #67e8f9;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 0.14em;
            }

            .contract-modal-header h2 { margin: 5px 0 0; font-size: 24px; }
            .contract-modal-header p { margin-top: 5px; color: #94a3b8; font-size: 14px; }
            .contract-modal-header button {
              width: 40px;
              height: 40px;
              flex-shrink: 0;
              border-radius: 13px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              background: rgba(255, 255, 255, 0.05);
              color: #e2e8f0;
              font-size: 24px;
              cursor: pointer;
            }

            .contract-modal-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 20px;
            }

            .metric-card span,
            .config-card span {
              display: block;
              color: #9aa9bd;
              font-size: 12px;
              font-weight: 750;
            }

            .metric-card strong,
            .config-card strong {
              display: block;
              margin-top: 7px;
              color: #ffffff;
              font-size: 25px;
              font-weight: 900;
            }

            .config-card strong {
              font-size: 18px;
              line-height: 1.25;
            }

            .metric-card p,
            .config-card p {
              margin-top: 5px;
              color: #718198;
              font-size: 12px;
              line-height: 1.4;
            }

            .metric-card p {
              margin-top: auto;
            }

            .metric-card > svg,
            .config-card > svg {
              width: 38px;
              height: 38px;
              padding: 8px;
              border-radius: 12px;
              color: #b6c5d8;
              background: rgba(148, 163, 184, 0.07);
              border: 1px solid rgba(148, 163, 184, 0.13);
              flex-shrink: 0;
            }

            .main-grid {
              display: grid;
              grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
              gap: 16px;
              align-items: start;
            }

            .panel {
              padding: 20px;
            }

            .side-stack {
              display: grid;
              gap: 16px;
            }

            .panel-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 16px;
            }

            .panel-header.compact {
              display: block;
            }

            .panel-header h2 {
              color: #fff;
              font-size: 20px;
              font-weight: 900;
              letter-spacing: -0.02em;
            }

            .count-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 30px;
              height: 28px;
              padding: 0 10px;
              border-radius: 999px;
              color: #cbd5e1;
              background: rgba(148, 163, 184, 0.08);
              border: 1px solid rgba(148, 163, 184, 0.14);
              font-size: 12px;
              font-weight: 900;
            }

            .search-box {
              display: flex;
              align-items: center;
              gap: 10px;
              height: 44px;
              padding: 0 14px;
              border-radius: 12px;
              background: rgba(2, 8, 23, 0.38);
              border: 1px solid rgba(148, 163, 184, 0.14);
              color: #94a3b8;
              margin-bottom: 14px;
              transition: border-color 0.16s ease, background-color 0.16s ease;
            }

            .search-box:focus-within {
              border-color: rgba(56, 189, 248, 0.42);
              background: rgba(6, 15, 30, 0.72);
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
              gap: 8px;
              max-height: 620px;
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
              grid-template-columns: minmax(0, 1fr);
              gap: 12px;
              padding: 15px;
              border-radius: 14px;
              background: rgba(15, 23, 42, 0.32);
              border: 1px solid rgba(148, 163, 184, 0.1);
              transition: border-color 0.16s ease, background-color 0.16s ease;
            }

            .contract-card:hover,
            .contract-card.active {
              border-color: rgba(56, 189, 248, 0.24);
              background: rgba(15, 27, 45, 0.56);
              transform: none;
            }

            .contract-top {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 11px;
            }

            .doc-icon {
              width: 38px;
              height: 38px;
              border-radius: 11px;
              display: grid;
              place-items: center;
              color: #b8c8dd;
              background: rgba(139, 92, 246, 0.08);
              border: 1px solid rgba(139, 92, 246, 0.15);
              flex-shrink: 0;
            }

            .contract-card h3 {
              color: #fff;
              font-size: 16px;
              font-weight: 900;
              line-height: 1.25;
            }

            .contract-top p {
              margin-top: 4px;
              color: #67c9ef;
              font-size: 11px;
              font-weight: 800;
            }

            .contract-info {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 7px 16px;
              margin-bottom: 11px;
            }

            .contract-info span {
              display: flex;
              align-items: center;
              gap: 7px;
              min-width: 0;
              color: #b7c3d3;
              font-size: 12px;
              line-height: 1.35;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .contract-info svg {
              color: #7f93aa;
              flex-shrink: 0;
            }

            .contract-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              flex-wrap: wrap;
              color: #718198;
              font-size: 11px;
              font-weight: 700;
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              min-height: 22px;
              padding: 0 8px;
              border-radius: 999px;
              font-size: 10px;
              font-weight: 800;
              border: 1px solid transparent;
            }

            .status-gerado {
              color: #7dd3fc;
              background: rgba(14, 165, 233, 0.08);
              border-color: rgba(14, 165, 233, 0.18);
            }

            .status-enviado {
              color: #c4b5fd;
              background: rgba(139, 92, 246, 0.09);
              border-color: rgba(139, 92, 246, 0.18);
            }

            .status-assinado {
              color: #37e884;
              background: rgba(52, 211, 153, 0.08);
              border-color: rgba(52, 211, 153, 0.17);
            }

            .status-pendente {
              color: #ffb454;
              background: rgba(245, 158, 11, 0.08);
              border-color: rgba(245, 158, 11, 0.18);
            }

            .status-cancelado {
              color: #fb7185;
              background: rgba(244, 63, 94, 0.08);
              border-color: rgba(244, 63, 94, 0.18);
            }

            .card-actions,
            .quick-actions {
              display: grid;
              gap: 9px;
              align-content: start;
            }

            .card-actions {
              position: relative;
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              padding-top: 11px;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
            }

            .card-actions .icon-action {
              flex: 1 1 132px;
              min-height: 34px;
              padding: 0 10px;
              font-size: 11px;
            }

            .primary-action {
              color: #fff;
              border-color: rgba(56, 189, 248, 0.24);
              background: rgba(14, 165, 233, 0.1);
            }

            .actions-menu {
              position: relative;
            }

            .actions-menu summary {
              width: 42px;
              min-height: 42px;
              display: grid;
              place-items: center;
              list-style: none;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              background: rgba(255, 255, 255, 0.07);
              color: #dbeafe;
              cursor: pointer;
            }

            .actions-menu summary::-webkit-details-marker { display: none; }

            .actions-popover {
              position: absolute;
              z-index: 50;
              top: calc(100% + 7px);
              right: 0;
              width: 210px;
              padding: 7px;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.14);
              background: #0b1424;
              box-shadow: 0 22px 54px rgba(0, 0, 0, 0.5);
            }

            .actions-popover button {
              width: 100%;
              min-height: 38px;
              display: flex;
              align-items: center;
              gap: 9px;
              padding: 0 10px;
              border: 0;
              border-radius: 9px;
              background: transparent;
              color: #dbeafe;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
            }

            .actions-popover button:hover { background: rgba(255, 255, 255, 0.07); }
            .actions-popover button.danger { color: #fb7185; }
            .actions-popover button:disabled { opacity: .38; }

            .btn-primary,
            .btn-secondary,
            .icon-action,
            .btn-success {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 38px;
              border-radius: 10px;
              border: 1px solid transparent;
              color: #fff;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
              text-decoration: none;
              transition: border-color 0.16s ease, background-color 0.16s ease, opacity 0.16s ease;
            }

            .btn-primary:hover,
            .btn-secondary:hover,
            .icon-action:hover,
            .btn-success:hover {
              transform: none;
              opacity: 1;
            }

            .btn-primary {
              width: 100%;
              background: linear-gradient(135deg, #7138d8, #168ecb);
              box-shadow: none;
              padding: 0 16px;
            }

            .header-btn {
              width: auto;
            }

            .btn-secondary,
            .icon-action,
            .btn-success {
              background: rgba(148, 163, 184, 0.045);
              border-color: rgba(148, 163, 184, 0.14);
            }

            .btn-secondary:hover,
            .icon-action:hover,
            .btn-success:hover {
              background: rgba(148, 163, 184, 0.09);
              border-color: rgba(148, 163, 184, 0.24);
            }

            .btn-secondary.small {
              width: auto;
              padding: 0 16px;
            }

            .btn-primary.small {
              width: auto;
              padding: 0 16px;
              min-height: 42px;
            }

            .icon-action {
              color: #dbeafe;
            }

            .icon-action.danger {
              color: #fb7185;
              background: transparent;
              border-color: rgba(244, 63, 94, 0.16);
            }

            .icon-action.success,
            .btn-success {
              color: #37e884;
              background: rgba(52, 211, 153, 0.055);
              border-color: rgba(52, 211, 153, 0.16);
            }

            .btn-primary:focus-visible,
            .btn-secondary:focus-visible,
            .icon-action:focus-visible,
            .btn-success:focus-visible {
              outline: 2px solid rgba(56, 189, 248, 0.72);
              outline-offset: 2px;
            }

            button:disabled {
              cursor: not-allowed;
              opacity: 0.52;
              transform: none !important;
            }

            .field-label {
              display: block;
              margin: 14px 0 7px;
              color: #cbd5e1;
              font-size: 12px;
              font-weight: 800;
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
              margin-top: 12px;
              padding: 12px;
              border-radius: 12px;
              background: rgba(15, 23, 42, 0.42);
              border: 1px solid rgba(148, 163, 184, 0.12);
            }

            .selected-event > span {
              color: #38bdf8;
              font-size: 12px;
              font-weight: 900;
            }

            .selected-event strong {
              display: block;
              margin-top: 3px;
              color: #fff;
              font-size: 14px;
            }

            .selected-status {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 10px;
              margin-top: 10px;
              padding-top: 10px;
              border-top: 1px solid rgba(148, 163, 184, 0.1);
            }

            .selected-status small {
              color: #94a3b8;
              font-size: 12px;
              font-weight: 800;
            }

            .quick-actions {
              margin-top: 12px;
            }

            .snapshot-warning {
              margin-top: 12px;
              padding: 11px 12px;
              border-radius: 12px;
              border: 1px solid rgba(251, 191, 36, .22);
              background: rgba(251, 191, 36, .08);
              color: #fde68a;
              font-size: 12px;
              line-height: 1.5;
            }

            .preview-panel {
              margin-top: 16px;
            }

            .preview-actions {
              display: flex;
              flex-wrap: wrap;
              justify-content: flex-end;
              gap: 8px;
            }

            .preview-editor {
              width: 100%;
              min-height: 720px;
              box-sizing: border-box;
              resize: vertical;
              padding: 20px;
              border-radius: 14px;
              border: 1px solid rgba(56, 189, 248, .22);
              background: rgba(2, 6, 23, 0.62);
              color: #fff;
              font: 15px/1.7 Georgia, "Times New Roman", serif;
              outline: none;
            }

            .preview-editor:focus {
              border-color: rgba(56, 189, 248, .55);
              box-shadow: 0 0 0 4px rgba(56, 189, 248, .09);
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
              min-height: 220px;
              display: grid;
              place-items: center;
              text-align: center;
              padding: 24px;
              border-radius: 14px;
              border: 1px dashed rgba(148, 163, 184, 0.16);
              background: rgba(2, 6, 23, 0.22);
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

              .side-stack { order: 1; }
              .contracts-panel { order: 2; }
            }

            @media (max-width: 720px) {
              .metrics-pair {
                grid-template-columns: 1fr;
              }

              .page-header {
                align-items: flex-start;
              }

              .header-btn {
                width: 100%;
              }

              h1 {
                font-size: 25px;
              }

              .panel,
              .metric-card,
              .config-card {
                border-radius: 16px;
                padding: 16px;
              }

              .contract-card {
                grid-template-columns: 1fr;
              }

              .contract-info {
                grid-template-columns: 1fr;
              }

              .card-actions {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
              }

              .preview-actions { width: 100%; justify-content: stretch; }
              .preview-actions button { flex: 1; }

              .preview-editor {
                min-height: 560px;
                padding: 16px;
                font-size: 14px;
              }
            }

            @media (max-width: 480px) {
              .page-header,
              .panel-header {
                gap: 12px;
              }

              .header-left {
                gap: 12px;
              }

              .header-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
              }

              .page-header p,
              .panel-header p,
              .config-card p,
              .selected-event p {
                font-size: 12px;
              }

              .card-actions,
              .preview-actions {
                grid-template-columns: 1fr;
              }

              .card-actions .icon-action,
              .preview-actions button {
                width: 100%;
                flex-basis: auto;
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


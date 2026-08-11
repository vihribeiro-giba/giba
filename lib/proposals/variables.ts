import type { Proposal, ProposalDraft } from "./types";

export type ProposalVariables = Record<string, unknown>;

function printable(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value);
}

export function replaceProposalVariables(template: string, variables: ProposalVariables, keepMissing = true) {
  let rendered = (template || "").replace(/\{([a-z0-9_]+)\}/gi, (match, key: string) => {
    const value = printable(variables[key]);
    return value || (keepMissing ? match : "");
  });

  const interval = printable(variables.intervalo).trim();
  if (interval && interval.toLocaleLowerCase("pt-BR") !== "sem intervalo") {
    const escapedInterval = escapeRegExp(interval);
    rendered = rendered.replace(
      new RegExp(`(\\b${escapedInterval}\\s+de\\s+intervalo),\\s*tendo\\s+um\\s+intervalo\\s+de\\s+${escapedInterval}`, "gi"),
      "$1",
    );
  }

  return rendered
    .replace(/,\s*com intervalo de\s+Sem intervalo/gi, ", sem intervalo")
    .replace(/\bcom intervalo de\s+Sem intervalo\b/gi, "sem intervalo")
    .replace(/\s+e\s+Sem intervalo\s+de\s+Intervalo/gi, ", sem intervalo")
    .replace(/,\s*tendo\s+um\s+intervalo\s+de\s+Sem intervalo/gi, "");
}

export function findMissingProposalVariables(template: string, variables: ProposalVariables) {
  const missing = new Set<string>();
  for (const match of template.matchAll(/\{([a-z0-9_]+)\}/gi)) {
    if (!printable(variables[match[1]])) missing.add(match[1]);
  }
  return [...missing];
}

export function formatCurrency(value: unknown) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(value: unknown) {
  const raw = printable(value);
  if (!raw) return "";
  const [year, month, day] = raw.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : raw;
}

function durationInMinutes(value: unknown) {
  const text = printable(value).toLowerCase();
  const hours = Number(text.match(/(\d+(?:[.,]\d+)?)\s*(?:h|hora)/)?.[1]?.replace(",", ".") || 0);
  const minutes = Number(text.match(/(\d+)\s*(?:min|minuto)/)?.[1] || 0);
  return Math.round(hours * 60 + minutes);
}

export function normalizeIntervalDuration(value: unknown) {
  const text = printable(value).trim();
  if (/^\d+(?:[.,]\d+)?$/.test(text)) return `${text} minutos`;
  return text;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function durationWithoutInterval(duration: unknown, interval: unknown) {
  const durationText = printable(duration).trim();
  const intervalText = normalizeIntervalDuration(interval);
  if (!durationText || !intervalText) return durationText;

  const escapedInterval = escapeRegExp(intervalText);
  return durationText
    .replace(new RegExp(`\\s*(?:,|e)?\\s*${escapedInterval}\\s*(?:de\\s+)?intervalo\\.?$`, "i"), "")
    .replace(new RegExp(`\\s*,?\\s*com\\s+intervalo\\s+de\\s+${escapedInterval}\\.?$`, "i"), "")
    .trim();
}

export function totalDuration(duration: unknown, interval: unknown) {
  const minutes = durationInMinutes(duration) + durationInMinutes(normalizeIntervalDuration(interval));
  if (!minutes) return printable(duration);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return rest + " minutos";
  if (!rest) return hours + (hours === 1 ? " hora" : " horas");
  return hours + (hours === 1 ? " hora e " : " horas e ") + rest + " minutos";
}

const units = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const teens = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const tens = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const hundreds = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function integerWords(value: number): string {
  const number = Math.max(0, Math.floor(value));
  if (!number) return "zero";
  if (number === 100) return "cem";
  if (number < 10) return units[number];
  if (number < 20) return teens[number - 10];
  if (number < 100) return tens[Math.floor(number / 10)] + (number % 10 ? " e " + units[number % 10] : "");
  if (number < 1000) return hundreds[Math.floor(number / 100)] + (number % 100 ? " e " + integerWords(number % 100) : "");
  if (number < 1_000_000) {
    const thousands = Math.floor(number / 1000);
    const rest = number % 1000;
    const separator = rest < 100 || rest % 100 === 0 ? " e " : " ";
    return (thousands === 1 ? "mil" : integerWords(thousands) + " mil") + (rest ? separator + integerWords(rest) : "");
  }
  const millions = Math.floor(number / 1_000_000);
  const rest = number % 1_000_000;
  return integerWords(millions) + (millions === 1 ? " milhão" : " milhões") + (rest ? " e " + integerWords(rest) : "");
}

export function currencyInWords(value: unknown) {
  const amount = Math.max(0, Number(value || 0));
  const integer = Math.floor(amount);
  const cents = Math.round((amount - integer) * 100);
  const reais = integerWords(integer) + (integer === 1 ? " real" : " reais");
  const centavos = cents ? " e " + integerWords(cents) + (cents === 1 ? " centavo" : " centavos") : "";
  return (reais + centavos).replace(/^./, (letter) => letter.toUpperCase());
}

export function getProposalVariables(proposal: Proposal | ProposalDraft): ProposalVariables {
  const company = proposal.company_snapshot;
  const client = proposal.client_snapshot;
  const event = proposal.event_snapshot;
  const format = proposal.format_snapshot;
  const quantity = Math.max(1, Number(format.quantidade_apresentacoes || 1));
  const rawDuration = format.tempo_show || format.duracao_padrao || event.show_duration || "";
  const rawInterval = normalizeIntervalDuration(format.intervalo);
  const intervalDisabled = format._has_interval === false || rawInterval.toLocaleLowerCase("pt-BR") === "sem intervalo";
  const interval = intervalDisabled ? "" : rawInterval;
  const duration = durationWithoutInterval(rawDuration, interval);
  const total = proposal.amount * quantity;
  return {
    numero_proposta: proposal.proposal_number || "",
    titulo_proposta: proposal.title,
    cliente: client.nome,
    nome_cliente: client.nome,
    empresa_cliente: client.nome,
    telefone_cliente: client.celular || client.telefone,
    email_cliente: client.email,
    nome_artista: company.nome_artistico || company.razao_social || company.nome,
    razao_social: company.razao_social,
    cnpj: company.cnpj,
    cpf: company.cpf,
    telefone_comercial: company.telefone,
    email_comercial: company.email,
    instagram: company.instagram,
    endereco_empresa: company.endereco_completo,
    nome_formato: format.nome,
    formato_show: format.nome,
    descricao_formato: format.descricao,
    duracao: duration,
    tempo_show: duration,
    intervalo: interval || "Sem intervalo",
    descricao_intervalo: interval ? `, com intervalo de ${interval}` : ", sem intervalo",
    duracao_total: totalDuration(duration, interval),
    repertorio: format.repertorio,
    formacao: format.formacao,
    estrutura_incluida: format.estrutura_incluida,
    estrutura_nao_incluida: format.estrutura_nao_incluida,
    data_evento: formatDate(event.event_date) || "Não informado",
    horario_evento: event.event_time,
    local_evento: event.local_evento || event.location || "Não informado",
    cidade_evento: event.city,
    valor: formatCurrency(proposal.amount),
    valor_proposta: formatCurrency(proposal.amount),
    valor_extenso: currencyInWords(proposal.amount),
    quantidade_apresentacoes: quantity,
    valor_total: formatCurrency(total),
    valor_total_extenso: currencyInWords(total),
    sinal: "",
    saldo: "",
    forma_pagamento: proposal.payment_terms || event.payment_format,
    data_emissao: formatDate(proposal.issue_date),
    validade: formatDate(proposal.expiration_date),
    data_validade: formatDate(proposal.expiration_date),
  };
}

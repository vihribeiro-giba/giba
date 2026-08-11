import type { ProposalCompany, ProposalSnapshot } from "./types";

const STATE_CODES: Record<string, string> = {
  acre: "AC",
  alagoas: "AL",
  amapá: "AP",
  amazonas: "AM",
  bahia: "BA",
  ceará: "CE",
  "distrito federal": "DF",
  "espírito santo": "ES",
  goiás: "GO",
  maranhão: "MA",
  "mato grosso": "MT",
  "mato grosso do sul": "MS",
  "minas gerais": "MG",
  pará: "PA",
  paraíba: "PB",
  paraná: "PR",
  pernambuco: "PE",
  piauí: "PI",
  "rio de janeiro": "RJ",
  "rio grande do norte": "RN",
  "rio grande do sul": "RS",
  rondônia: "RO",
  roraima: "RR",
  "santa catarina": "SC",
  "são paulo": "SP",
  sergipe: "SE",
  tocantins: "TO",
};

function clean(value: unknown) {
  const text = String(value ?? "").trim();
  return text === "undefined" || text === "null" ? "" : text;
}

export function stateAbbreviation(value: unknown) {
  const state = clean(value);
  if (!state) return "";
  if (state.length === 2) return state.toUpperCase();
  return STATE_CODES[state.toLocaleLowerCase("pt-BR")] || state;
}

export function formatCompanyAddress(company: ProposalCompany | ProposalSnapshot) {
  const completeAddress = clean(company.endereco_completo);
  const street = clean(company.endereco);
  const number = clean(company.numero);
  const district = clean(company.bairro);
  const city = clean(company.cidade);
  const state = stateAbbreviation(company.estado);
  const zipCode = clean(company.cep);

  const streetLine = completeAddress || [street, number, district].filter(Boolean).join(", ");
  const normalizedStreet = streetLine.toLocaleLowerCase("pt-BR");
  const cityForLine = city && !normalizedStreet.includes(city.toLocaleLowerCase("pt-BR")) ? city : "";
  const stateForLine = state && !normalizedStreet.includes(state.toLocaleLowerCase("pt-BR")) ? state : "";
  const zipForLine = zipCode && !normalizedStreet.includes(zipCode.toLocaleLowerCase("pt-BR")) ? "CEP " + zipCode : "";
  const cityState = [cityForLine, stateForLine].filter(Boolean).join(", ");
  const cityLine = [cityState, zipForLine].filter(Boolean).join(" - ");

  return {
    streetLine,
    cityLine,
    oneLine: [streetLine, cityLine].filter(Boolean).join(" - "),
  };
}

import type { ProposalContentSection, ProposalDraft, ProposalTemplateType } from "./types";
import { proposalCreationDates } from "./dates";

export const DEFAULT_PROPOSAL_CONTENT: ProposalContentSection[] = [
  {
    id: "services",
    title: "1 - SERVIÇOS",
    content: "{nome_artista}\n\nFormato de Show: {formato_show}\n\nO show possui duração de {tempo_show}{descricao_intervalo}, totalizando {duracao_total}.\n\nO repertório é composto por uma multiplicidade de estilos, trazendo músicas para diferentes públicos, incluindo MPB, sertanejo, forró, pagode, axé e outros.\n\nLevamos todo o sistema de som necessário para a realização do show.",
    visible: true,
  },
  {
    id: "investment",
    title: "2 - INVESTIMENTO",
    content: "O CONTRATADO receberá o valor global de {valor_proposta} ({valor_extenso}) por apresentação.\n\nQuantidade de apresentações: {quantidade_apresentacoes}\nValor total: {valor_total} ({valor_total_extenso}).",
    visible: true,
  },
  {
    id: "payment",
    title: "3 - PRAZO DE PAGAMENTO",
    content: "Sobre o pagamento, pedimos um sinal de 50% para a confirmação da data e o restante do valor para o dia do evento. Também aceitamos o pagamento em cartão de crédito, com possibilidade de parcelamento, sendo as taxas da operação de responsabilidade do contratante.\n\nPara pessoas jurídicas, as condições deverão ser acordadas durante a negociação.",
    visible: true,
  },
  {
    id: "closing",
    title: "",
    content: "Após a aprovação da proposta, será emitido um contrato de prestação de serviços.",
    visible: true,
  },
];

export function createEmptyProposalDraft(templateType: ProposalTemplateType = "classico"): ProposalDraft {
  const dates = proposalCreationDates();

  return {
    template_id: null,
    client_id: null,
    event_id: null,
    format_id: null,
    title: "Proposta Comercial",
    status: "rascunho",
    issue_date: dates.issueDate,
    expiration_date: dates.expirationDate,
    amount: 0,
    payment_terms: "",
    content: DEFAULT_PROPOSAL_CONTENT.map((section) => ({ ...section })),
    visual_config: {
      templateType,
      coverBackgroundPath: "",
      contentBackgroundPath: "",
      mainPhotoPath: "",
      logoPath: "",
      signaturePath: "",
      primaryColor: "#7c3aed",
      secondaryColor: "#0ea5e9",
      textColor: "#ffffff",
      watermark: templateType === "fotografico",
      companyFields: ["nome_artistico", "razao_social", "cnpj", "cpf", "telefone", "email", "instagram", "endereco_completo"],
    },
    company_snapshot: {},
    client_snapshot: {},
    event_snapshot: {},
    format_snapshot: {},
    generated_pdf_path: null,
    generated_cover_path: null,
  };
}

export const BUILT_IN_TEMPLATES = [
  { type: "classico" as const, name: "Modelo Clássico", description: "Capa elegante e páginas internas discretas." },
  { type: "fotografico" as const, name: "Modelo Fotográfico", description: "Fotografia em destaque, logo sobre a capa e marca-d’água." },
];

import { createEmptyProposalDraft, DEFAULT_PROPOSAL_CONTENT } from "./defaults";
import type {
  ProposalCompany,
  ProposalContentSection,
  ProposalDraft,
  ProposalTemplate,
  ProposalTemplateLayoutConfig,
} from "./types";

export const DEFAULT_DOCUMENT_TITLE = "PROPOSTA COMERCIAL PARA VENDA DE SHOWS";

export const PROPOSAL_TEMPLATE_VARIABLES = [
  "{titulo_proposta}",
  "{nome_cliente}",
  "{nome_artista}",
  "{formato_show}",
  "{tempo_show}",
  "{intervalo}",
  "{descricao_intervalo}",
  "{duracao_total}",
  "{valor_proposta}",
  "{valor_extenso}",
  "{quantidade_apresentacoes}",
  "{valor_total}",
  "{valor_total_extenso}",
  "{data_evento}",
  "{local_evento}",
  "{data_emissao}",
  "{data_validade}",
] as const;

export function normalizeTemplateLayout(value: ProposalTemplate["layout_config"] | undefined): ProposalTemplateLayoutConfig {
  const raw = (value || {}) as Partial<ProposalTemplateLayoutConfig>;
  return {
    documentTitle: raw.documentTitle || DEFAULT_DOCUMENT_TITLE,
    responsibleName: raw.responsibleName || "",
    signatureRole: raw.signatureRole || "",
    formatId: raw.formatId || "",
    formatName: raw.formatName || "",
    defaultDuration: raw.defaultDuration || "",
    suggestedValue: Number(raw.suggestedValue || 0),
    company: (raw.company || {}) as ProposalCompany,
  };
}

export function normalizeTemplateContent(content: ProposalContentSection[] | undefined) {
  if (!content?.length) return DEFAULT_PROPOSAL_CONTENT.map((section) => ({ ...section }));
  return content.map((section) => ({ ...section }));
}

export function applyTemplateToDraft(current: ProposalDraft, template: ProposalTemplate): ProposalDraft {
  const layout = normalizeTemplateLayout(template.layout_config);
  return {
    ...current,
    template_id: template.id,
    format_id: layout.formatId || null,
    format_snapshot: {
      nome: layout.formatName,
      tempo_show: layout.defaultDuration,
      duracao_padrao: layout.defaultDuration,
      intervalo: "",
      _has_interval: false,
      quantidade_apresentacoes: 1,
    },
    amount: layout.suggestedValue,
    content: normalizeTemplateContent(template.default_content),
    company_snapshot: {
      ...layout.company,
      _document_title: layout.documentTitle,
      _responsible_name: layout.responsibleName,
      _signature_role: layout.signatureRole,
    },
    visual_config: {
      ...current.visual_config,
      templateType: template.template_type,
      coverBackgroundPath: template.cover_background_path,
      contentBackgroundPath: template.content_background_path,
      mainPhotoPath: template.default_photo_path,
      logoPath: template.logo_path,
      signaturePath: template.signature_path,
      primaryColor: template.primary_color,
      secondaryColor: template.secondary_color,
      textColor: template.text_color,
    },
  };
}

export function templatePreviewDraft(
  template: Pick<
    ProposalTemplate,
    | "id"
    | "template_type"
    | "cover_background_path"
    | "content_background_path"
    | "default_photo_path"
    | "logo_path"
    | "signature_path"
    | "primary_color"
    | "secondary_color"
    | "text_color"
    | "default_content"
    | "layout_config"
  >,
) {
  const base = createEmptyProposalDraft(template.template_type);
  const draft = applyTemplateToDraft(base, template as ProposalTemplate);
  return {
    ...draft,
    title: "Proposta Comercial",
    amount: draft.amount || 1200,
    client_snapshot: { nome: "Cliente de exemplo" },
    format_snapshot: {
      ...draft.format_snapshot,
      nome: draft.format_snapshot.nome || "Voz e Violão",
      tempo_show: draft.format_snapshot.tempo_show || "2 horas e 30 minutos",
      intervalo: "30 minutos",
      quantidade_apresentacoes: 1,
    },
    event_snapshot: {
      event_date: base.issue_date,
      local_evento: "Local do evento",
    },
  };
}

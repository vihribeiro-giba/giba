export type ProposalStatus =
  | "rascunho"
  | "enviada"
  | "em_negociacao"
  | "aprovada"
  | "recusada"
  | "expirada";

export type ProposalTemplateType = "classico" | "fotografico";

export type ProposalContentSection = {
  id: string;
  title: string;
  content: string;
  visible: boolean;
};

export type ProposalVisualConfig = {
  templateType: ProposalTemplateType;
  coverBackgroundPath: string;
  contentBackgroundPath: string;
  mainPhotoPath: string;
  logoPath: string;
  signaturePath: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  watermark: boolean;
  companyFields: string[];
};

export type ProposalSnapshot = Record<string, unknown>;

export type ProposalTemplateLayoutConfig = {
  documentTitle: string;
  responsibleName: string;
  signatureRole: string;
  formatId: string;
  formatName: string;
  defaultDuration: string;
  suggestedValue: number;
  company: ProposalCompany;
};

export type Proposal = {
  id: string;
  user_id: string;
  template_id: string | null;
  client_id: string | null;
  event_id: string | null;
  format_id: string | null;
  proposal_number: string;
  title: string;
  status: ProposalStatus;
  issue_date: string;
  expiration_date: string;
  amount: number;
  payment_terms: string;
  content: ProposalContentSection[];
  visual_config: ProposalVisualConfig;
  company_snapshot: ProposalSnapshot;
  client_snapshot: ProposalSnapshot;
  event_snapshot: ProposalSnapshot;
  format_snapshot: ProposalSnapshot;
  generated_pdf_path: string | null;
  generated_cover_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalTemplate = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  template_type: ProposalTemplateType;
  is_default: boolean;
  cover_background_path: string;
  content_background_path: string;
  default_photo_path: string;
  logo_path: string;
  signature_path: string;
  primary_color: string;
  secondary_color: string;
  text_color: string;
  layout_config: ProposalTemplateLayoutConfig | Record<string, unknown>;
  default_content: ProposalContentSection[];
  created_at: string;
  updated_at: string;
};

export type ProposalClient = {
  id: string;
  nome: string;
  cpf_cnpj?: string | null;
  celular?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco_completo?: string | null;
};

export type ProposalEvent = {
  id: string;
  title?: string | null;
  client_name?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  location?: string | null;
  city?: string | null;
  show_format?: string | null;
  show_duration?: string | null;
  fee?: number | string | null;
  payment_format?: string | null;
};

export type ProposalFormat = {
  id: string;
  nome: string;
  descricao?: string | null;
  duracao_padrao?: string | null;
  formacao?: string | null;
  repertorio?: string | null;
  estrutura_incluida?: string | null;
  estrutura_nao_incluida?: string | null;
  observacoes?: string | null;
  intervalo?: string | null;
  valor_sugerido?: number | string | null;
};

export type ProposalCompany = {
  nome?: string | null;
  responsavel?: string | null;
  nome_artistico?: string | null;
  razao_social?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  instagram?: string | null;
  endereco_completo?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  logo_url?: string | null;
  signature_url?: string | null;
};

export type ProposalDraft = Omit<
  Proposal,
  "id" | "user_id" | "proposal_number" | "created_at" | "updated_at"
> & { id?: string; proposal_number?: string };

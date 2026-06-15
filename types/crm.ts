export type Municipio = {
  id: string;
  user_id: string;
  nome: string;
  estado: string | null;
  habitantes: number | null;
  distancia_bh: number | null;
  prefeito: string | null;
  email_prefeito: string | null;
  secretario_cultura: string | null;
  email_cultura: string | null;
  telefone_whatsapp: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type MunicipioEvento = {
  id: string;
  user_id: string;
  municipio_id: string;
  nome_evento: string;
  data_evento: string | null;
  modelo_contratacao: string | null;
  prioridade: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmOportunidade = {
  id: string;
  user_id: string;
  municipio_id: string;
  evento_id: string | null;
  status: string;
  valor_proposto: number | null;
  data_contato: string | null;
  proximo_contato: string | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type CrmInteracao = {
  id: string;
  user_id: string;
  oportunidade_id: string;
  tipo: string;
  descricao: string | null;
  data_interacao: string;
  created_at: string;
};
export type Colaborador = {
  id: string;
  user_id?: string;
  nome: string;
  funcao: string;
  celular: string;
  email: string;
  senha?: string;
  status: string;
  photo_url?: string | null;
  pix_key?: string | null;
  pix_type?: string | null;
  instagram?: string | null;
  pix_favorecido?: string | null;
  observacoes?: string | null;
  created_at?: string;
};

export type FiltroStatus = "todos" | "ativos" | "inativos" | "sem-acesso";

export type PixTipo = "CPF" | "Telefone" | "E-mail" | "Chave Aleatória";

import type { AccessModuleKey, AccessProfileKey } from "../../lib/access-modules";

export type Colaborador = {
  id: string;
  user_id?: string;
  nome: string;
  funcao: string;
  celular: string;
  email: string;
  contact_email?: string | null;
  senha?: string;
  auth_user_id?: string | null;
  allowed_modules?: AccessModuleKey[] | null;
  access_profile?: AccessProfileKey | null;
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

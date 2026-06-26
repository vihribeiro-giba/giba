import type { ReactNode } from "react";

export type EventoRelatorio = {
  id: string;
  fee: number | string | null;
  event_date: string;
  event_time?: string | null;
  event_type?: string | null;
  show_format: string;
  show_duration?: string | null;
  client_name: string;
  location?: string | null;
  status?: string | null;
  user_id?: string;
};

export type FinanceiroRelatorio = {
  id: string;
  type: string;
  category?: string | null;
  amount: number | string | null;
  payment_date: string;
  payment_method?: string | null;
  client_name?: string | null;
  description?: string | null;
  user_id?: string;
};

export type ClienteRelatorio = {
  id: string;
  name?: string | null;
  full_name?: string | null;
  user_id?: string;
};

export type FiltrosRelatorioState = {
  periodo: "hoje" | "7dias" | "30dias" | "90dias" | "ano" | "personalizado";
  dataInicial: string;
  dataFinal: string;
  evento: string;
  cliente: string;
  formato: string;
  cidade: string;
  tipoEvento: string;
  status: string;
};

export type ResumoCardData = {
  titulo: string;
  valor: string;
  detalhe: string;
  comparacao: string;
  cor: string;
  icon: ReactNode;
};

export type ChartItem = {
  label: string;
  valor: number;
  detalhe?: string;
  cor?: string;
};

export type MensalItem = {
  mes: string;
  entradas: number;
  saidas: number;
  lucro: number;
};

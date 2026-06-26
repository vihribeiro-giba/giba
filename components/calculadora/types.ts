import type { Dispatch, SetStateAction } from "react";

export type ItemCalculadora = {
  id: number;
  campo1: string;
  campo2: string;
  valor: string;
};

export type ColaboradorCalculadora = {
  id: string;
  nome: string;
  role?: string;
};

export type OrcamentoSalvoCalculadora = {
  id: string;
  nome: string;
  created_at?: string;
  criadoEm?: string;
};

export type AtualizarItemFn = (
  lista: ItemCalculadora[],
  setLista: Dispatch<SetStateAction<ItemCalculadora[]>>,
  id: number,
  campo: keyof ItemCalculadora,
  valor: string
) => void;

export type AdicionarItemFn = (
  lista: ItemCalculadora[],
  setLista: Dispatch<SetStateAction<ItemCalculadora[]>>
) => void;

export type RemoverItemFn = (
  lista: ItemCalculadora[],
  setLista: Dispatch<SetStateAction<ItemCalculadora[]>>,
  id: number
) => void;

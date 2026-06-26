"use client";

import type { Dispatch, SetStateAction } from "react";
import { Route } from "lucide-react";
import ItensCard from "./ItensCard";
import SectionShell from "./SectionShell";
import type { AdicionarItemFn, AtualizarItemFn, ItemCalculadora, RemoverItemFn } from "./types";

export default function CustosOperacionais({
  itens,
  setItens,
  atualizarItem,
  adicionarItem,
  removerItem,
  total,
}: {
  itens: ItemCalculadora[];
  setItens: Dispatch<SetStateAction<ItemCalculadora[]>>;
  atualizarItem: AtualizarItemFn;
  adicionarItem: AdicionarItemFn;
  removerItem: RemoverItemFn;
  total: string;
}) {
  return (
    <SectionShell title="Custos Operacionais" subtitle="Transporte, hospedagem, alimentação e logística." icon={<Route size={18} />} total={total}>
      <ItensCard label1="Tipo" label2="Prestador" itens={itens} setItens={setItens} atualizarItem={atualizarItem} adicionarItem={adicionarItem} removerItem={removerItem} />
    </SectionShell>
  );
}

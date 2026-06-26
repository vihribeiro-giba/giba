"use client";

import type { Dispatch, SetStateAction } from "react";
import { Megaphone } from "lucide-react";
import ItensCard from "./ItensCard";
import SectionShell from "./SectionShell";
import type { AdicionarItemFn, AtualizarItemFn, ItemCalculadora, RemoverItemFn } from "./types";

export default function TaxasMarketingCard({
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
    <SectionShell title="Comissões e Taxas" subtitle="Marketing, distribuição, redes sociais e custos administrativos." icon={<Megaphone size={18} />} total={total}>
      <ItensCard label1="Descrição" label2="Prestador" itens={itens} setItens={setItens} atualizarItem={atualizarItem} adicionarItem={adicionarItem} removerItem={removerItem} />
    </SectionShell>
  );
}

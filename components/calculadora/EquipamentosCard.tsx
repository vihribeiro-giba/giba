"use client";

import type { Dispatch, SetStateAction } from "react";
import { Speaker } from "lucide-react";
import ItensCard from "./ItensCard";
import SectionShell from "./SectionShell";
import type { AdicionarItemFn, AtualizarItemFn, ItemCalculadora, RemoverItemFn } from "./types";

export default function EquipamentosCard({
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
    <SectionShell title="Equipamentos" subtitle="Som, luz, LED, gerador, backline, fogos e efeitos." icon={<Speaker size={18} />} total={total}>
      <ItensCard label1="Descrição" label2="Prestador" itens={itens} setItens={setItens} atualizarItem={atualizarItem} adicionarItem={adicionarItem} removerItem={removerItem} />
    </SectionShell>
  );
}

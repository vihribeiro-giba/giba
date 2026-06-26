"use client";

import type { Dispatch, SetStateAction } from "react";
import { Users } from "lucide-react";
import ItensCard from "./ItensCard";
import SectionShell from "./SectionShell";
import type { AdicionarItemFn, AtualizarItemFn, ColaboradorCalculadora, ItemCalculadora, RemoverItemFn } from "./types";

export default function EquipeCard({
  itens,
  setItens,
  colaboradores,
  atualizarItem,
  adicionarItem,
  removerItem,
  total,
}: {
  itens: ItemCalculadora[];
  setItens: Dispatch<SetStateAction<ItemCalculadora[]>>;
  colaboradores: ColaboradorCalculadora[];
  atualizarItem: AtualizarItemFn;
  adicionarItem: AdicionarItemFn;
  removerItem: RemoverItemFn;
  total: string;
}) {
  return (
    <SectionShell title="Equipe" subtitle="Músicos, dançarinos, equipe técnica e roadies." icon={<Users size={18} />} total={total}>
      <ItensCard
        label1="Função"
        label2="Nome"
        colaboradores={colaboradores}
        itens={itens}
        setItens={setItens}
        atualizarItem={atualizarItem}
        adicionarItem={adicionarItem}
        removerItem={removerItem}
        usaColaboradores
      />
    </SectionShell>
  );
}

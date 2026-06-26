"use client";

import { TrendingUp } from "lucide-react";
import { TextInput, ValuePill } from "./Fields";
import SectionShell from "./SectionShell";

export default function LucroCard({
  cacheArtista,
  setCacheArtista,
  lucroLiquido,
  margem,
}: {
  cacheArtista: string;
  setCacheArtista: (valor: string) => void;
  lucroLiquido: string;
  margem: string;
}) {
  return (
    <SectionShell title="Lucro" subtitle="Resultado líquido e margem da simulação." icon={<TrendingUp size={18} />}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <TextInput label="Cachê do artista" value={cacheArtista} onChange={setCacheArtista} placeholder="Ex: 7000" />
        <ValuePill label="Lucro líquido" value={lucroLiquido} />
        <ValuePill label="Margem" value={margem} />
      </div>
    </SectionShell>
  );
}

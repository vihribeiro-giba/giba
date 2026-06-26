"use client";

import { Percent } from "lucide-react";
import { TextInput, ValuePill } from "./Fields";
import SectionShell from "./SectionShell";

export default function ImpostosCard({
  valorBase,
  percentualImposto,
  setPercentualImposto,
  impostoCalculado,
}: {
  valorBase: string;
  percentualImposto: string;
  setPercentualImposto: (valor: string) => void;
  impostoCalculado: string;
}) {
  return (
    <SectionShell title="Impostos e Taxas" subtitle="Imposto calculado sobre o preço de venda informado no início." icon={<Percent size={18} />} total={impostoCalculado}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ValuePill label="Base do cálculo" value={valorBase} />
        <TextInput label="% imposto pago" value={percentualImposto} onChange={setPercentualImposto} placeholder="Ex: 6" />
        <ValuePill label="Imposto calculado" value={impostoCalculado} />
      </div>
    </SectionShell>
  );
}

"use client";

import DataTable from "./DataTable";
import SectionCard from "./SectionCard";
import type { ChartItem } from "./types";

export default function FormatosCharts({
  quantidade,
  faturamento,
  formatarMoeda,
}: {
  quantidade: ChartItem[];
  faturamento: ChartItem[];
  formatarMoeda: (valor: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
      <SectionCard title="Quantidade por formato">
        <DataTable items={quantidade} valueLabel="Eventos" />
      </SectionCard>
      <SectionCard title="Faturamento por formato">
        <DataTable items={faturamento} valueLabel="Faturamento" formatValue={formatarMoeda} />
      </SectionCard>
    </div>
  );
}

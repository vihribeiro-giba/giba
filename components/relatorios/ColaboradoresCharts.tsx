"use client";

import DataTable from "./DataTable";
import SectionCard from "./SectionCard";
import type { ChartItem } from "./types";

export default function ColaboradoresCharts({
  ranking,
  pagamentos,
  formatarMoeda,
}: {
  ranking: ChartItem[];
  pagamentos: ChartItem[];
  formatarMoeda: (valor: number) => string;
}) {
  return (
    <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
      <SectionCard title="Participações por colaborador">
        <DataTable items={ranking} valueLabel="Shows" />
      </SectionCard>
      <SectionCard title="Total recebido">
        <DataTable items={pagamentos} valueLabel="Recebido" formatValue={formatarMoeda} />
      </SectionCard>
    </div>
  );
}

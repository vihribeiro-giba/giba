"use client";

import DataTable from "./DataTable";
import SectionCard from "./SectionCard";
import type { ChartItem } from "./types";

export default function EventosCharts({
  cidades,
  formatos,
  eventosMes,
}: {
  cidades: ChartItem[];
  formatos: ChartItem[];
  eventosMes: ChartItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-3">
      <SectionCard title="Cidades mais visitadas">
        <DataTable items={cidades} valueLabel="Eventos" />
      </SectionCard>

      <SectionCard title="Eventos por Formato">
        <DataTable items={formatos} valueLabel="Eventos" />
      </SectionCard>

      <SectionCard title="Eventos por mês">
        <DataTable items={eventosMes} valueLabel="Eventos" />
      </SectionCard>
    </div>
  );
}

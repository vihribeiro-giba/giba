"use client";

import DataTable from "./DataTable";
import SectionCard from "./SectionCard";
import type { ChartItem } from "./types";

export default function ClientesCharts({
  novos,
  recorrentes,
  origem,
  topClientes,
  inativos,
}: {
  novos: number;
  recorrentes: number;
  origem: ChartItem[];
  topClientes: ChartItem[];
  inativos: ChartItem[];
}) {
  return (
    <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-3">
      <SectionCard title="Resumo de Clientes" subtitle="Base ativa e recorrência no período.">
        <DataTable
          items={[
            { label: "Clientes novos", valor: novos },
            { label: "Clientes recorrentes", valor: recorrentes },
          ]}
          valueLabel="Total"
        />
      </SectionCard>

      <SectionCard title="Origem dos Clientes">
        <DataTable items={origem} valueLabel="Clientes" />
      </SectionCard>

      <SectionCard title="Top 10 Clientes">
        <DataTable items={topClientes} valueLabel="Eventos" />
      </SectionCard>

      <SectionCard title="Clientes sem Contratar Há Mais Tempo">
        <DataTable items={inativos} valueLabel="Dias" />
      </SectionCard>
    </div>
  );
}

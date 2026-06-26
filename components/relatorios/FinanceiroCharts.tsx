"use client";

import DataTable from "./DataTable";
import SectionCard from "./SectionCard";
import type { ChartItem, MensalItem } from "./types";

export default function FinanceiroCharts({
  fluxo,
  receitasCategoria,
  despesasCategoria,
  receitasPagamento,
  formatarMoeda,
}: {
  fluxo: MensalItem[];
  receitasCategoria: ChartItem[];
  despesasCategoria: ChartItem[];
  receitasPagamento: ChartItem[];
  formatarMoeda: (valor: number) => string;
}) {
  const fluxoItems = fluxo.map((item) => ({
    label: item.mes,
    valor: item.lucro,
    detalhe: `Entradas ${formatarMoeda(item.entradas)} | Saídas ${formatarMoeda(item.saidas)}`,
  }));

  return (
    <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
      <SectionCard title="Fluxo de Caixa" subtitle="Entradas, saídas e resultado por mês.">
        <DataTable items={fluxoItems} valueLabel="Lucro" formatValue={formatarMoeda} />
      </SectionCard>

      <SectionCard title="Receitas por Categoria">
        <DataTable items={receitasCategoria} valueLabel="Receita" formatValue={formatarMoeda} />
      </SectionCard>

      <SectionCard title="Despesas por Categoria">
        <DataTable items={despesasCategoria} valueLabel="Despesa" formatValue={formatarMoeda} />
      </SectionCard>

      <SectionCard title="Receitas por Forma de Pagamento">
        <DataTable items={receitasPagamento} valueLabel="Receita" formatValue={formatarMoeda} />
      </SectionCard>
    </div>
  );
}

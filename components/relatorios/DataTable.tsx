"use client";

import type { ChartItem } from "./types";

export default function DataTable({
  items,
  valueLabel = "Total",
  formatValue,
  emptyText = "Nenhum dado encontrado.",
}: {
  items: ChartItem[];
  valueLabel?: string;
  formatValue?: (value: number) => string;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-950/25">
      <table className="w-full table-fixed border-collapse text-left">
        <thead>
          <tr className="border-b border-white/[0.08] text-xs uppercase text-slate-500">
            <th className="px-4 py-3 font-black">Descrição</th>
            <th className="w-[34%] px-4 py-3 text-right font-black">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={`${item.label}-${index}`} className="border-b border-white/[0.06] last:border-b-0">
              <td className="px-4 py-3 align-top">
                <span className="block truncate text-sm font-bold text-slate-100">{item.label}</span>
                {item.detalhe && <span className="mt-1 block text-xs font-semibold text-slate-500">{item.detalhe}</span>}
              </td>
              <td className="px-4 py-3 text-right align-top text-sm font-black text-white">
                {formatValue ? formatValue(item.valor) : item.valor}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

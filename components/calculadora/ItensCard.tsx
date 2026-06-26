"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  AdicionarItemFn,
  AtualizarItemFn,
  ColaboradorCalculadora,
  ItemCalculadora,
  RemoverItemFn,
} from "./types";

export default function ItensCard({
  label1,
  label2,
  colaboradores,
  itens,
  setItens,
  atualizarItem,
  adicionarItem,
  removerItem,
  usaColaboradores = false,
}: {
  label1: string;
  label2: string;
  colaboradores?: ColaboradorCalculadora[];
  itens: ItemCalculadora[];
  setItens: Dispatch<SetStateAction<ItemCalculadora[]>>;
  atualizarItem: AtualizarItemFn;
  adicionarItem: AdicionarItemFn;
  removerItem: RemoverItemFn;
  usaColaboradores?: boolean;
}) {
  return (
    <div className="grid gap-3">
      {itens.map((item) => (
        <div key={item.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-white/[0.08] bg-slate-950/25 p-3 lg:grid-cols-[1fr_1fr_150px_44px]">
          <input
            value={item.campo1}
            onChange={(event) => atualizarItem(itens, setItens, item.id, "campo1", event.target.value)}
            placeholder={label1}
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
          />

          {usaColaboradores ? (
            <select
              value={item.campo2}
              onChange={(event) => atualizarItem(itens, setItens, item.id, "campo2", event.target.value)}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none focus:border-sky-400/60"
            >
              <option value="">Selecione o colaborador</option>
              {(colaboradores || []).map((colaborador) => (
                <option key={colaborador.id} value={colaborador.nome} className="bg-slate-950 text-white">
                  {colaborador.nome}
                  {colaborador.role ? ` - ${colaborador.role}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={item.campo2}
              onChange={(event) => atualizarItem(itens, setItens, item.id, "campo2", event.target.value)}
              placeholder={label2}
              className="h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
            />
          )}

          <input
            value={item.valor}
            onChange={(event) => atualizarItem(itens, setItens, item.id, "valor", event.target.value)}
            placeholder="Valor"
            className="h-11 rounded-2xl border border-white/10 bg-slate-950/45 px-3 text-sm font-semibold text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
          />

          <button
            type="button"
            onClick={() => removerItem(itens, setItens, item.id)}
            className="grid h-11 w-full place-items-center rounded-2xl border border-rose-400/25 bg-rose-500/15 text-rose-200 transition hover:-translate-y-0.5 lg:w-11"
            title="Remover"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => adicionarItem(itens, setItens)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 sm:w-fit"
      >
        <Plus size={16} />
        Adicionar
      </button>
    </div>
  );
}

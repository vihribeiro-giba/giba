import { Landmark, Plus, Trash2, Upload } from "lucide-react";

type CrmHeaderProps = {
  deleting: boolean;
  onCreate: () => void;
  onImport: () => void;
  onDeleteAll: () => void;
};

export default function CrmHeader({
  deleting,
  onCreate,
  onImport,
  onDeleteAll,
}: CrmHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500 text-white shadow-[0_14px_30px_rgba(139,53,255,0.26)]">
          <Landmark size={24} />
        </div>
        <div>
          <h1 className="text-[28px] font-black tracking-[-0.5px] text-white">CRM</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Organize relacionamentos, eventos e oportunidades em uma visão única.
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5 sm:flex-row lg:w-auto">
          <button
            type="button"
            onClick={onImport}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.05] px-4 text-sm font-black text-slate-200 transition hover:border-sky-400/25 hover:bg-white/[0.08]"
          >
            <Upload size={17} />
            Importar planilha
          </button>

          <button
            type="button"
            onClick={onDeleteAll}
            disabled={deleting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-rose-400/20 bg-rose-500/[0.08] px-4 text-sm font-black text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 size={17} />
            <span>{deleting ? "Excluindo..." : "Excluir dados"}</span>
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-violet-600 to-sky-500 px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(99,102,241,0.22)] transition hover:brightness-110"
          >
            <Plus size={18} />
            Nova prefeitura
          </button>
      </div>
    </header>
  );
}

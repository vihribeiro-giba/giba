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
    <header className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.055] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between xl:gap-10">
        <div className="flex items-start gap-4 sm:items-center">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400 text-white shadow-[0_14px_30px_rgba(139,53,255,0.30)]">
            <Landmark size={24} />
          </div>
          <div>
            <span className="mb-2 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
              Inteligência comercial
            </span>
            <h1 className="text-[28px] font-black tracking-[-0.5px] text-white">
              CRM de Prefeituras
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Relacionamentos, eventos e oportunidades públicas em uma visão única.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:w-[480px]">
          <button
            type="button"
            onClick={onImport}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-black text-slate-100 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-violet-500/10"
          >
            <Upload size={17} />
            Importar planilha
          </button>

          <button
            type="button"
            onClick={onDeleteAll}
            disabled={deleting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-200 transition hover:-translate-y-0.5 hover:bg-rose-500/20 disabled:cursor-wait disabled:opacity-60"
          >
            <Trash2 size={17} />
            <span>{deleting ? "Excluindo..." : "Excluir dados"}</span>
          </button>

          <button
            type="button"
            onClick={onCreate}
            className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-[0_16px_35px_rgba(59,130,246,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 sm:col-span-2"
          >
            <Plus size={18} />
            Nova prefeitura
          </button>
        </div>
      </div>
    </header>
  );
}

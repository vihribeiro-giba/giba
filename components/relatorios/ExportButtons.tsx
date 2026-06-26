"use client";

import { Download, FileSpreadsheet } from "lucide-react";

export default function ExportButtons({
  onExportPDF,
  onExportExcel,
}: {
  onExportPDF: () => void;
  onExportExcel: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onExportPDF}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-violet-500/35 bg-violet-500/15 px-4 text-sm font-black text-white shadow-[0_16px_32px_rgba(139,53,255,0.18)] transition hover:-translate-y-0.5 hover:opacity-95"
      >
        <Download size={17} />
        Exportar PDF
      </button>

      <button
        type="button"
        onClick={onExportExcel}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[14px] border border-white/10 bg-white/[0.07] px-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:opacity-95"
      >
        <FileSpreadsheet size={17} />
        Exportar Excel
      </button>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createContractPdfDocument } from "../../lib/contracts/pdf";

type Props = {
  text: string;
  title: string;
  clientName: string;
  contractorName: string;
};

export default function ContractDocumentPreview({ text, title, clientName, contractorName }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const document = createContractPdfDocument({ text, title, clientName, contractorName });
      const nextUrl = URL.createObjectURL(document.output("blob"));
      setUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [clientName, contractorName, text, title]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  return url ? (
    <iframe title="Prévia do contrato" src={`${url}#toolbar=0&navpanes=0&view=FitH`} className="h-[720px] w-full rounded-2xl border-0 bg-slate-200 sm:h-[900px]" />
  ) : (
    <div className="grid h-[720px] place-items-center rounded-2xl bg-[#071122] text-sm font-bold text-slate-400 sm:h-[900px]">Preparando prévia...</div>
  );
}

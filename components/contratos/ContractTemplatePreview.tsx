"use client";

import { useEffect, useMemo, useState } from "react";
import { createContractPdfDocument } from "../../lib/contracts/pdf";
import {
  buildContractText,
  type ContractTopic,
} from "../../lib/contracts/template";

const sampleVariables: Record<string, string> = {
  local: "**Espaço Cultural, Belo Horizonte/MG**",
  data_evento: "**20/09/2026**",
  hora_inicio: "**20:00**",
  hora_fim: "**22:30**",
  duracao: "**2 horas e 30 minutos**",
  formato: "**Voz e Violão**",
  valor: "**R$ 1.600,00**",
  valor_extenso: "**Mil e seiscentos reais**",
  pagamento: "**50% de sinal e o restante na data do evento**",
};

const sampleClient = "**João da Silva**, inscrito no CPF/CNPJ sob **000.000.000-00**, residente em **Rua Exemplo, Nº 100, Centro, Belo Horizonte/MG**.";
const sampleContractor = "**EMPRESA ARTÍSTICA LTDA**, de CNPJ **00.000.000/0001-00**, representada por **Responsável Artístico**, CPF **000.000.000-00**, com sede em **Belo Horizonte/MG**.";

type Props = {
  title: string;
  city: string;
  topics: ContractTopic[];
};

export default function ContractTemplatePreview({ title, city, topics }: Props) {
  const [pdfUrl, setPdfUrl] = useState("");
  const previewTitle = title || "Contrato de Prestação de Serviços Artísticos";
  const text = useMemo(
    () =>
      buildContractText({
        title: previewTitle,
        client: sampleClient,
        contractor: sampleContractor,
        topics,
        variables: sampleVariables,
        city: city || "Cidade",
        signatureDate: "10 de agosto de 2026",
      }),
    [city, previewTitle, topics],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const doc = createContractPdfDocument({
        text,
        title: previewTitle,
        clientName: "João da Silva",
        contractorName: "Responsável Artístico",
      });
      const nextUrl = URL.createObjectURL(doc.output("blob"));
      setPdfUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return nextUrl;
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [previewTitle, text]);

  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );

  return (
    <div className="overflow-hidden rounded-[18px] border border-slate-400/[.12] bg-[#071122]/80 p-2.5 sm:p-3">
      {pdfUrl ? (
        <iframe
          title="Pré-visualização A4 do contrato"
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          className="h-[760px] w-full rounded-lg border-0 bg-slate-200 sm:h-[900px]"
        />
      ) : (
        <div className="grid h-[760px] place-items-center text-sm font-bold text-slate-400 sm:h-[900px]">
          Preparando pré-visualização A4...
        </div>
      )}
    </div>
  );
}

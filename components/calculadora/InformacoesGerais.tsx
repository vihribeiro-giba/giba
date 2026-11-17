"use client";

import { MapPin } from "lucide-react";
import ActionsBar from "./ActionsBar";
import { TextInput } from "./Fields";
import SectionShell from "./SectionShell";

export default function InformacoesGerais({
  nomeOrcamento,
  setNomeOrcamento,
  valorShow,
  setValorShow,
  dataFinanceiro,
  setDataFinanceiro,
  onSalvar,
  onExportar,
  onLimpar,
}: {
  nomeOrcamento: string;
  setNomeOrcamento: (valor: string) => void;
  valorShow: string;
  setValorShow: (valor: string) => void;
  dataFinanceiro: string;
  setDataFinanceiro: (valor: string) => void;
  onSalvar: () => void;
  onExportar: () => void;
  onLimpar: () => void;
}) {
  return (
    <SectionShell title="Informações Gerais" subtitle="Dados principais da simulação." icon={<MapPin size={18} />}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-12">
        <div className="sm:col-span-2 md:col-span-6">
          <TextInput
            label="Evento"
            value={nomeOrcamento}
            onChange={setNomeOrcamento}
            placeholder="Ex: Show Prefeitura de Sabará"
          />
        </div>
        <div className="md:col-span-3">
          <TextInput label="Preço de Venda" value={valorShow} onChange={setValorShow} placeholder="Ex: 20000" />
        </div>
        <div className="md:col-span-3">
          <TextInput label="Data do Evento" value={dataFinanceiro} onChange={setDataFinanceiro} type="date" />
        </div>
      </div>

      <div className="mt-4">
        <ActionsBar onSalvar={onSalvar} onExportar={onExportar} onLimpar={onLimpar} />
      </div>
    </SectionShell>
  );
}

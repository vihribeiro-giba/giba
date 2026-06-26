"use client";

import { Clock, MapPin } from "lucide-react";
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextInput
          label="Evento"
          value={nomeOrcamento}
          onChange={setNomeOrcamento}
          placeholder="Ex: Show Prefeitura de Sabará"
        />
        <TextInput label="Preço de venda" value={valorShow} onChange={setValorShow} placeholder="Ex: 20000" />
        <TextInput label="Data dos lançamentos" value={dataFinanceiro} onChange={setDataFinanceiro} type="date" />
        <div className="rounded-2xl border border-white/[0.08] bg-slate-950/25 p-4">
          <div className="mb-2 flex items-center gap-2 text-slate-400">
            <Clock size={16} />
            <span className="text-xs font-black uppercase">Simulação</span>
          </div>
          <p className="text-sm leading-6 text-slate-300">Use os cards abaixo para preencher custos, equipe, equipamentos e taxas.</p>
        </div>
      </div>

      <div className="mt-5">
        <ActionsBar onSalvar={onSalvar} onExportar={onExportar} onLimpar={onLimpar} />
      </div>
    </SectionShell>
  );
}

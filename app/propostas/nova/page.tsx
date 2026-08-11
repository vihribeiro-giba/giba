"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FilePenLine } from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import ProtectedRoute from "../../../components/ProtectedRoute";
import PlanProtectedRoute from "../../../components/PlanProtectedRoute";
import ProposalForm from "../../../components/propostas/ProposalForm";

function NewProposalContent() {
  const params = useSearchParams(); const id = params.get("id") || undefined;
  return <AppLayout><main className="min-h-screen text-white"><header className="mb-6 flex items-center gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-sky-500"><FilePenLine size={24} /></div><div><h1 className="text-[28px] font-black">{id ? "Editar proposta" : "Nova proposta"}</h1><p className="text-sm text-slate-400">Preencha as informações do orçamento e selecione um modelo.</p></div></header><ProposalForm proposalId={id} /></main></AppLayout>;
}
export default function NewProposalPage() { return <ProtectedRoute adminOnly><PlanProtectedRoute modulo="propostas"><Suspense fallback={<div className="p-10 text-white">Carregando...</div>}><NewProposalContent /></Suspense></PlanProtectedRoute></ProtectedRoute>; }

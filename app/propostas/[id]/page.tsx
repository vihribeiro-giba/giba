"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  Download,
  FilePenLine,
  Loader2,
  MessageCircle,
  Trash2,
} from "lucide-react";
import AppLayout from "../../../components/AppLayout";
import GibaSelect from "../../../components/GibaSelect";
import ProtectedRoute from "../../../components/ProtectedRoute";
import PlanProtectedRoute from "../../../components/PlanProtectedRoute";
import ProposalPreview from "../../../components/propostas/ProposalPreview";
import ProposalStatusBadge, {
  PROPOSAL_STATUS_OPTIONS,
} from "../../../components/propostas/ProposalStatusBadge";
import WhatsAppMessageModal from "../../../components/whatsapp/WhatsAppMessageModal";
import { createEmptyProposalDraft } from "../../../lib/proposals/defaults";
import { generateProposalPdf } from "../../../lib/proposals/pdf";
import {
  deleteProposal,
  duplicateProposal,
  getCurrentUser,
  getProposal,
} from "../../../lib/proposals/repository";
import {
  createProposalSignedUrl,
  uploadProposalPdf,
} from "../../../lib/proposals/storage";
import type { Proposal, ProposalStatus } from "../../../lib/proposals/types";
import { formatCurrency, formatDate } from "../../../lib/proposals/variables";
import { supabase } from "../../../lib/supabase";

export default function ProposalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    void load();
  }, [params.id]);

  async function load() {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      const loaded = await getProposal(user.id, params.id);
      setProposal({
        ...loaded,
        visual_config: {
          ...loaded.visual_config,
          companyFields:
            loaded.visual_config.companyFields ||
            createEmptyProposalDraft().visual_config.companyFields,
        },
      });
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar a proposta.");
      router.push("/propostas");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status: ProposalStatus) {
    if (!proposal) return;
    const user = await getCurrentUser();
    const { error } = await supabase
      .from("proposals")
      .update({ status })
      .eq("id", proposal.id)
      .eq("user_id", user.id);
    if (error) return alert(error.message);
    setProposal({ ...proposal, status });
  }

  async function pdf(download = true) {
    if (!proposal) return;
    setBusy(true);
    try {
      const generated = await generateProposalPdf(proposal);
      const user = await getCurrentUser();
      const path = await uploadProposalPdf(
        user.id,
        proposal.id,
        generated.blob,
      );
      const { error } = await supabase
        .from("proposals")
        .update({ generated_pdf_path: path })
        .eq("id", proposal.id)
        .eq("user_id", user.id);
      if (error) throw error;
      setProposal({ ...proposal, generated_pdf_path: path });
      if (download) {
        const url = URL.createObjectURL(generated.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = generated.fileName;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      return path;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao gerar PDF.");
      return "";
    } finally {
      setBusy(false);
    }
  }

  async function whatsapp() {
    if (!proposal) return;
    setBusy(true);
    try {
      const path = proposal.generated_pdf_path || (await pdf(false));
      if (!path) return;
      setLink(await createProposalSignedUrl(path));
      setMessageOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function duplicate() {
    if (!proposal) return;
    setBusy(true);
    try {
      const user = await getCurrentUser();
      const copy = await duplicateProposal(user.id, proposal);
      router.push(`/propostas/${copy.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao duplicar.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!proposal || !confirm(`Excluir a proposta ${proposal.proposal_number}?`))
      return;
    const user = await getCurrentUser();
    await deleteProposal(user.id, proposal.id);
    router.push("/propostas");
  }

  if (loading || !proposal) {
    return (
      <ProtectedRoute adminOnly>
        <div className="grid min-h-screen place-items-center bg-[#050b16] text-white">
          <Loader2 className="animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  const eventName =
    proposal.event_snapshot.title || proposal.event_snapshot.client_name;
  const detail: Array<[string, unknown]> = [
    ["Cliente", proposal.client_snapshot.nome],
    ["Formato", proposal.format_snapshot.nome],
    ...(eventName ? [["Evento", eventName] as [string, unknown]] : []),
    ["Valor", formatCurrency(proposal.amount)],
    ["Emissão", formatDate(proposal.issue_date)],
    ["Validade", formatDate(proposal.expiration_date)],
    ["Criada em", new Date(proposal.created_at).toLocaleString("pt-BR")],
    [
      "Última atualização",
      new Date(proposal.updated_at).toLocaleString("pt-BR"),
    ],
  ];

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="propostas">
        <AppLayout>
          <main className="min-h-screen text-white">
            <Link
              href="/propostas"
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-400"
            >
              <ArrowLeft size={17} />
              Voltar às propostas
            </Link>

            <header className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-black text-cyan-300">
                    {proposal.proposal_number}
                  </span>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
                <h1 className="mt-2 text-[28px] font-black">{proposal.title}</h1>
                <p className="mt-1 text-sm text-slate-400">
                  Detalhes, visualização e ações comerciais da proposta.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/propostas/nova?id=${proposal.id}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-black"
                >
                  <FilePenLine size={17} />
                  Editar
                </Link>
                <button
                  onClick={() => void duplicate()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 px-4 font-black"
                >
                  <Copy size={17} />
                  Duplicar
                </button>
                <button
                  onClick={() => void pdf()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 px-4 font-black"
                >
                  <Download size={17} />
                  Gerar PDF
                </button>
                <button
                  onClick={() => void whatsapp()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 font-black text-emerald-300"
                >
                  <MessageCircle size={17} />
                  WhatsApp
                </button>
                <button
                  onClick={() => void remove()}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-rose-400/25 text-rose-300"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </header>

            {busy && (
              <div className="mb-5 rounded-xl bg-cyan-400/10 p-3 text-center text-sm font-bold text-cyan-200">
                Processando...
              </div>
            )}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(390px,.75fr)]">
              <section className="space-y-5">
                <article className="rounded-[24px] border border-white/10 bg-white/[.045] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-black">Informações comerciais</h2>
                    <GibaSelect
                      value={proposal.status}
                      onChange={(value) =>
                        void changeStatus(value as ProposalStatus)
                      }
                      options={PROPOSAL_STATUS_OPTIONS}
                      className="w-full sm:w-56"
                      align="right"
                    />
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {detail.map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-2xl border border-white/[.07] bg-[#071122] p-4"
                      >
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {label}
                        </span>
                        <strong className="mt-1 block text-slate-200">
                          {String(value || "—")}
                        </strong>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="rounded-[24px] border border-white/10 bg-white/[.045] p-6">
                  <h2 className="text-xl font-black">Histórico simples</h2>
                  <div className="mt-5 border-l border-violet-400/30 pl-5">
                    <p className="font-bold">Proposta atualizada</p>
                    <p className="text-sm text-slate-500">
                      {new Date(proposal.updated_at).toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-5 font-bold">Proposta criada</p>
                    <p className="text-sm text-slate-500">
                      {new Date(proposal.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </article>
              </section>
              <ProposalPreview proposal={proposal} />
            </div>
          </main>
        </AppLayout>
      </PlanProtectedRoute>

      {messageOpen && (
        <WhatsAppMessageModal
          open
          onOpenChange={setMessageOpen}
          contextType="proposta"
          messageType="proposta_comercial"
          recipient={{
            name: String(proposal.client_snapshot.nome || ""),
            phone: String(
              proposal.client_snapshot.celular ||
                proposal.client_snapshot.telefone ||
                "",
            ),
          }}
          event={{
            date: String(proposal.event_snapshot.event_date || ""),
            format: String(proposal.format_snapshot.nome || ""),
            fee: proposal.amount,
          }}
          extraVariables={{
            valor: formatCurrency(proposal.amount),
            validade: formatDate(proposal.expiration_date),
            link_proposta: link,
            numero_proposta: proposal.proposal_number,
          }}
        />
      )}
    </ProtectedRoute>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, MessagesSquare } from "lucide-react";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import ProposalHeader from "../../components/propostas/ProposalHeader";
import ProposalMetricCard from "../../components/propostas/ProposalMetricCard";
import ProposalFilters, { type ProposalFilterState } from "../../components/propostas/ProposalFilters";
import ProposalList from "../../components/propostas/ProposalList";
import ProposalPngExporter from "../../components/propostas/ProposalPngExporter";
import WhatsAppMessageModal from "../../components/whatsapp/WhatsAppMessageModal";
import { deleteProposal, getCurrentUser, listProposals } from "../../lib/proposals/repository";
import { createProposalSignedUrl, uploadProposalPdf } from "../../lib/proposals/storage";
import { generateProposalPdf } from "../../lib/proposals/pdf";
import { supabase } from "../../lib/supabase";
import type { Proposal } from "../../lib/proposals/types";
import { formatCurrency, formatDate } from "../../lib/proposals/variables";

const initialFilters: ProposalFilterState = { search: "", status: "", format: "", client: "" };

export default function PropostasPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(initialFilters);
  const [whatsAppProposal, setWhatsAppProposal] = useState<Proposal | null>(null);
  const [proposalLink, setProposalLink] = useState("");
  const [pngProposal, setPngProposal] = useState<Proposal | null>(null);

  useEffect(() => { void load(); }, []);
  async function load() {
    setLoading(true); setError("");
    try { const user = await getCurrentUser(); setProposals(await listProposals(user.id)); }
    catch (loadError) { console.error(loadError); setError("Não foi possível carregar as propostas. A migration do módulo precisa ser revisada e aplicada no Supabase."); }
    finally { setLoading(false); }
  }

  const filtered = useMemo(() => proposals.filter((proposal) => {
    const term = filters.search.toLowerCase().trim();
    const haystack = `${proposal.proposal_number} ${proposal.title} ${proposal.client_snapshot.nome || ""} ${proposal.format_snapshot.nome || ""}`.toLowerCase();
    return (!term || haystack.includes(term)) && (!filters.status || proposal.status === filters.status) && (!filters.format || proposal.format_snapshot.nome === filters.format) && (!filters.client || proposal.client_snapshot.nome === filters.client);
  }), [filters, proposals]);
  const today = new Date().toISOString().slice(0, 10);
  const metrics = {
    total: proposals.length,
    negotiation: proposals.filter((item) => item.status === "em_negociacao").length,
    approved: proposals.filter((item) => item.status === "aprovada").length,
    expired: proposals.filter((item) => item.status === "expirada" || (item.expiration_date < today && !["aprovada", "recusada"].includes(item.status))).length,
  };

  async function makePdf(proposal: Proposal, upload = true) {
    setBusy(proposal.id);
    try {
      const generated = await generateProposalPdf(proposal);
      if (upload) {
        const user = await getCurrentUser(); const path = await uploadProposalPdf(user.id, proposal.id, generated.blob);
        const { error: updateError } = await supabase.from("proposals").update({ generated_pdf_path: path }).eq("id", proposal.id).eq("user_id", user.id);
        if (updateError) throw updateError;
        setProposals((items) => items.map((item) => item.id === proposal.id ? { ...item, generated_pdf_path: path } : item));
      }
      const url = URL.createObjectURL(generated.blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = generated.fileName; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (pdfError) { console.error(pdfError); alert(pdfError instanceof Error ? pdfError.message : "Não foi possível gerar o PDF."); }
    finally { setBusy(""); }
  }

  async function openWhatsApp(proposal: Proposal) {
    setBusy(proposal.id);
    try {
      let path = proposal.generated_pdf_path;
      if (!path) {
        const generated = await generateProposalPdf(proposal); const user = await getCurrentUser(); path = await uploadProposalPdf(user.id, proposal.id, generated.blob);
        const { error: updateError } = await supabase.from("proposals").update({ generated_pdf_path: path }).eq("id", proposal.id).eq("user_id", user.id);
        if (updateError) throw updateError;
        setProposals((items) => items.map((item) => item.id === proposal.id ? { ...item, generated_pdf_path: path } : item));
      }
      setProposalLink(await createProposalSignedUrl(path)); setWhatsAppProposal(proposal);
    } catch (sendError) { console.error(sendError); alert(sendError instanceof Error ? sendError.message : "Não foi possível preparar a proposta para envio."); }
    finally { setBusy(""); }
  }

  function makePng(proposal: Proposal) {
    setBusy(proposal.id);
    setPngProposal(proposal);
  }

  const finishPng = useCallback(({ blob, fileName }: { blob: Blob; fileName: string }) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPngProposal(null);
    setBusy("");
  }, []);

  const failPng = useCallback((pngError: unknown) => {
    console.error(pngError);
    alert(pngError instanceof Error ? pngError.message : "Não foi possível gerar o PNG da proposta.");
    setPngProposal(null);
    setBusy("");
  }, []);

  async function remove(item: Proposal) { if (!confirm(`Excluir a proposta ${item.proposal_number}? O cliente e o evento não serão removidos.`)) return; setBusy(item.id); try { const user = await getCurrentUser(); await deleteProposal(user.id, item.id); setProposals((items) => items.filter((proposal) => proposal.id !== item.id)); } catch (deleteError) { alert(deleteError instanceof Error ? deleteError.message : "Erro ao excluir."); } finally { setBusy(""); } }

  return <ProtectedRoute adminOnly><PlanProtectedRoute modulo="propostas"><AppLayout><main className="min-h-screen text-white"><ProposalHeader />{error && <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">{error}</div>}<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><ProposalMetricCard title="Total de Propostas" value={metrics.total} helper="propostas criadas" icon={FileText} accent="#a78bfa" /><ProposalMetricCard title="Em Negociação" value={metrics.negotiation} helper="aguardando definição" icon={MessagesSquare} accent="#fbbf24" /><ProposalMetricCard title="Aprovadas" value={metrics.approved} helper="negócios confirmados" icon={CheckCircle2} accent="#34d399" /><ProposalMetricCard title="Expiradas" value={metrics.expired} helper="precisam de atenção" icon={Clock3} accent="#fb7185" /></section><section className="mt-6 rounded-[28px] border border-white/10 bg-[#0b1628]/75 p-4 sm:p-6"><div className="mb-5"><p className="text-xs font-black tracking-[.15em] text-cyan-300">CARTEIRA COMERCIAL</p><h2 className="mt-1 text-2xl font-black">Propostas Recentes</h2><p className="mt-1 text-sm text-slate-400">Mais recentes primeiro. Use os filtros para localizar uma negociação.</p></div><ProposalFilters value={filters} onChange={setFilters} proposals={proposals} count={filtered.length} /><div className="mt-5"><ProposalList proposals={filtered} loading={loading} actions={{ pdf: (item) => void makePdf(item), png: makePng, whatsapp: (item) => void openWhatsApp(item), remove }} /></div>{busy && <p className="mt-4 text-center text-xs font-bold text-cyan-300">Processando proposta...</p>}</section></main></AppLayout></PlanProtectedRoute>{whatsAppProposal && <WhatsAppMessageModal open onOpenChange={(open) => !open && setWhatsAppProposal(null)} contextType="proposta" messageType="proposta_comercial" recipient={{ id: whatsAppProposal.client_id || undefined, name: String(whatsAppProposal.client_snapshot.nome || ""), phone: String(whatsAppProposal.client_snapshot.celular || whatsAppProposal.client_snapshot.telefone || ""), email: String(whatsAppProposal.client_snapshot.email || "") }} event={{ name: String(whatsAppProposal.event_snapshot.title || "Evento"), date: String(whatsAppProposal.event_snapshot.event_date || ""), time: String(whatsAppProposal.event_snapshot.event_time || ""), format: String(whatsAppProposal.format_snapshot.nome || ""), location: String(whatsAppProposal.event_snapshot.location || ""), fee: whatsAppProposal.amount }} extraVariables={{ valor: formatCurrency(whatsAppProposal.amount), validade: formatDate(whatsAppProposal.expiration_date), link_proposta: proposalLink, numero_proposta: whatsAppProposal.proposal_number }} />}{pngProposal && <ProposalPngExporter proposal={pngProposal} onComplete={finishPng} onError={failPng} />}</ProtectedRoute>;
}

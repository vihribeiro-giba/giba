import { supabase } from "../supabase";
import { getAccountAuthUser } from "../access-session";
import type { Proposal, ProposalDraft, ProposalTemplate } from "./types";

export async function getCurrentUser() {
  const { data, error } = await getAccountAuthUser();
  if (error || !data.user) throw new Error("Usuário não autenticado.");
  return data.user;
}

export async function listProposals(userId: string) {
  const { data, error } = await supabase.from("proposals").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Proposal[];
}

export async function getProposal(userId: string, id: string) {
  const { data, error } = await supabase.from("proposals").select("*").eq("user_id", userId).eq("id", id).single();
  if (error) throw error;
  return data as Proposal;
}

export async function reserveProposalNumber() {
  const { data, error } = await supabase.rpc("reserve_proposal_number");
  if (error) throw error;
  return String(data);
}

export async function saveProposal(userId: string, draft: ProposalDraft) {
  const payload = { ...draft, user_id: userId };
  if (draft.id) {
    const { id, ...updates } = payload;
    const { data, error } = await supabase.from("proposals").update(updates).eq("id", id).eq("user_id", userId).select().single();
    if (error) throw error;
    return data as Proposal;
  }
  const proposalNumber = draft.proposal_number || (await reserveProposalNumber());
  const { id: _id, ...insert } = payload;
  const { data, error } = await supabase.from("proposals").insert({ ...insert, proposal_number: proposalNumber }).select().single();
  if (error) throw error;
  return data as Proposal;
}

export async function deleteProposal(userId: string, id: string) {
  const { error } = await supabase.from("proposals").delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}

export async function duplicateProposal(userId: string, proposal: Proposal) {
  const { id: _id, created_at: _created, updated_at: _updated, proposal_number: _number, generated_pdf_path: _pdf, generated_cover_path: _cover, ...copy } = proposal;
  return saveProposal(userId, { ...copy, title: `${proposal.title} (cópia)`, status: "rascunho", generated_pdf_path: null, generated_cover_path: null });
}

export async function listProposalTemplates(userId: string) {
  const { data, error } = await supabase.from("proposal_templates").select("*").eq("user_id", userId).order("is_default", { ascending: false }).order("created_at");
  if (error) throw error;
  return (data || []) as ProposalTemplate[];
}

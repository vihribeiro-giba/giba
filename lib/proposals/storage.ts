import { supabase } from "../supabase";

export const PROPOSAL_BUCKET = "proposals";
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

export function validateProposalImage(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) return "Use uma imagem PNG, JPG, JPEG ou WEBP.";
  if (file.size > MAX_IMAGE_SIZE) return "A imagem deve ter no máximo 8 MB.";
  return "";
}

export async function uploadProposalAsset(userId: string, file: File, folder = "assets") {
  const validation = validateProposalImage(file);
  if (validation) throw new Error(validation);
  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(PROPOSAL_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function uploadProposalPdf(userId: string, proposalId: string, blob: Blob) {
  const path = `${userId}/generated/${proposalId}-${Date.now()}.pdf`;
  const { error } = await supabase.storage.from(PROPOSAL_BUCKET).upload(path, blob, {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });
  if (error) throw error;
  return path;
}

export async function createProposalSignedUrl(path: string, expiresIn = 60 * 60 * 24 * 7) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from(PROPOSAL_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

import { supabase } from "../supabase";

export const SHOW_FORMATS_BUCKET = "show-format-documents";
const MAX_PDF_SIZE = 15 * 1024 * 1024;

export function validateShowFormatPdf(file: File) {
  if (!file.size) return "O arquivo está vazio.";
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "Selecione um arquivo PDF.";
  }
  if (file.size > MAX_PDF_SIZE) return "O PDF deve ter no máximo 15 MB.";
  return "";
}

function safeFileName(name: string) {
  const base = name
    .replace(/\.pdf$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${base || "input-list"}.pdf`;
}

export async function uploadShowFormatPdf(accountUserId: string, formatId: string, file: File) {
  const validation = validateShowFormatPdf(file);
  if (validation) throw new Error(validation);

  const path = `${accountUserId}/${formatId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(SHOW_FORMATS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });

  if (error) throw error;
  return path;
}

export async function createShowFormatPdfUrl(path: string, expiresIn = 60 * 60) {
  const { data, error } = await supabase.storage.from(SHOW_FORMATS_BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadShowFormatPdf(path: string) {
  const { data, error } = await supabase.storage.from(SHOW_FORMATS_BUCKET).download(path);
  if (error) throw error;
  return data;
}

export async function removeShowFormatPdf(path: string) {
  const { error } = await supabase.storage.from(SHOW_FORMATS_BUCKET).remove([path]);
  if (error) throw error;
}

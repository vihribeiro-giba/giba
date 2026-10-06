import { supabase } from "../supabase";

export const PRODUCTION_BUCKET = "production-documents";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export function validateProductionDocument(file: File) {
  if (!file.size) return "O arquivo está vazio.";
  if (file.size > MAX_FILE_SIZE) return "O arquivo deve ter no máximo 25 MB.";
  return "";
}

function safeFileName(name: string) {
  const pieces = name.split(".");
  const extension = pieces.length > 1 ? `.${pieces.pop()?.toLowerCase()}` : "";
  const base = pieces.join(".").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || "arquivo"}${extension}`;
}

export async function uploadProductionDocument(accountUserId: string, productionId: string, file: File) {
  const validation = validateProductionDocument(file);
  if (validation) throw new Error(validation);
  const path = `${accountUserId}/${productionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(PRODUCTION_BUCKET).upload(path, file, {
    cacheControl: "3600", upsert: false, contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return path;
}

export async function createProductionDocumentUrl(path: string) {
  const { data, error } = await supabase.storage.from(PRODUCTION_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeProductionDocument(path: string) {
  const { error } = await supabase.storage.from(PRODUCTION_BUCKET).remove([path]);
  if (error) throw error;
}

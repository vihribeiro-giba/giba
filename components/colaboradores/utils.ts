/* ============================================================
   UTILITÁRIOS DO MÓDULO COLABORADORES
   ============================================================ */

/** Nome do bucket no Supabase Storage para as fotos dos colaboradores. */
export const BUCKET_FOTOS = "collaborator-photos";

/** Quantidade de colaboradores exibidos por página na listagem. */
export const POR_PAGINA = 6;

export function iniciais(nome: string) {
  const partes = (nome || "").trim().split(" ").filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const avatarPalette = [
  "linear-gradient(135deg, #8B35FF, #00AAFF)",
  "linear-gradient(135deg, #00AAFF, #37E884)",
  "linear-gradient(135deg, #F59E0B, #FF5B8A)",
  "linear-gradient(135deg, #FF5B8A, #8B35FF)",
  "linear-gradient(135deg, #38BDF8, #8B35FF)",
];

export function corAvatar(nome: string) {
  const texto = nome || "?";
  let soma = 0;
  for (let i = 0; i < texto.length; i++) soma += texto.charCodeAt(i);
  return avatarPalette[soma % avatarPalette.length];
}

export function placeholderPix(tipo: string) {
  switch (tipo) {
    case "CPF":
      return "123.456.789-00";
    case "Telefone":
      return "(31) 99999-9999";
    case "E-mail":
      return "colaborador@email.com";
    case "Chave Aleatória":
      return "ex: 1a2b3c4d-5e6f-...";
    default:
      return "Chave PIX";
  }
}

/** Redimensiona/comprime imagem no cliente e devolve um Blob JPEG. */
export function processarImagem(file: File, maxLado = 320): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
        const largura = Math.round(img.width * escala);
        const altura = Math.round(img.height * escala);

        const canvas = document.createElement("canvas");
        canvas.width = largura;
        canvas.height = altura;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas não suportado."));
          return;
        }
        ctx.drawImage(img, 0, 0, largura, altura);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Falha ao gerar imagem."));
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => reject(new Error("Falha ao carregar imagem."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.readAsDataURL(file);
  });
}

/** Extrai o caminho interno do arquivo a partir de uma URL pública do Storage. */
export function caminhoDaUrlPublica(url: string | null | undefined): string | null {
  if (!url) return null;
  const marcador = `/object/public/${BUCKET_FOTOS}/`;
  const idx = url.indexOf(marcador);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marcador.length));
}

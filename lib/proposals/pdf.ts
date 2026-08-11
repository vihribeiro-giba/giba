import jsPDF from "jspdf";
import type { Proposal } from "./types";
import { findMissingProposalVariables, getProposalVariables, replaceProposalVariables } from "./variables";
import { createProposalSignedUrl } from "./storage";
import { formatCompanyAddress } from "./address";

async function urlToDataUrl(url: string) {
  if (!url) return "";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível carregar uma imagem da proposta.");
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function resolveAsset(path: string) {
  if (!path) return "";
  return urlToDataUrl(path.startsWith("http") ? path : await createProposalSignedUrl(path, 900));
}

async function imageSize(dataUrl: string) {
  return await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function imageFormat(dataUrl: string) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

function addImage(doc: jsPDF, dataUrl: string, x: number, y: number, width: number, height: number) {
  doc.addImage(dataUrl, imageFormat(dataUrl), x, y, width, height, undefined, "FAST");
}

async function addContainedImage(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  align: "left" | "center" | "right" = "center",
) {
  const size = await imageSize(dataUrl);
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height);
  const width = size.width * scale;
  const height = size.height * scale;
  const offsetX = align === "right" ? maxWidth - width : align === "center" ? (maxWidth - width) / 2 : 0;
  addImage(doc, dataUrl, x + offsetX, y, width, height);
}

async function addCoverImage(doc: jsPDF, dataUrl: string) {
  if (!dataUrl) return;
  const { width, height } = await imageSize(dataUrl);
  const pageRatio = 210 / 297;
  const imageRatio = width / height;
  let w = 210, h = 297, x = 0, y = 0;
  if (imageRatio > pageRatio) { h = 297; w = h * imageRatio; x = (210 - w) / 2; }
  else { w = 210; h = w / imageRatio; y = (297 - h) / 2; }
  addImage(doc, dataUrl, x, y, w, h);
}

function safeFilePart(value: unknown) {
  return String(value || "proposta").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[<>:"/\\|?*]+/g, "").trim();
}

type PdfTextLine = {
  text: string;
  lastInParagraph: boolean;
};

function splitPdfParagraphs(doc: jsPDF, text: string, maxWidth: number) {
  const lines: PdfTextLine[] = [];
  const paragraphs = String(text || "").replace(/\r/g, "").trim().split(/\n\s*\n+/);
  paragraphs.forEach((rawParagraph, paragraphIndex) => {
    if (paragraphIndex > 0) {
      lines.push({ text: "", lastInParagraph: true });
    }
    const paragraph = rawParagraph.replace(/\s*\n\s*/g, " ").trim();
    if (!paragraph) return;
    const paragraphLines = doc.splitTextToSize(paragraph, maxWidth) as string[];
    paragraphLines.forEach((line, index) => {
      lines.push({ text: line, lastInParagraph: index === paragraphLines.length - 1 });
    });
  });
  return lines;
}

export function proposalPdfFileName(proposal: Proposal) {
  return `Proposta - ${safeFilePart(proposal.client_snapshot.nome)} - ${safeFilePart(proposal.format_snapshot.nome)}.pdf`;
}

export async function generateProposalPdfLegacy(proposal: Proposal) {
  const variables = getProposalVariables(proposal);
  const visible = proposal.content.filter((section) => section.visible);
  const missing = [...new Set(visible.flatMap((section) => findMissingProposalVariables(section.content, variables)))];
  if (missing.length) throw new Error(`Preencha as variáveis antes de gerar o PDF: ${missing.join(", ")}.`);

  const doc = new jsPDF("p", "mm", "a4");
  const visual = proposal.visual_config;
  const coverBackground = await resolveAsset(visual.coverBackgroundPath);
  const contentBackground = await resolveAsset(visual.contentBackgroundPath);
  const mainPhoto = await resolveAsset(visual.mainPhotoPath);
  const logo = await resolveAsset(visual.logoPath || String(proposal.company_snapshot.logo_url || ""));
  const signature = await resolveAsset(visual.signaturePath || String(proposal.company_snapshot.signature_url || ""));
  const companyFields = visual.companyFields || [];
  const showCompany = (field: string) => companyFields.includes(field);

  doc.setFillColor(10, 18, 35);
  doc.rect(0, 0, 210, 297, "F");
  await addCoverImage(doc, coverBackground || (visual.templateType === "fotografico" ? mainPhoto : ""));
  if (coverBackground && mainPhoto && visual.templateType === "fotografico") addImage(doc, mainPhoto, 18, 38, 174, 118);
  doc.setFillColor(5, 11, 24);
  doc.setGState(doc.GState({ opacity: 0.78 }));
  doc.roundedRect(16, 176, 178, 91, 5, 5, "F");
  doc.setGState(doc.GState({ opacity: 1 }));
  if (logo) addImage(doc, logo, 18, 18, 44, 24);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(25);
  doc.text(proposal.title || "Proposta comercial", 25, 201, { maxWidth: 160 });
  doc.setFontSize(13);
  doc.setTextColor(190, 210, 230);
  doc.text(String(proposal.client_snapshot.nome || ""), 25, 222);
  doc.setFontSize(10);
  doc.text(`${proposal.proposal_number}  •  válida até ${variables.validade}`, 25, 244);
  doc.text(`${showCompany("telefone") ? variables.telefone_comercial || "" : ""}  ${showCompany("instagram") ? variables.instagram || "" : ""}`, 25, 257);

  let y = 28;
  const addContentPage = async () => {
    doc.addPage();
    doc.setFillColor(9, 17, 32);
    doc.rect(0, 0, 210, 297, "F");
    if (contentBackground) {
      doc.setGState(doc.GState({ opacity: 0.28 }));
      await addCoverImage(doc, contentBackground);
      doc.setGState(doc.GState({ opacity: 1 }));
    }
    if (visual.watermark && logo) {
      doc.setGState(doc.GState({ opacity: 0.08 }));
      addImage(doc, logo, 55, 110, 100, 60);
      doc.setGState(doc.GState({ opacity: 1 }));
    }
    y = 28;
  };
  await addContentPage();
  for (const section of visible) {
    const body = replaceProposalVariables(section.content, variables, false);
    const lines = doc.splitTextToSize(body || "—", 164) as string[];
    const needed = 15 + lines.length * 5;
    if (y + needed > 267) await addContentPage();
    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(section.title, 23, y);
    y += 7;
    doc.setTextColor(225, 232, 240);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(lines, 23, y, { lineHeightFactor: 1.35 });
    y += lines.length * 5 + 8;
  }
  if (signature) {
    if (y > 245) await addContentPage();
    addImage(doc, signature, 23, y, 48, 24);
    y += 29;
  }
  doc.setFontSize(8);
  doc.setTextColor(130, 150, 175);
  doc.text(`${showCompany("razao_social") ? variables.razao_social || "" : showCompany("nome_artistico") ? variables.nome_artista || "" : ""} • ${showCompany("email") ? variables.email_comercial || "" : ""}`, 23, 284);
  return { blob: doc.output("blob"), doc, fileName: proposalPdfFileName(proposal) };
}

export async function generateProposalPdf(proposal: Proposal) {
  const variables = getProposalVariables(proposal);
  const visible = proposal.content.filter((section) => section.visible);
  const missing = [...new Set(visible.flatMap((section) => findMissingProposalVariables(section.content, variables)))];
  if (missing.length) throw new Error("Preencha as variáveis antes de gerar o PDF: " + missing.join(", ") + ".");

  const doc = new jsPDF("p", "mm", "a4");
  const visual = proposal.visual_config;
  const company = proposal.company_snapshot;
  const coverBackground = await resolveAsset(visual.coverBackgroundPath);
  const contentBackground = await resolveAsset(visual.contentBackgroundPath);
  const logo = await resolveAsset(visual.logoPath || String(company.logo_url || ""));
  const signature = await resolveAsset(visual.signaturePath || String(company.signature_url || ""));
  const companyName = String(company.razao_social || company.nome || company.nome_artistico || "");
  const document = String(company.cnpj || company.cpf || "");
  const documentTitle = String(company._document_title || "PROPOSTA COMERCIAL PARA VENDA DE SHOWS");
  const responsibleName = String(company._responsible_name || company.responsavel || "");
  const signatureRole = String(company._signature_role || "");
  const address = formatCompanyAddress(company);

  doc.setFillColor(9, 17, 32);
  doc.rect(0, 0, 210, 297, "F");
  if (coverBackground) {
    await addCoverImage(doc, coverBackground);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(25);
    doc.text(proposal.title || "Proposta Comercial", 105, 148, { align: "center", maxWidth: 170 });
  }

  let y = 58;
  const addContentPage = async () => {
    doc.addPage();
    doc.setFillColor(245, 247, 250);
    doc.rect(0, 0, 210, 297, "F");
    if (contentBackground) await addCoverImage(doc, contentBackground);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    if (companyName) doc.text(companyName, 15, 15, { maxWidth: 125 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let headerY = 21;
    if (document) {
      doc.text((company.cnpj ? "CNPJ: " : "CPF: ") + document, 15, headerY, { maxWidth: 125 });
      headerY += 5;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.3);
    if (address.streetLine) {
      doc.text(address.streetLine, 15, headerY, { maxWidth: 125 });
      headerY += 4.8;
    }
    if (address.cityLine) {
      doc.text(address.cityLine, 15, headerY, { maxWidth: 125 });
      headerY += 4.8;
    }
    if (company.telefone) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(String(company.telefone), 15, headerY);
      headerY += 4.8;
    }
    if (company.email) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(String(company.email), 15, headerY);
    }
    if (logo) await addContainedImage(doc, logo, 132, 9, 65, 22, "right");

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(16.5);
    doc.text(documentTitle, 105, 52, { align: "center", maxWidth: 190 });
    y = 68;
  };

  const addSignature = () => {
    if (signature) addImage(doc, signature, 76, 247, 58, 25);
    if (responsibleName || signatureRole) {
      doc.setDrawColor(40, 50, 65);
      doc.line(72, 276, 138, 276);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      if (responsibleName) doc.text(responsibleName, 105, 281, { align: "center" });
      if (signatureRole) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(signatureRole, 105, 285, { align: "center" });
      }
    }
  };

  await addContentPage();
  for (const section of visible) {
    const body = replaceProposalVariables(section.content, variables, false);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.3);
    const lines = splitPdfParagraphs(doc, body || "—", 180);

    let continuation = false;
    while (lines.length) {
      const fragmentTitle = continuation && section.title ? `${section.title} — continuação` : section.title;
      const fragmentTitleSpace = fragmentTitle ? 10 : 2;
      if (y + fragmentTitleSpace + 5 > 240) await addContentPage();

      if (fragmentTitle) {
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bolditalic");
        doc.setFontSize(14);
        doc.text(fragmentTitle, 15, y);
        y += 7;
      }

      const availableLines = Math.max(1, Math.floor((238 - y) / 5));
      const fragmentLines = lines.splice(0, availableLines);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.3);
      for (const line of fragmentLines) {
        if (line.text) {
          if (line.lastInParagraph) {
            doc.text(line.text, 15, y, { align: "left", maxWidth: 180 });
          } else {
            doc.text([line.text], 15, y, { align: "justify", maxWidth: 180 });
          }
        }
        y += 5;
      }
      y += 11;

      if (lines.length) {
        continuation = true;
        await addContentPage();
      }
    }
  }
  addSignature();

  return { blob: doc.output("blob"), doc, fileName: proposalPdfFileName(proposal) };
}

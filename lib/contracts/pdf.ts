import jsPDF from "jspdf";

type WordToken = { text: string; bold: boolean };

export function createContractPdfDocument(args: {
  text: string;
  title: string;
  clientName: string;
  contractorName: string;
}) {
  const doc = new jsPDF("p", "mm", "a4");
  doc.setFont("times", "normal");
  doc.setFontSize(11);

  const marginX = 18;
  const textWidth = 174;
  const lineHeight = 6;
  let y = 20;

  for (const rawBlock of args.text.split("\n\n")) {
    const block = rawBlock.trim();
    if (!block) continue;
    if (y > 267) {
      doc.addPage();
      y = 20;
    }

    const isTitle = block === args.title;
    const isSection = block === block.toUpperCase() && block.length < 90;
    if (isTitle) {
      doc.setFontSize(17);
      doc.setFont("times", "bold");
      doc.text(block, marginX, y, { maxWidth: textWidth });
      doc.setFontSize(11);
      doc.setFont("times", "normal");
      y += 10;
      continue;
    }
    if (isSection) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.setFont("times", "bold");
      doc.text(block.replace(":", ""), marginX, y, { maxWidth: textWidth });
      doc.setFont("times", "normal");
      y += 8;
      continue;
    }
    y = addJustifiedText(doc, block, marginX, y, textWidth, lineHeight);
    y += 3;
  }

  if (y > 230) {
    doc.addPage();
    y = 40;
  } else {
    y += 28;
  }

  const signatureWidth = 75;
  const clientX = 18;
  const contractorX = 117;
  doc.setLineWidth(0.2);
  doc.line(clientX, y, clientX + signatureWidth, y);
  doc.line(contractorX, y, contractorX + signatureWidth, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("times", "bold");
  doc.text("CONTRATANTE", clientX + signatureWidth / 2, y, { align: "center" });
  doc.text("CONTRATADO", contractorX + signatureWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFont("times", "normal");
  doc.text(args.clientName, clientX + signatureWidth / 2, y, { align: "center", maxWidth: signatureWidth });
  doc.text(args.contractorName, contractorX + signatureWidth / 2, y, { align: "center", maxWidth: signatureWidth });
  return doc;
}

function addJustifiedText(doc: jsPDF, text: string, x: number, initialY: number, maxWidth: number, lineHeight: number) {
  let y = initialY;
  const ensureSpace = () => {
    if (y > 277) {
      doc.addPage();
      y = 20;
    }
  };

  for (const paragraph of text.split("\n")) {
    if (!paragraph.trim()) {
      y += lineHeight;
      ensureSpace();
      continue;
    }
    const tokens = parseBoldText(paragraph);
    let line: WordToken[] = [];
    let lineWidth = 0;
    const normalSpace = doc.getTextWidth(" ");

    for (const token of tokens) {
      const width = tokenWidth(doc, token);
      const widthWithSpace = line.length ? width + normalSpace : width;
      if (lineWidth + widthWithSpace > maxWidth && line.length) {
        ensureSpace();
        renderLine(doc, line, x, y, maxWidth, true);
        y += lineHeight;
        line = [token];
        lineWidth = width;
      } else {
        line.push(token);
        lineWidth += widthWithSpace;
      }
    }
    if (line.length) {
      ensureSpace();
      renderLine(doc, line, x, y, maxWidth, false);
      y += lineHeight;
    }
  }
  return y;
}

function parseBoldText(text: string): WordToken[] {
  const paragraphPrefix = text.match(/^(§\d+º\.)\s*/);
  const normalized = paragraphPrefix
    ? `**${paragraphPrefix[1]}** ${text.slice(paragraphPrefix[0].length)}`
    : text;
  return normalized.split(/(\*\*.*?\*\*)/g).flatMap((part) => {
    if (!part) return [];
    const bold = part.startsWith("**") && part.endsWith("**");
    return part.replace(/\*\*/g, "").split(/\s+/).filter(Boolean).map((word) => ({ text: word, bold }));
  });
}

function tokenWidth(doc: jsPDF, token: WordToken) {
  doc.setFont("times", token.bold ? "bold" : "normal");
  return doc.getTextWidth(token.text);
}

function renderLine(doc: jsPDF, line: WordToken[], x: number, y: number, maxWidth: number, justify: boolean) {
  const wordsWidth = line.reduce((total, token) => total + tokenWidth(doc, token), 0);
  const spaces = Math.max(line.length - 1, 0);
  const spacing = justify && spaces ? (maxWidth - wordsWidth) / spaces : doc.getTextWidth(" ");
  let currentX = x;
  line.forEach((token, index) => {
    doc.setFont("times", token.bold ? "bold" : "normal");
    doc.text(token.text, currentX, y);
    currentX += tokenWidth(doc, token);
    if (index < line.length - 1) currentX += spacing;
  });
}

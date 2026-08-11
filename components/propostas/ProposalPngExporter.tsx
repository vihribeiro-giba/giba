"use client";

import html2canvas from "html2canvas-pro";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Proposal } from "../../lib/proposals/types";
import ProposalPreview from "./ProposalPreview";

type ProposalPngResult = {
  blob: Blob;
  fileName: string;
};

function safeFilePart(value: unknown) {
  return String(value || "proposta")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>:"/\\|?*]+/g, "")
    .trim();
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Não foi possível criar o arquivo PNG.")), "image/png");
  });
}

export default function ProposalPngExporter({
  proposal,
  onComplete,
  onError,
}: {
  proposal: Proposal;
  onComplete: (result: ProposalPngResult) => void;
  onError: (error: unknown) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!startedRef.current) onError(new Error("As imagens da proposta demoraram demais para carregar. Tente gerar o PNG novamente."));
    }, 30000);
    return () => window.clearTimeout(timeout);
  }, [onError]);

  useEffect(() => {
    if (!ready || startedRef.current || !rootRef.current) return;
    startedRef.current = true;
    let active = true;

    async function generate() {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const pages = Array.from(rootRef.current?.querySelectorAll<HTMLElement>("[data-proposal-png-page]") || []);
      if (!pages.length) throw new Error("Nenhuma página foi encontrada para gerar o PNG.");

      const renderedPages: HTMLCanvasElement[] = [];
      for (const page of pages) {
        renderedPages.push(await html2canvas(page, {
          backgroundColor: "#ffffff",
          imageTimeout: 20000,
          logging: false,
          scale: 1.25,
          useCORS: true,
        }));
      }

      const width = Math.max(...renderedPages.map((canvas) => canvas.width));
      const height = renderedPages.reduce((sum, canvas) => sum + canvas.height, 0);
      const combined = document.createElement("canvas");
      combined.width = width;
      combined.height = height;
      const context = combined.getContext("2d");
      if (!context) throw new Error("O navegador não conseguiu preparar a imagem da proposta.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      let offsetY = 0;
      for (const canvas of renderedPages) {
        context.drawImage(canvas, 0, offsetY);
        offsetY += canvas.height;
      }

      const blob = await canvasToBlob(combined);
      if (!active) return;
      onComplete({
        blob,
        fileName: `Proposta - ${safeFilePart(proposal.client_snapshot.nome)} - ${safeFilePart(proposal.format_snapshot.nome)}.png`,
      });
    }

    void generate().catch((error) => {
      if (active) onError(error);
    });
    return () => {
      active = false;
    };
  }, [onComplete, onError, proposal, ready]);

  return (
    <div ref={rootRef} className="pointer-events-none fixed left-[-100000px] top-0 z-[-1] w-[794px] overflow-visible">
      <ProposalPreview proposal={proposal} exportAllPages onExportReady={markReady} />
    </div>
  );
}

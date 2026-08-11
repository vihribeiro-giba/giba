"use client";

import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ProposalContentSection, ProposalDraft } from "../../lib/proposals/types";
import { getProposalVariables, replaceProposalVariables } from "../../lib/proposals/variables";
import { createProposalSignedUrl } from "../../lib/proposals/storage";
import { formatCompanyAddress } from "../../lib/proposals/address";

const PREVIEW_PAGE_LINE_CAPACITY = 34;
const EMPTY_ASSET_URLS: Record<string, string> = Object.freeze({});
const signedAssetRequests = new Map<string, Promise<string>>();

function preloadPreviewImage(url: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
  });
}

function resolveSignedPreviewAsset(path: string) {
  const cachedRequest = signedAssetRequests.get(path);
  if (cachedRequest) return cachedRequest;

  const request = createProposalSignedUrl(path, 3600)
    .then(async (url) => {
      await preloadPreviewImage(url);
      return url;
    })
    .catch((error) => {
      signedAssetRequests.delete(path);
      throw error;
    });
  signedAssetRequests.set(path, request);
  return request;
}

function wrapPreviewText(text: string, maxCharacters = 82) {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r/g, "").split("\n")) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxCharacters || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function paginatePreviewSections(sections: ProposalContentSection[]) {
  const pages: ProposalContentSection[][] = [[]];
  let usedLines = 0;

  const nextPage = () => {
    pages.push([]);
    usedLines = 0;
  };

  for (const section of sections) {
    const wrappedLines = wrapPreviewText(section.content || "—");
    let remainingLines = wrappedLines.length ? [...wrappedLines] : [""];
    let continuation = false;

    while (remainingLines.length) {
      const currentPage = pages[pages.length - 1];
      const title = continuation && section.title ? `${section.title} — continuação` : section.title;
      const titleCost = title ? 2 : 0;
      const gapCost = currentPage.length ? 1 : 0;
      const remainingCapacity = PREVIEW_PAGE_LINE_CAPACITY - usedLines - titleCost - gapCost;

      if (remainingCapacity < 1) {
        nextPage();
        continue;
      }

      const availableLines = Math.max(
        1,
        Math.min(remainingLines.length, remainingCapacity),
      );
      const pageLines = remainingLines.splice(0, availableLines);
      pages[pages.length - 1].push({
        ...section,
        id: `${section.id}-${pages.length}-${continuation ? "continuation" : "start"}`,
        title,
        content: pageLines.join("\n"),
      });
      usedLines += titleCost + gapCost + pageLines.length;

      if (remainingLines.length) {
        nextPage();
        continuation = true;
      }
    }
  }

  return pages.length && pages[0].length ? pages : [[]];
}

export default function ProposalPreview({
  proposal,
  assetUrls = EMPTY_ASSET_URLS,
  exportAllPages = false,
  onExportReady,
}: {
  proposal: ProposalDraft;
  assetUrls?: Record<string, string>;
  exportAllPages?: boolean;
  onExportReady?: () => void;
}) {
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(0.72);
  const [signedAssets, setSignedAssets] = useState<Record<string, string>>({});
  const variables = useMemo(() => getProposalVariables(proposal), [proposal]);
  const chunks = useMemo(() => {
    const renderedSections = proposal.content
      .filter((section) => section.visible)
      .map((section) => ({
        ...section,
        content: replaceProposalVariables(section.content, variables),
      }));
    return paginatePreviewSections(renderedSections);
  }, [proposal.content, variables]);
  const total = chunks.length + 1;
  const visual = proposal.visual_config;
  const logoPath = visual.logoPath || String(proposal.company_snapshot.logo_url || "");
  const signaturePath = visual.signaturePath || String(proposal.company_snapshot.signature_url || "");

  useEffect(() => {
    let active = true;
    const paths = [
      visual.coverBackgroundPath,
      visual.contentBackgroundPath,
      logoPath,
      signaturePath,
    ].filter((path) => path && !path.startsWith("http") && !assetUrls[path]);
    if (!paths.length) return;

    void Promise.all(
      paths.map(async (path) => [path, await resolveSignedPreviewAsset(path)] as const),
    )
      .then((items) => {
        if (!active) return;
        setSignedAssets((current) => {
          const unchanged = items.every(([path, url]) => current[path] === url);
          return unchanged ? current : { ...current, ...Object.fromEntries(items) };
        });
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [
    assetUrls,
    visual.coverBackgroundPath,
    visual.contentBackgroundPath,
    logoPath,
    signaturePath,
  ]);

  useEffect(() => {
    if (page > total - 1) setPage(total - 1);
  }, [page, total]);

  const asset = (path: string) => assetUrls[path] || signedAssets[path] || (path.startsWith("http") ? path : "");
  const logo = asset(logoPath);
  const signature = asset(signaturePath);
  const requiredAssetPaths = [visual.coverBackgroundPath, visual.contentBackgroundPath, logoPath, signaturePath].filter(Boolean);
  const assetsReady = requiredAssetPaths.every((path) => path.startsWith("http") || Boolean(assetUrls[path] || signedAssets[path]));
  const company = proposal.company_snapshot;
  const companyName = String(company.razao_social || company.nome || company.nome_artistico || "");
  const documentTitle = String(company._document_title || "PROPOSTA COMERCIAL PARA VENDA DE SHOWS");
  const responsibleName = String(company._responsible_name || company.responsavel || "");
  const signatureRole = String(company._signature_role || "");
  const document = company.cnpj || company.cpf;
  const address = formatCompanyAddress(company);

  useEffect(() => {
    if (exportAllPages && assetsReady) onExportReady?.();
  }, [assetsReady, exportAllPages, onExportReady]);

  const renderPage = (pageIndex: number, exporting = false) => {
    const background = pageIndex === 0 ? asset(visual.coverBackgroundPath) : asset(visual.contentBackgroundPath);
    return (
      <div
        key={pageIndex}
        data-proposal-png-page={exporting ? String(pageIndex + 1) : undefined}
        className="relative mx-auto origin-top overflow-hidden bg-white shadow-2xl"
        style={{
          width: exporting ? "794px" : String(210 * zoom) + "mm",
          maxWidth: exporting ? undefined : "100%",
          aspectRatio: "210/297",
          backgroundImage: background ? "url(" + background + ")" : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: visual.textColor || "#0f172a",
          containerType: "inline-size",
        }}
      >
        {pageIndex === 0 ? (
          !background && (
            <div className="grid h-full place-items-center bg-gradient-to-br from-violet-950 via-slate-950 to-cyan-950 px-8 text-center text-sm font-black text-slate-400">
              Adicione uma imagem de capa ao modelo
            </div>
          )
        ) : (
          <div className="relative flex h-full flex-col px-[5.2%] py-[4.2%]">
            <header className="grid min-h-[16cqw] grid-cols-[minmax(0,1fr)_42%] items-start gap-[4%]">
              <div className="leading-[1.38]">
                {companyName && <p className="text-[2.25cqw] font-black">{companyName}</p>}
                {Boolean(document) && <p className="text-[2.05cqw] font-black">{company.cnpj ? "CNPJ: " : "CPF: "}{String(document)}</p>}
                {address.streetLine && <p className="mt-[.45cqw] text-[1.82cqw] font-normal">{address.streetLine}</p>}
                {address.cityLine && <p className="text-[1.82cqw] font-normal">{address.cityLine}</p>}
                {Boolean(company.telefone) && <p className="mt-[.45cqw] text-[2cqw] font-black">{String(company.telefone)}</p>}
                {Boolean(company.email) && <p className="text-[1.65cqw] font-normal">{String(company.email)}</p>}
              </div>
              <div className="flex h-[15cqw] w-full items-start justify-end">
                {logo && <img src={logo} alt="Logomarca" className="h-full w-full object-contain object-right-top" />}
              </div>
            </header>

            <h2 className="mt-[4.5cqw] whitespace-nowrap text-center text-[3.15cqw] font-black italic tracking-[.02em]">
              {documentTitle}
            </h2>

            <div className="mt-[4cqw] space-y-[3.4cqw]">
              {chunks[pageIndex - 1]?.map((section) => (
                <section key={section.id}>
                  {section.title && <h3 className="text-[2.85cqw] font-black italic leading-none">{section.title}</h3>}
                  <p className="mt-[1.1cqw] whitespace-pre-wrap text-justify text-[2.02cqw] font-semibold leading-[1.42] [text-align-last:left]">
                    {section.content}
                  </p>
                </section>
              ))}
            </div>

            {pageIndex === total - 1 && (
              <footer className="mt-auto flex flex-col items-center pb-[1cqw] pt-[4cqw] text-center">
                {signature && <img src={signature} alt="Assinatura" className="h-[10cqw] w-[30cqw] object-contain mix-blend-multiply" />}
                {(responsibleName || signatureRole) && (
                  <div className="mt-[.5cqw] min-w-[30cqw] border-t border-current px-[2cqw] pt-[.7cqw] text-[1.65cqw]">
                    {responsibleName && <p className="font-black">{responsibleName}</p>}
                    {signatureRole && <p>{signatureRole}</p>}
                  </div>
                )}
              </footer>
            )}
          </div>
        )}
      </div>
    );
  };

  if (exportAllPages) {
    return (
      <div aria-hidden="true" className="flex w-[794px] flex-col bg-white">
        {Array.from({ length: total }, (_, pageIndex) => renderPage(pageIndex, true))}
      </div>
    );
  }

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#071122]/90 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-black text-white">Pré-visualização</h3>
          <p className="text-xs text-slate-500">Página {page + 1} de {total}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Diminuir zoom" onClick={() => setZoom(Math.max(0.4, zoom - 0.08))} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10">
            <ZoomOut size={16} />
          </button>
          <button type="button" aria-label="Ajustar à tela" onClick={() => setZoom(0.72)} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10">
            <Maximize2 size={16} />
          </button>
          <button type="button" aria-label="Aumentar zoom" onClick={() => setZoom(Math.min(1, zoom + 0.08))} className="grid h-9 w-9 place-items-center rounded-xl border border-white/10">
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded-2xl bg-black/25 p-3">
        {renderPage(page)}
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold disabled:opacity-30">
          <ChevronLeft size={16} /> Anterior
        </button>
        <button type="button" disabled={page === total - 1} onClick={() => setPage(page + 1)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-bold disabled:opacity-30">
          Próxima <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

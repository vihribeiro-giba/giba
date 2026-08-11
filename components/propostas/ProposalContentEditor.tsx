"use client";

import { ArrowDown, ArrowUp, Braces, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ProposalContentSection } from "../../lib/proposals/types";

export default function ProposalContentEditor({
  sections,
  onChange,
  variables = [],
}: {
  sections: ProposalContentSection[];
  onChange: (sections: ProposalContentSection[]) => void;
  variables?: readonly string[];
}) {
  const textareas = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [activeSection, setActiveSection] = useState(sections[0]?.id || "");

  function update(index: number, next: Partial<ProposalContentSection>) {
    onChange(sections.map((section, itemIndex) => (itemIndex === index ? { ...section, ...next } : section)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addSection() {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `section-${Date.now()}`;
    const nextSection: ProposalContentSection = {
      id,
      title: `${sections.length + 1} - NOVO TÓPICO`,
      content: "",
      visible: true,
    };
    onChange([...sections, nextSection]);
    setActiveSection(id);
  }

  function removeSection(index: number) {
    const next = sections.filter((_, itemIndex) => itemIndex !== index);
    onChange(next);
    if (activeSection === sections[index]?.id) setActiveSection(next[0]?.id || "");
  }

  function insertVariable(variable: string) {
    const index = sections.findIndex((section) => section.id === activeSection);
    if (index < 0) return;
    const textarea = textareas.current[activeSection];
    const start = textarea?.selectionStart ?? sections[index].content.length;
    const end = textarea?.selectionEnd ?? start;
    const content = sections[index].content;
    update(index, { content: content.slice(0, start) + variable + content.slice(end) });
    window.setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  }

  return (
    <div className="space-y-4">
      {variables.length > 0 && (
        <div className="rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4">
          <div className="flex items-center gap-2 text-sm font-black text-violet-200">
            <Braces size={17} />
            Variáveis disponíveis
          </div>
          <p className="mt-1 text-xs text-slate-500">Clique para inserir no último campo de texto selecionado.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                type="button"
                key={variable}
                onClick={() => insertVariable(variable)}
                className="rounded-lg border border-white/10 bg-[#071122] px-2.5 py-1.5 font-mono text-[11px] font-bold text-cyan-200 transition hover:border-cyan-400/40"
              >
                {variable}
              </button>
            ))}
          </div>
        </div>
      )}

      {sections.map((section, index) => (
        <article key={section.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-[220px] flex-1 text-xs font-bold text-slate-400">
              Título do tópico
              <input
                value={section.title}
                onChange={(event) => update(index, { title: event.target.value })}
                className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#071122] px-3 font-black text-white outline-none focus:border-cyan-400/50"
                aria-label={`Título do tópico ${index + 1}`}
              />
            </label>
            <div className="flex gap-2">
              <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 disabled:opacity-25">
                <ArrowUp size={14} />
              </button>
              <button type="button" aria-label="Mover para baixo" disabled={index === sections.length - 1} onClick={() => move(index, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 disabled:opacity-25">
                <ArrowDown size={14} />
              </button>
              <button type="button" aria-label="Excluir tópico" onClick={() => removeSection(index)} className="grid h-8 w-8 place-items-center rounded-lg border border-rose-400/20 text-rose-300 transition hover:bg-rose-400/10">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <textarea
            ref={(element) => {
              textareas.current[section.id] = element;
            }}
            value={section.content}
            onFocus={() => setActiveSection(section.id)}
            onChange={(event) => update(index, { content: event.target.value })}
            rows={6}
            className="w-full resize-y rounded-xl border border-white/10 bg-[#071122] p-3 text-sm leading-relaxed text-slate-200 outline-none focus:border-cyan-400/50"
          />
        </article>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-cyan-400/30 bg-cyan-400/[.05] px-4 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/10"
      >
        <Plus size={17} />
        Adicionar novo tópico
      </button>
    </div>
  );
}

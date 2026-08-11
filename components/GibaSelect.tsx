"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type GibaSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type GibaSelectProps = {
  value: string | number;
  options: GibaSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  align?: "left" | "right";
  leadingIcon?: React.ReactNode;
};

export default function GibaSelect({
  value,
  options,
  onChange,
  placeholder = "Selecione",
  ariaLabel,
  disabled = false,
  searchable,
  searchPlaceholder = "Digite para buscar...",
  className = "",
  triggerClassName = "",
  triggerStyle,
  align = "left",
  leadingIcon,
}: GibaSelectProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedValue = String(value ?? "");
  const showSearch = searchable ?? options.length > 7;
  const selected = options.find((option) => option.value === normalizedValue);

  const filteredOptions = useMemo(() => {
    const normalizedTerm = term.trim().toLocaleLowerCase("pt-BR");
    if (!normalizedTerm) return options;
    return options.filter((option) => option.label.toLocaleLowerCase("pt-BR").includes(normalizedTerm));
  }, [options, term]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggle() {
    if (disabled) return;
    setTerm("");
    setOpen((current) => !current);
  }

  function selectOption(option: GibaSelectOption) {
    if (option.disabled) return;
    onChange(option.value);
    setTerm("");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#111c30] px-4 text-left text-sm font-bold text-white outline-none transition hover:border-sky-400/35 hover:bg-[#142039] focus-visible:border-sky-400/70 focus-visible:ring-4 focus-visible:ring-sky-400/10 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
        style={triggerStyle}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {leadingIcon && <span className="shrink-0 text-cyan-300">{leadingIcon}</span>}
          <span className={`truncate ${selected ? "text-white" : "text-slate-400"}`}>
            {selected?.label || placeholder}
          </span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+8px)] z-[100] w-full overflow-hidden rounded-[14px] border border-white/15 bg-[#0b1424] p-2 shadow-[0_24px_60px_rgba(0,0,0,0.48)] ${align === "right" ? "right-0" : "left-0"}`}
        >
          {showSearch && (
            <label className="mb-2 flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.055] px-3 focus-within:border-sky-400/55">
              <Search size={16} className="shrink-0 text-slate-500" />
              <input
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-[180px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </label>
          )}

          <div role="listbox" className="flex max-h-64 w-full flex-col gap-1 overflow-y-auto">
            {!filteredOptions.length && (
              <p className="m-0 px-3 py-2 text-sm text-slate-400">Nenhum resultado encontrado.</p>
            )}
            {filteredOptions.map((option) => {
              const active = option.value === normalizedValue;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={option.disabled}
                  onClick={() => selectOption(option)}
                  className={`flex min-h-10 w-full min-w-0 items-center justify-between gap-4 rounded-[10px] px-3 py-2 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? "bg-gradient-to-r from-violet-500/30 to-sky-400/20 text-white" : "text-slate-300 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  <span className="truncate">{option.label}</span>
                  {active && <Check size={15} className="shrink-0 text-cyan-300" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

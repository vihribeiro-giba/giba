import { CalendarClock, CalendarDays, Filter, Search, X } from "lucide-react";
import GibaSelect from "../GibaSelect";

type FilterOption = { value: string; label: string };

type CrmFiltersProps = {
  search: string;
  model: string;
  priority: string;
  contactMonth: string;
  modelOptions: FilterOption[];
  priorityOptions: FilterOption[];
  resultCount: number;
  onSearchChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onContactMonthChange: (value: string) => void;
};

export default function CrmFilters({
  search,
  model,
  priority,
  contactMonth,
  modelOptions,
  priorityOptions,
  resultCount,
  onSearchChange,
  onModelChange,
  onPriorityChange,
  onContactMonthChange,
}: CrmFiltersProps) {
  const hasFilters = Boolean(
    search ||
      model !== "todos" ||
      priority !== "todos" ||
      contactMonth !== "todos",
  );

  function clearFilters() {
    onSearchChange("");
    onModelChange("todos");
    onPriorityChange("todos");
    onContactMonthChange("todos");
  }

  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/30 p-3 backdrop-blur-xl sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <label className="flex min-h-12 min-w-0 flex-[0.8] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 transition focus-within:border-cyan-400/40 focus-within:bg-cyan-400/[0.06]">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-500"
            placeholder="Buscar prefeitura, contato, modelo ou prioridade..."
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              aria-label="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </label>

        <FilterSelect icon={<Filter size={16} />} value={model} options={modelOptions} onChange={onModelChange} />
        <FilterSelect icon={<CalendarClock size={16} />} value={priority} options={priorityOptions} onChange={onPriorityChange} />
        <FilterSelect
          icon={<CalendarDays size={16} />}
          value={contactMonth}
          options={CONTACT_MONTH_OPTIONS}
          onChange={onContactMonthChange}
          compact
        />

        <div className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 xl:justify-center">
          <span className="whitespace-nowrap text-xs font-bold text-slate-400">
            {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-black text-cyan-300 transition hover:text-cyan-100"
            >
              Limpar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  icon,
  value,
  options,
  onChange,
  compact = false,
}: {
  icon: React.ReactNode;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <GibaSelect
      value={value}
      options={options}
      onChange={onChange}
      leadingIcon={icon}
      searchable={options.length > 8}
      className={compact ? "sm:min-w-[155px]" : "sm:min-w-[205px]"}
      triggerClassName="min-h-12 rounded-2xl bg-white/[0.055]"
    />
  );
}

const CONTACT_MONTH_OPTIONS = [
  { value: "todos", label: "Todos os meses" },
  { value: "0", label: "Janeiro" },
  { value: "1", label: "Fevereiro" },
  { value: "2", label: "Março" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Maio" },
  { value: "5", label: "Junho" },
  { value: "6", label: "Julho" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Setembro" },
  { value: "9", label: "Outubro" },
  { value: "10", label: "Novembro" },
  { value: "11", label: "Dezembro" },
];

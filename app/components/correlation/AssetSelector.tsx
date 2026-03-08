"use client";

import { Combobox } from "../ui/Combobox";
import { MultiCombobox } from "../ui/MultiCombobox";
import { TypeBadge } from "../ui/Badge";
import { useAssetSearch } from "../../hooks/useAssetSearch";
import type { AssetOption } from "../../lib/correlationTypes";

// ─── Shared option renderer ───────────────────────────────────────────────────

function OptionRow({
  option,
  isActive,
}: {
  option: AssetOption;
  isActive: boolean;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2 transition-colors"
      style={{ background: isActive ? "rgba(255,255,255,0.06)" : undefined }}
    >
      <span className="text-sm font-mono font-semibold text-slate-100 w-12 shrink-0">
        {option.value}
      </span>
      <span className="text-xs text-zinc-400 flex-1 truncate">{option.label}</span>
      <TypeBadge type={option.type} />
    </div>
  );
}

function ChipContent({ option }: { option: AssetOption }) {
  return (
    <div className="flex items-center gap-1.5">
      <TypeBadge type={option.type} />
      <span className="text-xs font-mono text-slate-200">{option.value}</span>
    </div>
  );
}

const SearchFooter = (
  <p className="text-[10px] text-zinc-600">Type to search all assets</p>
);

// ─── Single asset selector (designated ticker) ────────────────────────────────

interface DesignatedSelectorProps {
  selected: AssetOption | null;
  onSelect: (asset: AssetOption | null) => void;
  exclude?: string[];
}

export function DesignatedSelector({
  selected,
  onSelect,
  exclude = [],
}: DesignatedSelectorProps) {
  const { query, setQuery, clear, results, isSearching } = useAssetSearch({
    exclude,
  });

  return (
    <Combobox<AssetOption>
      label="Designated Asset"
      hint="Correlate all others against this"
      selected={selected}
      onSelect={(asset) => {
        onSelect(asset);
        clear();
      }}
      options={results}
      placeholder="Search ticker or name…"
      renderOption={(option, isActive) => (
        <OptionRow option={option} isActive={isActive} />
      )}
      renderSelected={(option) => <TypeBadge type={option.type} />}
      footer={SearchFooter}
    />
  );
}

// ─── Multi asset selector (comparison tickers) ────────────────────────────────

interface ComparisonSelectorProps {
  selected: AssetOption[];
  onSelect: (assets: AssetOption[]) => void;
  exclude?: string[];
  max?: number;
}

export function ComparisonSelector({
  selected,
  onSelect,
  exclude = [],
  max = 5,
}: ComparisonSelectorProps) {
  const { query, setQuery, clear, results } = useAssetSearch({ exclude });

  return (
    <MultiCombobox<AssetOption>
      label="Comparison Assets"
      hint={`${selected.length}/${max} selected`}
      selected={selected}
      onSelect={onSelect}
      options={results}
      placeholder="Search ticker or name…"
      max={max}
      renderOption={(option, isActive, isSelected) => (
        <div
          className="flex items-center gap-2.5 px-3 py-2 transition-colors"
          style={{ background: isActive ? "rgba(255,255,255,0.06)" : undefined }}
        >
          {/* Checkbox indicator */}
          <span
            className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
            style={{
              background: isSelected ? "#a3e635" : "transparent",
              borderColor: isSelected ? "#a3e635" : "#52525b",
            }}
            aria-hidden="true"
          >
            {isSelected && (
              <svg
                className="w-2.5 h-2.5"
                fill="none"
                stroke="#09090b"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m4.5 12.75 6 6 9-13.5"
                />
              </svg>
            )}
          </span>
          <span className="text-sm font-mono font-semibold text-slate-100 w-12 shrink-0">
            {option.value}
          </span>
          <span className="text-xs text-zinc-400 flex-1 truncate">
            {option.label}
          </span>
          <TypeBadge type={option.type} />
        </div>
      )}
      renderChip={(option) => <ChipContent option={option} />}
      footer={SearchFooter}
    />
  );
}
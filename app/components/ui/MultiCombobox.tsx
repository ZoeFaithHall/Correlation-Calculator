"use client";

import { useCallback, useId, useMemo } from "react";
import { X, Search } from "lucide-react";
import { useComboboxState } from "../../hooks/useComboboxState";
import type { ComboboxOption } from "./Combobox";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiComboboxProps<T extends ComboboxOption> {
  label: string;
  hint?: string;
  selected: T[];
  onSelect: (options: T[]) => void;
  options: T[];
  placeholder?: string;
  max?: number;
  renderOption: (option: T, isActive: boolean, isSelected: boolean) => React.ReactNode;
  renderChip: (option: T) => React.ReactNode;
  footer?: React.ReactNode;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiCombobox<T extends ComboboxOption>({
  label,
  hint,
  selected,
  onSelect,
  options,
  placeholder = "Search…",
  max = 5,
  renderOption,
  renderChip,
  footer,
  disabled = false,
}: MultiComboboxProps<T>) {
  const uid = useId();
  const listId = `${uid}-list`;
  const atMax = selected.length >= max;

  const selectedValues = useMemo(
    () => new Set(selected.map((a) => a.value)),
    [selected]
  );

  const { open, setOpen, activeIndex, query, setQuery, inputRef, listRef,
    containerRef, close, handleKeyDown } = useComboboxState({
    optionCount: options.length,
  });

  const toggle = useCallback(
    (option: T) => {
      if (selectedValues.has(option.value)) {
        onSelect(selected.filter((a) => a.value !== option.value));
      } else if (!atMax) {
        onSelect([...selected, option]);
      }
      setQuery("");
      inputRef.current?.focus();
    },
    [selected, selectedValues, onSelect, atMax, setQuery, inputRef]
  );

  const removeChip = useCallback(
    (value: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(selected.filter((a) => a.value !== value));
    },
    [selected, onSelect]
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Label row */}
      <div className="flex flex-col items-baseline justify-between mb-1.5 p-2">
        <label htmlFor={uid} className="text-xs font-medium text-zinc-400">
          {label}
        </label>
        {hint && (
          <span className="text-[10px] text-zinc-600" aria-hidden="true">
            {hint}
          </span>
        )}
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div
          className="flex flex-wrap gap-1.5 mb-2"
          role="group"
          aria-label={`Selected ${label}`}
        >
          {selected.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md pl-2 pr-1 py-1"
            >
              {renderChip(option)}
              <button
                type="button"
                onClick={(e) => removeChip(option.value, e)}
                aria-label={`Remove ${option.label}`}
                className="text-zinc-600 hover:text-zinc-300 transition-colors ml-0.5"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input — hidden at max */}
      {!atMax ? (
        <div
          className="flex items-center gap-2 bg-zinc-800 border rounded-lg px-3 py-2 transition-colors cursor-text"
          style={{ borderColor: open ? "#a3e635" : "#3f3f46" }}
          onClick={() => {
            if (!disabled) {
              setOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <input
            id={uid}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-activedescendant={activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined}
            aria-multiselectable="true"
            aria-autocomplete="list"
            autoComplete="off"
            disabled={disabled}
            value={query}
            placeholder={selected.length === 0 ? placeholder : "Add another…"}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) =>
              handleKeyDown(e, {
                onEnter: () => {
                  if (activeIndex >= 0 && options[activeIndex]) {
                    toggle(options[activeIndex]);
                  }
                },
                onBackspace: () => {
                  if (query === "" && selected.length > 0) {
                    onSelect(selected.slice(0, -1));
                  }
                },
              })
            }
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none min-w-0"
          />
          <Search size={14} className="text-zinc-600 shrink-0" aria-hidden="true" />
        </div>
      ) : (
        <p className="text-xs text-zinc-600 py-1" role="status">
          Maximum {max} assets selected.
        </p>
      )}

      {/* Dropdown */}
      {open && !disabled && !atMax && (
        <div className="absolute z-50 mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden">
          {options.length === 0 ? (
            <p className="text-xs text-zinc-500 px-3 py-3" role="status">
              No results found
            </p>
          ) : (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              className="max-h-60 overflow-y-auto py-1"
            >
              {options.map((option, i) => (
                <li
                  key={option.value}
                  id={`${uid}-option-${i}`}
                  role="option"
                  aria-selected={selectedValues.has(option.value)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggle(option)}
                  className="cursor-pointer"
                  style={{
                    background: i === activeIndex ? "rgba(255,255,255,0.06)" : undefined,
                  }}
                >
                  {renderOption(option, i === activeIndex, selectedValues.has(option.value))}
                </li>
              ))}
            </ul>
          )}
          {footer && (
            <div className="px-3 py-2 border-t border-zinc-800">{footer}</div>
          )}
        </div>
      )}
    </div>
  );
}
"use client";

import { useCallback, useId } from "react";
import { X, Search } from "lucide-react";
import { useComboboxState } from "../../hooks/useComboboxState";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps<T extends ComboboxOption> {
  label: string;
  hint?: string;
  selected: T | null;
  onSelect: (option: T | null) => void;
  options: T[];
  placeholder?: string;
  renderOption: (option: T, isActive: boolean) => React.ReactNode;
  renderSelected?: (option: T) => React.ReactNode;
  footer?: React.ReactNode;
  disabled?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Combobox<T extends ComboboxOption>({
  label,
  hint,
  selected,
  onSelect,
  options,
  placeholder = "Search…",
  renderOption,
  renderSelected,
  footer,
  disabled = false,
}: ComboboxProps<T>) {
  const uid = useId();
  const listId = `${uid}-list`;

  const { open, setOpen, activeIndex, query, setQuery, inputRef, listRef,
    containerRef, close, handleKeyDown } = useComboboxState({
    optionCount: options.length,
    onClose: () => { if (selected) setQuery(""); },
  });

  const handleSelect = useCallback(
    (option: T) => {
      onSelect(option);
      close();
    },
    [onSelect, close]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(null);
      close();
      inputRef.current?.focus();
    },
    [onSelect, close, inputRef]
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

      {/* Trigger */}
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
        {selected && renderSelected && (
          <span className="shrink-0">{renderSelected(selected)}</span>
        )}

        <input
          id={uid}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-activedescendant={activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={selected && !open ? (renderSelected ? "" : selected.label) : query}
          placeholder={selected ? (renderSelected ? selected.label : "") : placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) =>
            handleKeyDown(e, {
              onEnter: () => {
                if (activeIndex >= 0 && options[activeIndex]) {
                  handleSelect(options[activeIndex]);
                }
              },
            })
          }
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none min-w-0 disabled:cursor-not-allowed"
        />

        {selected ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear ${label}`}
            className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : (
          <Search size={14} className="shrink-0 text-zinc-600" aria-hidden="true" />
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (
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
              aria-label={label}
              className="max-h-60 overflow-y-auto py-1"
            >
              {options.map((option, i) => (
                <li
                  key={option.value}
                  id={`${uid}-option-${i}`}
                  role="option"
                  aria-selected={selected?.value === option.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className="cursor-pointer"
                  style={{
                    background: i === activeIndex ? "rgba(255,255,255,0.06)" : undefined,
                  }}
                >
                  {renderOption(option, i === activeIndex)}
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
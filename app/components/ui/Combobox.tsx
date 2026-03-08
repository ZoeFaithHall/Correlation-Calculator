"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
  type KeyboardEvent,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps<T extends ComboboxOption> {
  /** Accessible label — rendered as a <label> element */
  label: string;
  /** Optional hint shown opposite the label */
  hint?: string;
  /** Currently selected option */
  selected: T | null;
  /** Called when the user picks an option */
  onSelect: (option: T | null) => void;
  /** Filtered options to display — managed by the caller (e.g. useAssetSearch) */
  options: T[];
  /** Placeholder text when nothing is selected */
  placeholder?: string;
  /** Renders a single option row — caller controls the layout */
  renderOption: (option: T, isActive: boolean) => React.ReactNode;
  /** Renders the selected value in the trigger — defaults to option.label */
  renderSelected?: (option: T) => React.ReactNode;
  /** Footer slot inside the dropdown — e.g. "Type to search all assets" */
  footer?: React.ReactNode;
  /** Disable the whole control */
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
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");

  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        if (selected) setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [selected]);

  // ── Reset active index when options change ─────────────────────────────────
  useEffect(() => setActiveIndex(-1), [options]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open && e.key !== "Escape") {
        setOpen(true);
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, options.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && options[activeIndex]) {
            onSelect(options[activeIndex]);
            setQuery("");
            setOpen(false);
            setActiveIndex(-1);
          }
          break;
        case "Escape":
          setOpen(false);
          setActiveIndex(-1);
          if (selected) setQuery("");
          break;
        case "Tab":
          setOpen(false);
          setActiveIndex(-1);
          break;
      }
    },
    [open, options, activeIndex, onSelect, selected]
  );

  // ── Scroll active item into view ───────────────────────────────────────────
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (option: T) => {
      onSelect(option);
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
    },
    [onSelect]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(null);
      setQuery("");
      setOpen(false);
      inputRef.current?.focus();
    },
    [onSelect]
  );

  const listId = `${uid}-list`;

  return (
    <div ref={containerRef} className="relative">
      {/* Label row */}
      <div className="flex flex-col items-baseline justify-between justify-between gap-1 mb-1.5 p-2.5">
        <label
          htmlFor={uid}
          className="text-xs font-medium text-zinc-400"
        >
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
        {/* Selected value slot */}
        {selected && renderSelected && (
          <span className="flex shrink-0 rounded-lg">{renderSelected(selected)}</span>
        )}

        <input
          id={uid}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-activedescendant={
            activeIndex >= 0 ? `${uid}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={selected && !open ? (renderSelected ? "" : selected.label) : query}
          placeholder={selected ? (renderSelected ? selected.label : "") : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-zinc-500 focus:outline-none min-w-0 disabled:cursor-not-allowed"
        />

        {/* Clear / chevron */}
        {selected ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label={`Clear ${label}`}
            className="shrink-0 text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            <XIcon />
          </button>
        ) : (
          <SearchIcon className="shrink-0 text-zinc-600" />
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
                  onMouseDown={(e) => e.preventDefault()} // prevent input blur
                  onClick={() => handleSelect(option)}
                  className="cursor-pointer"
                  style={{
                    background:
                      i === activeIndex ? "rgba(255,255,255,0.06)" : undefined,
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

// ─── Icons ────────────────────────────────────────────────────────────────────

function XIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
      />
    </svg>
  );
}
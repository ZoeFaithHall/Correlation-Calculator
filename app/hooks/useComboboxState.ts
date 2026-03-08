"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type KeyboardEvent,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseComboboxStateOptions {
  optionCount: number;
  onClose?: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Shared state and behavior for Combobox and MultiCombobox.
 * Owns: open/close, active index, query, outside-click, keyboard navigation,
 * scroll-active-into-view.
 *
 * Callers only need to supply what's unique to them:
 * - onEnter: what happens when Enter is pressed with an active item
 * - onBackspace: MultiCombobox uses this to pop the last chip
 */
export function useComboboxState({ optionCount, onClose }: UseComboboxStateOptions) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
        setQuery("");
        onClose?.();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // ── Reset active index when option list changes ────────────────────────────
  useEffect(() => setActiveIndex(-1), [optionCount]);

  // ── Scroll active item into view ───────────────────────────────────────────
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // ── Close helper ───────────────────────────────────────────────────────────
  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    setQuery("");
  }, []);

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLInputElement>,
      {
        onEnter,
        onBackspace,
      }: {
        onEnter: () => void;
        onBackspace?: () => void;
      }
    ) => {
      if (e.key === "Backspace" && onBackspace) {
        onBackspace();
        return;
      }

      if (!open && e.key !== "Escape") {
        setOpen(true);
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, optionCount - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          onEnter();
          break;
        case "Escape":
          close();
          break;
        case "Tab":
          close();
          break;
      }
    },
    [open, optionCount, close]
  );

  return {
    open,
    setOpen,
    activeIndex,
    query,
    setQuery,
    inputRef,
    listRef,
    containerRef,
    close,
    handleKeyDown,
  };
}
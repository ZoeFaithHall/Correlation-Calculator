import { useState, useRef, useEffect } from "react";

// ─── TypeBadge ────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  crypto: { bg: "rgba(163,230,53,0.12)", text: "#a3e635", label: "Crypto" },
  stock:  { bg: "rgba(96,165,250,0.12)",  text: "#60a5fa", label: "Stock"  },
  etf:    { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", label: "ETF"    },
  trust:  { bg: "rgba(251,191,36,0.12)",  text: "#fbbf24", label: "Trust"  },
};

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export function TypeBadge({ type, className = "" }: TypeBadgeProps) {
  const style = TYPE_STYLES[type] ?? {
    bg: "rgba(255,255,255,0.08)",
    text: "#94a3b8",
    label: type,
  };

  return (
    <span
      className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${className}`}
      style={{ background: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 16, className = "" }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  /** Delay before showing in ms */
  delay?: number;
}

export function Tooltip({ content, children, delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
        >
          <span className="block bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl">
            {content}
          </span>
          {/* Arrow */}
          <span className="block w-2 h-2 bg-zinc-800 border-r border-b border-zinc-700 rotate-45 mx-auto -mt-1" />
        </span>
      )}
    </span>
  );
}
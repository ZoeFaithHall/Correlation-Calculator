"use client";

import { useState, useMemo } from "react";
import {
  correlationBgColor,
  correlationTextColor,
  formatCorrelation,
  buildMatrixLookup,
  getMatrixSymbols,
} from "../../lib/chartHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CorrelationHeatmapProps {
  matrix: Array<Record<string, number>>;
}

interface HoveredPair {
  row: string;
  col: string;
  value: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CorrelationHeatmap({ matrix }: CorrelationHeatmapProps) {
  const [hoveredPair, setHoveredPair] = useState<HoveredPair | null>(null);

  const symbols = useMemo(() => getMatrixSymbols(matrix), [matrix]);
  const lookup = useMemo(() => buildMatrixLookup(matrix), [matrix]);

  if (symbols.length === 0) return null;

  const cellSize = Math.max(52, Math.min(88, Math.floor(560 / symbols.length)));

  const isRowHighlighted = (sym: string) => hoveredPair?.row === sym || hoveredPair?.col === sym;
  const isColHighlighted = (sym: string) => hoveredPair?.col === sym || hoveredPair?.row === sym;

  return (
    <div className="overflow-x-auto">

      {/* Pair label — always-visible strip above the matrix */}
      <div className="h-7 mb-2 flex items-center">
        {hoveredPair ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-slate-100">
              {hoveredPair.row}
            </span>
            <span className="text-zinc-500 text-xs">vs</span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              {hoveredPair.col}
            </span>
            <span className="text-zinc-600 mx-1">·</span>
            <span
              className="font-mono text-sm font-bold tabular-nums"
              style={{
                color:
                  hoveredPair.value > 0.2
                    ? "#86efac"
                    : hoveredPair.value < -0.2
                    ? "#fca5a5"
                    : "#94a3b8",
              }}
            >
              {formatCorrelation(hoveredPair.value)}
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-600">
            Hover a cell to see the pair
          </span>
        )}
      </div>

      <table
        role="grid"
        aria-label="Correlation matrix"
        className="border-separate"
        style={{ borderSpacing: "3px" }}
      >
        {/* Column headers */}
        <thead>
          <tr>
            <th scope="col" aria-hidden="true" style={{ width: 56 }} />
            {symbols.map((sym) => (
              <th
                key={sym}
                scope="col"
                style={{ width: cellSize }}
                className="pb-2 text-center"
              >
                <span
                  className="text-xs font-mono font-semibold transition-colors"
                  style={{
                    color: isColHighlighted(sym) ? "#a3e635" : "#d4d4d8",
                  }}
                >
                  {sym}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Matrix rows */}
        <tbody>
          {symbols.map((rowSym) => {
            const rowData = lookup[rowSym] ?? {};
            return (
              <tr key={rowSym}>
                {/* Row label */}
                <td className="pr-2 text-right align-middle">
                  <span
                    className="text-xs font-mono font-semibold transition-colors"
                    style={{
                      color: isRowHighlighted(rowSym) ? "#a3e635" : "#d4d4d8",
                    }}
                  >
                    {rowSym}
                  </span>
                </td>

                {/* Cells */}
                {symbols.map((colSym) => {
                  const value = rowData[colSym] ?? 0;
                  const isSelf = rowSym === colSym;
                  const isActive =
                    hoveredPair?.row === rowSym && hoveredPair?.col === colSym;
                  const isHighlighted =
                    hoveredPair !== null &&
                    !isSelf &&
                    (hoveredPair.row === rowSym || hoveredPair.col === colSym);

                  return (
                    <td
                      key={colSym}
                      role="gridcell"
                      aria-label={`${rowSym} vs ${colSym}: ${formatCorrelation(value)}`}
                      onMouseEnter={() =>
                        !isSelf &&
                        setHoveredPair({ row: rowSym, col: colSym, value })
                      }
                      onMouseLeave={() => setHoveredPair(null)}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: correlationBgColor(value),
                        color: correlationTextColor(value),
                        borderRadius: 6,
                        outline: isActive
                          ? "2px solid rgba(163,230,53,0.9)"
                          : isSelf
                          ? "2px solid rgba(163,230,53,0.2)"
                          : isHighlighted
                          ? "2px solid rgba(163,230,53,0.35)"
                          : "2px solid transparent",
                        opacity: hoveredPair && !isActive && !isHighlighted && !isSelf ? 0.45 : 1,
                        transition: "outline 0.1s ease, opacity 0.1s ease",
                        cursor: isSelf ? "default" : "pointer",
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-0.5">
                        <span
                          className="font-mono text-xs font-bold tabular-nums"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {formatCorrelation(value)}
                        </span>
                        {isSelf && (
                          <span className="text-[9px] uppercase tracking-wider opacity-40">
                            self
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Color scale legend */}
      <div className="flex items-center gap-3 mt-5">
        <span className="text-[10px] font-mono text-zinc-500">−1.00</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{
            background:
              "linear-gradient(to right, rgb(185,28,28), rgb(39,39,42), rgb(101,163,53))",
          }}
          role="img"
          aria-label="Color scale: red is −1, zinc is 0, green is +1"
        />
        <span className="text-[10px] font-mono text-zinc-500">+1.00</span>
        <div className="flex items-center gap-1.5 ml-3">
          <div
            className="w-2 h-2 rounded-sm"
            style={{
              background: "rgb(39,39,42)",
              outline: "1px solid #3f3f46",
            }}
            aria-hidden="true"
          />
          <span className="text-[10px] text-zinc-500">no correlation</span>
        </div>
      </div>
    </div>
  );
}
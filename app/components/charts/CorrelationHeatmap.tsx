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

// ─── Component ────────────────────────────────────────────────────────────────

export function CorrelationHeatmap({ matrix }: CorrelationHeatmapProps) {
  const [hoveredPair, setHoveredPair] = useState<{
    row: string;
    col: string;
  } | null>(null);

  const symbols = useMemo(() => getMatrixSymbols(matrix), [matrix]);
  const lookup = useMemo(() => buildMatrixLookup(matrix), [matrix]);

  if (symbols.length === 0) return null;

  // Cell size scales down gracefully as asset count grows
  const cellSize = Math.max(52, Math.min(88, Math.floor(560 / symbols.length)));

  return (
    <div className="overflow-x-auto">
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
                <span className="text-xs font-mono font-semibold text-zinc-300">
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
                  <span className="text-xs font-mono font-semibold text-zinc-300">
                    {rowSym}
                  </span>
                </td>

                {/* Cells */}
                {symbols.map((colSym) => {
                  const value = rowData[colSym] ?? 0;
                  const isSelf = rowSym === colSym;
                  const isHighlighted =
                    hoveredPair !== null &&
                    (hoveredPair.row === rowSym || hoveredPair.col === colSym);

                  return (
                    <td
                      key={colSym}
                      role="gridcell"
                      aria-label={`${rowSym} vs ${colSym}: ${formatCorrelation(value)}`}
                      onMouseEnter={() =>
                        !isSelf && setHoveredPair({ row: rowSym, col: colSym })
                      }
                      onMouseLeave={() => setHoveredPair(null)}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        background: correlationBgColor(value),
                        color: correlationTextColor(value),
                        borderRadius: 6,
                        outline: isSelf
                          ? "2px solid rgba(163,230,53,0.2)"
                          : isHighlighted
                          ? "2px solid rgba(163,230,53,0.55)"
                          : "2px solid transparent",
                        transition: "outline 0.1s ease",
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
"use client";

import { useMemo } from "react";
import type { CorrelationParams } from "../lib/correlationTypes";

export type OnboardingStep = 1 | 2 | 3;

/**
 * Derives the current onboarding step from params.
 * Extracted from page.tsx so it's testable and reusable
 * by any component that needs to react to setup state.
 *
 * 1 — no designated asset selected
 * 2 — designated set, no comparisons yet
 * 3 — ready to run (both filled)
 */
export function useOnboardingStep(params: CorrelationParams): OnboardingStep {
  return useMemo(() => {
    if (!params.designated) return 1;
    if (params.comparisons.length === 0) return 2;
    return 3;
  }, [params.designated, params.comparisons.length]);
}
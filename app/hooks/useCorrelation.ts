import { useState, useCallback } from "react";
import type {
  CorrelationParams,
  CorrelationResponse,
  CorrelationState,
} from "../lib/correlationTypes";
import { buildCorrelationRequest } from "../lib/assetHelpers";

const ENDPOINT = "/api/correlation";

const IDLE_STATE: CorrelationState = {
  status: "idle",
  data: null,
  fatalErrors: [],
  warnings: [],
};

export function useCorrelation() {
  const [state, setState] = useState<CorrelationState>(IDLE_STATE);

  const run = useCallback(async (params: CorrelationParams) => {
    const request = buildCorrelationRequest(params);
    if (!request) return;

    setState({ status: "loading", data: null, fatalErrors: [], warnings: [] });

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        setState({
          status: "error",
          data: null,
          fatalErrors: [`Request failed: ${res.status} ${res.statusText}`],
          warnings: [],
        });
        return;
      }

      const data: CorrelationResponse = await res.json();
      const fatalErrors = data.errors?.errors ?? [];

      if (fatalErrors.length > 0) {
        setState({
          status: "error",
          data: null,
          fatalErrors,
          warnings: data.errors?.warnings ?? [],
        });
        return;
      }

      setState({
        status: "success",
        data,
        fatalErrors: [],
        warnings: data.errors?.warnings ?? [],
      });
    } catch (err) {
      setState({
        status: "error",
        data: null,
        fatalErrors: [
          "Failed to reach the correlation API. Is the dev server running?",
        ],
        warnings: [],
      });
    }
  }, []);

  // Call this when the user changes inputs after a successful run
  // This keeps the stale results visible but flags them as outdated
  const markStale = useCallback(() => {
    setState((prev) =>
      prev.status === "success" ? { ...prev, status: "stale" as any } : prev
    );
  }, []);

  const reset = useCallback(() => setState(IDLE_STATE), []);

  return { state, run, markStale, reset };
}
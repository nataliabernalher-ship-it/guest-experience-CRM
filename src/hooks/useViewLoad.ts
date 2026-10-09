import { useCallback, useEffect, useState } from "react";

export type ViewLoadStatus = "loading" | "ready" | "error";

/** Simulates async view hydration for list screens in this mock CRM. */
export function useViewLoad(key = "default", delayMs = 450) {
  const [status, setStatus] = useState<ViewLoadStatus>("loading");

  const load = useCallback(() => {
    setStatus("loading");
    const id = window.setTimeout(() => {
      setStatus("ready");
    }, delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  useEffect(() => {
    return load();
  }, [key, load]);

  const retry = useCallback(() => {
    load();
  }, [load]);

  const fail = useCallback(() => {
    setStatus("error");
  }, []);

  return { status, retry, fail, isLoading: status === "loading", isError: status === "error", isReady: status === "ready" };
}

import { useCallback } from "react";
import { useSearchParams } from "react-router";

/** Reads `?page=N` (anything that is not a whole number ≥ 1 means page 1); `setPage` adds a history entry. */
export function usePageParam(): [number, (page: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get("page");
  const parsed = raw !== null && /^\d+$/.test(raw) ? Number(raw) : 1;
  const page = Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1;

  const setPage = useCallback(
    (next: number) =>
      setSearchParams((current) => {
        const params = new URLSearchParams(current);
        if (next <= 1) params.delete("page");
        else params.set("page", String(next));
        return params;
      }),
    [setSearchParams],
  );
  return [page, setPage];
}

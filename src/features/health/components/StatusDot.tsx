import { NavLink } from "react-router";
import { cn } from "@/lib/utils";
import { useHealthQuery } from "../hooks/useHealthQuery";

type DotState = "checking" | "healthy" | "degraded" | "unhealthy" | "unreachable";

const LABEL: Record<DotState, string> = {
  checking: "checking",
  healthy: "healthy",
  degraded: "degraded",
  unhealthy: "unavailable",
  unreachable: "unreachable",
};

const TONE: Record<DotState, string> = {
  checking: "bg-muted-foreground/50 animate-pulse",
  healthy: "bg-success",
  degraded: "bg-warning",
  unhealthy: "bg-destructive",
  unreachable: "bg-destructive",
};

/** Service health as a small dot in the header (same query and refresh as the status page), linking there. */
export function StatusDot() {
  const { data, isPending, isError } = useHealthQuery();
  const state: DotState = isPending ? "checking" : isError ? "unreachable" : data.status;
  const label = `Service status: ${LABEL[state]}`;
  return (
    <NavLink
      to="/status"
      aria-label={label}
      title={label}
      data-state={state}
      className={({ isActive }) =>
        cn("grid size-8 place-items-center rounded-full transition-colors hover:bg-muted", isActive && "bg-muted")
      }
    >
      <span aria-hidden className={cn("size-2.5 rounded-full ring-2 ring-card", TONE[state])} />
    </NavLink>
  );
}

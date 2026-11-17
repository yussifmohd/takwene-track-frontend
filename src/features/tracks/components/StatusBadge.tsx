import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUSES, type TrackStatus } from "../catalog";

const TONE: Record<TrackStatus, { badge: string; step: string }> = {
  draft: { badge: "border-border bg-transparent", step: "bg-muted-foreground" },
  submitted: { badge: "border-accent/50 bg-accent/12", step: "bg-accent" },
  distributed: { badge: "border-success/50 bg-success/12", step: "bg-success" },
};

/**
 * The status as text plus a three-step rail showing how far along the workflow the track is
 * (draft ●○○, submitted ●●○, distributed ●●●). Colour is never the only signal: the label is always there.
 */
export function StatusBadge({ status, className }: { status: TrackStatus; className?: string }) {
  const reached = STATUSES.indexOf(status);
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-foreground",
        TONE[status].badge,
        className,
      )}
    >
      <span aria-hidden className="flex items-center gap-0.5">
        {STATUSES.map((step, index) => (
          <span
            key={step}
            className={cn("h-1.5 rounded-full", index === reached ? "w-3" : "w-1.5", index <= reached ? TONE[status].step : "bg-border")}
          />
        ))}
      </span>
      {STATUS_LABEL[status]}
    </span>
  );
}

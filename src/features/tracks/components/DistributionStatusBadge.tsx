import { cn } from "@/lib/utils";
import { DISTRIBUTION_STATUS_LABEL, type DistributionStatus } from "../catalog";

/**
 * A delivery's status: the word plus a mark whose shape also differs (open ring = waiting, filled dot
 * = live, struck dot = rejected), so neither colour nor shape alone carries the meaning.
 */
const TONE: Record<DistributionStatus, { badge: string; mark: string }> = {
  pending: { badge: "border-accent/60 bg-accent/12", mark: "border-2 border-accent bg-transparent" },
  live: { badge: "border-success/50 bg-success/12", mark: "bg-success" },
  rejected: {
    badge: "border-destructive/50 bg-destructive/10",
    mark: "bg-destructive after:absolute after:inset-x-[-2px] after:top-1/2 after:h-0.5 after:-translate-y-1/2 after:-rotate-45 after:rounded-full after:bg-background",
  },
};

export function DistributionStatusBadge({ status, className }: { status: DistributionStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-foreground",
        TONE[status].badge,
        className,
      )}
    >
      <span aria-hidden className={cn("relative size-2 shrink-0 rounded-full", TONE[status].mark)} />
      {DISTRIBUTION_STATUS_LABEL[status]}
    </span>
  );
}

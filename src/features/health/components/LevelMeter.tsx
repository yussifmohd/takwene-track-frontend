import type { HealthState } from "@/api/health";
import { cn } from "@/lib/utils";

const BAR_HEIGHTS = [28, 40, 52, 64, 72, 80, 88, 96, 100];

const LEVEL: Record<HealthState, { lit: number; tone: string }> = {
  healthy: { lit: BAR_HEIGHTS.length, tone: "bg-success" },
  degraded: { lit: 5, tone: "bg-warning" },
  unhealthy: { lit: 2, tone: "bg-destructive" },
};

/**
 * A mixing-desk style level meter: how much of the system is "on air".
 * Decorative; the status text next to it carries the meaning for assistive tech.
 */
export function LevelMeter({ state, className }: { state: HealthState; className?: string }) {
  const { lit, tone } = LEVEL[state];
  return (
    <div aria-hidden className={cn("flex h-16 items-end gap-1", className)} data-state={state}>
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={height}
          className={cn("w-2 rounded-sm", index < lit ? tone : "bg-muted")}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function LevelMeterSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex h-16 items-end gap-1", className)}>
      {BAR_HEIGHTS.map((height) => (
        <span key={height} className="w-2 animate-pulse rounded-sm bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

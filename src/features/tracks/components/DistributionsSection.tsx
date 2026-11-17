import { Send } from "lucide-react";
import type { TrackDetail } from "@/api/tracks";
import { UserText } from "@/components/UserText";
import { formatDateTime } from "@/lib/format";

/**
 * Deliveries to platforms (filled from Phase 4). A track marked distributed by a status change alone
 * has none, and says so instead of pretending it was delivered.
 */
export function DistributionsSection({ track }: { track: TrackDetail }) {
  return (
    <section aria-labelledby="distributions-title" className="grid gap-3">
      <h2 id="distributions-title" className="text-lg font-semibold">
        Distributions
      </h2>
      {track.distributions.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-card px-4 py-5">
          <Send aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {track.status === "distributed"
              ? "Marked as distributed without platform deliveries recorded."
              : "Not sent to any platform yet."}
          </p>
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {track.distributions.map((distribution) => (
            <li key={distribution.dspId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
              <UserText className="font-medium">{distribution.dspName}</UserText>
              <span className="text-muted-foreground">
                {distribution.status} · {formatDateTime(distribution.updatedAtUtc)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

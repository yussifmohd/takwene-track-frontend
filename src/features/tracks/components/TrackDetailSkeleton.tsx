import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder shaped like the track page: title, artist, badge, facts grid, deliveries table. */
export function TrackDetailSkeleton() {
  return (
    <div aria-hidden className="grid gap-8">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-lg border bg-card p-5 sm:grid-cols-3">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="grid gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
      <div data-skeleton="distributions" className="grid gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="divide-y rounded-lg border bg-card">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
              <Skeleton className="hidden h-4 w-24 sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

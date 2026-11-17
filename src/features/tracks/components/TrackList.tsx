import { Link } from "react-router";
import type { TrackListItem } from "@/api/tracks";
import { UserText } from "@/components/UserText";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCalendarDate } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

/**
 * The catalog: a table from `sm` up, stacked rows on phones. Titles link to the track; titles and
 * artist names are user text (dir="auto") and wrap instead of widening the page.
 */
export function TrackList({ tracks }: { tracks: TrackListItem[] }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Tracks</caption>
        <thead className="hidden border-b text-left text-muted-foreground sm:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Title</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Artist</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Genre</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Release</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tracks.map((track) => (
            <tr key={track.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 px-4 py-3 sm:table-row sm:p-0">
              <th scope="row" className="col-span-2 text-left font-medium sm:px-4 sm:py-3">
                <Link
                  to={`/tracks/${track.id}`}
                  className="rounded-sm text-base break-words underline-offset-4 hover:underline focus-visible:underline sm:text-sm"
                >
                  <UserText>{track.title}</UserText>
                </Link>
              </th>
              <td className="col-span-2 text-muted-foreground sm:px-4 sm:py-3 sm:text-foreground">
                <span className="sr-only sm:hidden">Artist: </span>
                <UserText className="break-words">{track.artistName}</UserText>
              </td>
              <td className="text-muted-foreground sm:px-4 sm:py-3">
                <span className="sr-only sm:hidden">Genre: </span>
                {track.genre}
              </td>
              <td className="row-span-2 self-center justify-self-end sm:px-4 sm:py-3">
                <span className="sr-only sm:hidden">Status: </span>
                <StatusBadge status={track.status} />
              </td>
              <td className="text-xs text-muted-foreground sm:px-4 sm:py-3 sm:text-right sm:text-sm">
                <span className="sm:hidden">Release </span>
                <time dateTime={track.releaseDate}>{formatCalendarDate(track.releaseDate)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Placeholder shaped like the catalog (header line + rows). */
export function TrackListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" aria-hidden>
      <div className="hidden border-b px-4 py-3 sm:flex sm:gap-10">
        <Skeleton className="h-3.5 w-12" />
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-12" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-2 px-4 py-3.5 sm:flex sm:items-center sm:gap-8">
            <Skeleton className="h-4" style={{ width: `${8 + ((i * 3) % 6)}rem` }} />
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="hidden h-3.5 w-16 sm:block" />
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="hidden h-3.5 w-20 sm:ml-auto sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

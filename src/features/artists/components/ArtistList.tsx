import type { Artist } from "@/api/artists";
import { UserText } from "@/components/UserText";
import { Skeleton } from "@/components/ui/skeleton";
import { countryName } from "@/lib/countries";
import { formatDate } from "@/lib/format";

/**
 * The roster: a table from `sm` up, stacked rows on phones. Names are user text (dir="auto") and
 * wrap instead of widening the page. The email column exists only when the caller may see it.
 */
export function ArtistList({ artists, showEmail }: { artists: Artist[]; showEmail: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Artists</caption>
        <thead className="hidden border-b text-left text-muted-foreground sm:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">Name</th>
            <th scope="col" className="px-4 py-2.5 font-medium">Country</th>
            {showEmail ? <th scope="col" className="px-4 py-2.5 font-medium">Email</th> : null}
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Added</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {artists.map((artist) => (
            <tr key={artist.id} className="grid gap-0.5 px-4 py-3 sm:table-row sm:p-0">
              <th scope="row" className="text-left font-medium sm:px-4 sm:py-3">
                <UserText className="block text-base break-words sm:text-sm">{artist.name}</UserText>
              </th>
              <td className="text-muted-foreground sm:px-4 sm:py-3 sm:text-foreground">
                <span className="sr-only sm:hidden">Country: </span>
                {countryName(artist.countryCode)}
              </td>
              {showEmail ? (
                <td className="break-all text-muted-foreground sm:px-4 sm:py-3" dir="ltr">
                  <span className="sr-only sm:hidden">Email: </span>
                  {artist.email ?? ""}
                </td>
              ) : null}
              <td className="text-xs text-muted-foreground sm:px-4 sm:py-3 sm:text-right sm:text-sm">
                <span className="sm:hidden">Added </span>
                <time dateTime={artist.createdAtUtc}>{formatDate(artist.createdAtUtc)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Placeholder shaped like the roster (header line + rows). */
export function ArtistListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" aria-hidden>
      <div className="hidden border-b px-4 py-3 sm:flex sm:gap-8">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-16" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-2 px-4 py-3.5 sm:flex sm:items-center sm:gap-8">
            <Skeleton className="h-4" style={{ width: `${9 + ((i * 5) % 7)}rem` }} />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="hidden h-3.5 w-14 sm:ml-auto sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

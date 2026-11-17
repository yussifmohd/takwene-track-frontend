import { Plus } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/stores/authStore";
import { TrackFilters } from "../components/TrackFilters";
import { TrackList, TrackListSkeleton } from "../components/TrackList";
import { useTrackFilters } from "../hooks/useTrackFilters";
import { useTracksQuery } from "../hooks/useTrackQueries";

function AddTrackButton() {
  return (
    <Button asChild>
      <Link to="/tracks/new">
        <Plus aria-hidden />
        Add track
      </Link>
    </Button>
  );
}

function trackCount(total: number, filtered: boolean) {
  const count = total === 1 ? "1 track" : `${total.toLocaleString("en")} tracks`;
  return filtered ? `${count} match these filters.` : `${count} in the catalogue.`;
}

/** The home page: the catalog, filtered and paged through the address. */
export function TracksPage() {
  const { filters, page, hasFilters, setFilter, clearFilters, setPage } = useTrackFilters();
  const isAdmin = useIsAdmin();
  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } = useTracksQuery(filters, page);

  const totalPages = data ? Math.max(1, data.totalPages ?? Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Tracks"
        description={data ? trackCount(data.totalCount, hasFilters) : "Every recording in the catalogue and where it stands."}
        actions={isAdmin ? <AddTrackButton /> : undefined}
      />
      <div className="grid gap-4">
        <TrackFilters filters={filters} hasFilters={hasFilters} onChange={setFilter} onClear={clearFilters} />
        <div aria-busy={isPending || isFetching || undefined} className="grid gap-4">
          {isPending ? (
            <>
              <span className="sr-only" role="status">Loading tracks</span>
              <TrackListSkeleton />
            </>
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
          ) : data.totalCount === 0 && hasFilters ? (
            <EmptyState
              title="No tracks match these filters"
              description="Try another status, genre or artist."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : data.totalCount === 0 ? (
            <EmptyState
              title="No tracks yet"
              description={isAdmin ? "Add the first track to start the catalogue." : "Tracks appear here once an admin adds them."}
              action={isAdmin ? <AddTrackButton /> : undefined}
            />
          ) : data.items.length === 0 ? (
            <EmptyState
              title="This page is empty"
              description={`There are only ${totalPages} ${totalPages === 1 ? "page" : "pages"} of tracks.`}
              action={
                <Button variant="outline" onClick={() => setPage(1)}>
                  Go to page 1
                </Button>
              }
            />
          ) : (
            <>
              <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
                <TrackList tracks={data.items} />
              </div>
              {totalPages > 1 ? (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} busy={isPlaceholderData} />
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}

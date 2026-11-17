import { Plus } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useIsAdmin } from "@/stores/authStore";
import { ArtistList, ArtistListSkeleton } from "../components/ArtistList";
import { Pagination } from "@/components/Pagination";
import { useArtistsQuery } from "../hooks/useArtistsQuery";
import { usePageParam } from "../hooks/usePageParam";

function AddArtistButton() {
  return (
    <Button asChild>
      <Link to="/artists/new">
        <Plus aria-hidden />
        Add artist
      </Link>
    </Button>
  );
}

function artistCount(total: number) {
  return total === 1 ? "1 artist" : `${total.toLocaleString("en")} artists`;
}

export function ArtistsPage() {
  const [page, setPage] = usePageParam();
  const isAdmin = useIsAdmin();
  const { data, error, isPending, isError, isFetching, isPlaceholderData, refetch } = useArtistsQuery(page);

  const totalPages = data ? Math.max(1, data.totalPages ?? Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <>
      <PageHeader
        title="Artists"
        description={data ? `${artistCount(data.totalCount)} credited in the catalogue.` : "Everyone who can be credited on a track."}
        actions={isAdmin ? <AddArtistButton /> : undefined}
      />
      <div aria-busy={isPending || isFetching || undefined} className="grid gap-4">
        {isPending ? (
          <>
            <span className="sr-only" role="status">Loading artists</span>
            <ArtistListSkeleton />
          </>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
        ) : data.totalCount === 0 ? (
          <EmptyState
            title="No artists yet"
            description={isAdmin ? "Add the first artist so tracks can be credited." : "Artists appear here once an admin adds them."}
            action={isAdmin ? <AddArtistButton /> : undefined}
          />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="This page is empty"
            description={`There are only ${totalPages} ${totalPages === 1 ? "page" : "pages"} of artists.`}
            action={
              <Button variant="outline" onClick={() => setPage(1)}>
                Go to page 1
              </Button>
            }
          />
        ) : (
          <>
            <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
              <ArtistList artists={data.items} showEmail={isAdmin} />
            </div>
            {totalPages > 1 ? (
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} busy={isPlaceholderData} />
            ) : null}
          </>
        )}
      </div>
    </>
  );
}

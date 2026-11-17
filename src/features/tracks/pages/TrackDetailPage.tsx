import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useParams } from "react-router";
import { isApiError } from "@/api/problem";
import type { TrackDetail } from "@/api/tracks";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { UserText } from "@/components/UserText";
import { Button } from "@/components/ui/button";
import { formatCalendarDate, formatDateTime } from "@/lib/format";
import { useIsAdmin } from "@/stores/authStore";
import { DistributionsSection } from "../components/DistributionsSection";
import { StatusBadge } from "../components/StatusBadge";
import { StatusControl } from "../components/StatusControl";
import { TrackDetailSkeleton } from "../components/TrackDetailSkeleton";
import { useTrackQuery } from "../hooks/useTrackQueries";

function BackToCatalog() {
  return (
    <Link to="/" className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft aria-hidden className="size-4" />
      All tracks
    </Link>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

function TrackView({ track }: { track: TrackDetail }) {
  const isAdmin = useIsAdmin();
  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <BackToCatalog />
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="grid min-w-0 gap-1">
            <h1 className="text-3xl font-semibold tracking-tight text-balance break-words">
              <UserText>{track.title}</UserText>
            </h1>
            <p className="text-lg text-muted-foreground">
              <UserText className="break-words">{track.artistName}</UserText>
            </p>
          </div>
          <StatusBadge status={track.status} className="mt-2 px-3 py-1 text-sm" />
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 rounded-lg border bg-card p-5 sm:grid-cols-3">
        <Fact label="ISRC">
          <span dir="ltr" className="tracking-wide tabular-nums">{track.isrc}</span>
        </Fact>
        <Fact label="Genre">{track.genre}</Fact>
        <Fact label="Release date">
          <time dateTime={track.releaseDate}>{formatCalendarDate(track.releaseDate)}</time>
        </Fact>
        <Fact label="Added">
          <time dateTime={track.createdAtUtc}>{formatDateTime(track.createdAtUtc)}</time>
        </Fact>
        <Fact label="Last changed">
          {track.updatedAtUtc ? <time dateTime={track.updatedAtUtc}>{formatDateTime(track.updatedAtUtc)}</time> : "Not changed yet"}
        </Fact>
      </dl>

      {isAdmin ? (
        <section aria-labelledby="status-title" className="grid gap-3">
          <h2 id="status-title" className="text-lg font-semibold">
            Status
          </h2>
          <StatusControl track={track} />
        </section>
      ) : null}

      <DistributionsSection track={track} />
    </div>
  );
}

export function TrackDetailPage() {
  const { id = "" } = useParams();
  const { data, error, isPending, isError, isFetching, refetch } = useTrackQuery(id);

  if (isPending) {
    return (
      <>
        <span className="sr-only" role="status">Loading track</span>
        <TrackDetailSkeleton />
      </>
    );
  }

  if (isError) {
    if (isApiError(error) && error.status === 404) {
      return (
        <PageHeader
          title="Track not found"
          description={
            <>
              There is no track at this address. It may have been mistyped.
              <span className="mt-4 block">
                <Button asChild>
                  <Link to="/">Go to the catalogue</Link>
                </Button>
              </span>
            </>
          }
        />
      );
    }
    return (
      <div className="grid gap-6">
        <BackToCatalog />
        <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
      </div>
    );
  }

  return <TrackView track={data} />;
}

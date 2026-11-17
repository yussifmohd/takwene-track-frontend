import { RotateCw } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatTimeUntil } from "@/lib/format";
import { useCurrentUserQuery } from "../hooks/useCurrentUserQuery";

const ROLE_LABEL: Record<string, string> = { Admin: "Admin – can change the catalogue" };

export function AccountPage() {
  const { data, error, isPending, isError, refetch, isFetching } = useCurrentUserQuery();

  return (
    <>
      <PageHeader title="Your account" description="Who you are signed in as, and when this session ends." />
      <Card className="max-w-2xl py-0" aria-busy={isPending || undefined}>
        <CardContent className="py-6">
          {isPending ? (
            <AccountSkeleton />
          ) : isError ? (
            <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
          ) : (
            <>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="break-all font-medium" dir="ltr">
                  {data.email}
                </dd>
                <dt className="text-sm text-muted-foreground">Role</dt>
                <dd>{data.roles.map((role) => ROLE_LABEL[role] ?? role).join(", ") || "No role"}</dd>
                <dt className="text-sm text-muted-foreground">Session ends</dt>
                <dd>
                  <time dateTime={data.expiresAt} className="font-medium tabular-nums">
                    {formatDateTime(data.expiresAt)}
                  </time>{" "}
                  <span className="text-muted-foreground">({formatTimeUntil(data.expiresAt)})</span>
                </dd>
              </dl>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <p className="max-w-prose text-sm text-muted-foreground">Sessions are not renewed automatically. Sign in again after it ends.</p>
                <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
                  <RotateCw aria-hidden className={isFetching ? "animate-spin" : undefined} />
                  Refresh
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AccountSkeleton() {
  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-[10rem_minmax(0,1fr)]" aria-label="Loading account">
      {[56, 64, 48].map((width, index) => (
        <div key={index} className="contents">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  );
}

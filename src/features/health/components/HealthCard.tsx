import { RotateCw } from "lucide-react";
import type { HealthCheckEntry, HealthReport, HealthState } from "@/api/health";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HEALTH_REFRESH_MS, useHealthQuery } from "../hooks/useHealthQuery";
import { LevelMeter, LevelMeterSkeleton } from "./LevelMeter";

const COPY: Record<HealthState, { title: string; detail: string }> = {
  healthy: { title: "Everything is running", detail: "The API and its database are responding." },
  degraded: { title: "Running with problems", detail: "The API responds, but some checks are slow or failing." },
  unhealthy: { title: "Service unavailable", detail: "The API is up, but something it depends on is down." },
};

const STATE_LABEL: Record<HealthState, string> = { healthy: "Healthy", degraded: "Degraded", unhealthy: "Unhealthy" };

const BADGE_TONE: Record<HealthState, string> = {
  healthy: "bg-success text-success-foreground",
  degraded: "bg-warning text-white",
  unhealthy: "bg-destructive text-destructive-foreground",
};

const CHECK_NAMES: Record<string, string> = { database: "Database" };

export function HealthCard() {
  const { data, error, isPending, isError, refetch, isFetching } = useHealthQuery();

  return (
    <Card className="gap-0 overflow-hidden py-0" aria-busy={isPending || undefined}>
      {isPending ? (
        <HealthCardSkeleton />
      ) : isError ? (
        <CardContent className="py-6">
          <ErrorState error={error} onRetry={() => void refetch()} retrying={isFetching} />
        </CardContent>
      ) : (
        <HealthReportView report={data} onRefresh={() => void refetch()} refreshing={isFetching} />
      )}
    </Card>
  );
}

function HealthReportView({ report, onRefresh, refreshing }: { report: HealthReport; onRefresh: () => void; refreshing: boolean }) {
  const copy = COPY[report.status];
  return (
    <>
      <CardHeader className="flex flex-row items-end gap-5 border-b py-6">
        <LevelMeter state={report.status} className="shrink-0" />
        <div aria-live="polite" className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{copy.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.detail}</p>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <ul aria-label="Checks" className="divide-y">
          {report.checks.map((check) => (
            <CheckRow key={check.name} check={check} />
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 py-3 text-sm text-muted-foreground">
        <p>
          Checked at <time dateTime={report.checkedAt} className="tabular-nums">{formatTime(report.checkedAt)}</time>, refreshes every{" "}
          {HEALTH_REFRESH_MS / 1000} seconds
        </p>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RotateCw aria-hidden className={cn(refreshing && "animate-spin")} />
          Check now
        </Button>
      </CardFooter>
    </>
  );
}

function CheckRow({ check }: { check: HealthCheckEntry }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3">
      <span className="font-medium">{CHECK_NAMES[check.name] ?? check.name}</span>
      <span className="flex items-center gap-3">
        <span className="text-sm tabular-nums text-muted-foreground">{formatDuration(check.durationMs)}</span>
        <Badge className={cn("border-transparent", BADGE_TONE[check.status])}>{STATE_LABEL[check.status]}</Badge>
      </span>
    </li>
  );
}

function HealthCardSkeleton() {
  return (
    <div data-testid="health-skeleton">
      <span className="sr-only">Checking system status</span>
      <div className="flex items-end gap-5 border-b px-6 py-6">
        <LevelMeterSkeleton />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="flex items-center justify-between px-6 py-5">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="border-t px-6 py-4">
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
    </div>
  );
}

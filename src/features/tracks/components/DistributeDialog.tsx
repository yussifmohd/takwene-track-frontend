import { LoaderCircle } from "lucide-react";
import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError, isApiError } from "@/api/problem";
import { showProblemToast } from "@/api/toast";
import type { TrackDetail } from "@/api/tracks";
import { ErrorState } from "@/components/ErrorState";
import { UserText } from "@/components/UserText";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDistributeTrackMutation, useDspsQuery } from "../hooks/useTrackQueries";
import { trackKeys } from "../queryKeys";
import { DistributionStatusBadge } from "./DistributionStatusBadge";

const plural = (n: number) => `${n} platform${n === 1 ? "" : "s"}`;

/** Platforms that can't be chosen now: their delivery is waiting for an answer or already live. */
export function blockedPlatformIds(track: TrackDetail) {
  return new Set(track.distributions.filter((d) => d.status !== "rejected").map((d) => d.dspId));
}

/**
 * How many chosen platforms are now waiting for an answer. The API answers 200 also when nothing
 * changed (every platform was already pending or live, e.g. another admin sent them first): then the
 * track's last-change time is the one the dialog was opened with.
 */
function sentCount(before: TrackDetail, after: TrackDetail, chosen: string[]) {
  if (after.updatedAtUtc === before.updatedAtUtc) return 0;
  return chosen.filter((id) => after.distributions.some((d) => d.dspId === id && d.status === "pending")).length;
}

/**
 * Admin-only. A Distribute button that opens a checklist of platforms: never-sent ones and rejected
 * ones ("Send again") can be chosen; pending and live ones are shown disabled with their status.
 * Disabled with the reason when every platform is pending or live.
 */
export function DistributeDialog({ track }: { track: TrackDetail }) {
  const [open, setOpen] = useState(false);
  const dsps = useDspsQuery();
  const reasonId = useId();
  const blocked = blockedPlatformIds(track);
  const everywhere = dsps.data !== undefined && dsps.data.every((d) => blocked.has(d.id));

  if (everywhere) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button disabled aria-describedby={reasonId}>
          Distribute
        </Button>
        <span id={reasonId} className="text-sm text-muted-foreground">
          Sent to every platform
        </span>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Distribute</Button>
      </DialogTrigger>
      {open ? <DistributeForm track={track} onDone={() => setOpen(false)} /> : null}
    </Dialog>
  );
}

function DistributeForm({ track, onDone }: { track: TrackDetail; onDone: () => void }) {
  const queryClient = useQueryClient();
  const dsps = useDspsQuery();
  const mutation = useDistributeTrackMutation(track.id);
  const [chosen, setChosen] = useState<string[]>([]);
  const blocked = blockedPlatformIds(track);

  const toggle = (id: string, on: boolean) =>
    setChosen((current) => (on ? [...current, id] : current.filter((c) => c !== id)));

  const send = () => {
    mutation.mutate(chosen, {
      onSuccess: (updated) => {
        const sent = sentCount(track, updated, chosen);
        if (sent === 0) {
          toast.info("Already sent to these platforms", { description: <UserText>{updated.title}</UserText> });
        } else {
          toast.success(`Sent to ${plural(sent)}`, { description: <UserText>{updated.title}</UserText> });
        }
        onDone();
      },
      onError: (error) => {
        // 401 is handled globally (sign-out, then back here after signing in).
        if (isApiError(error) && error.status === 401) return;
        if (isApiError(error) && (error.status === 409 || error.status === 404)) {
          toast.error("Not sent", { description: describeError(error).detail });
          void queryClient.invalidateQueries({ queryKey: trackKeys.detail(track.id) });
          onDone();
          return;
        }
        showProblemToast(error);
      },
    });
  };

  return (
    <DialogContent
      onEscapeKeyDown={(e) => mutation.isPending && e.preventDefault()}
      onInteractOutside={(e) => mutation.isPending && e.preventDefault()}
    >
      <DialogHeader>
        <DialogTitle>
          Distribute <UserText>{track.title}</UserText>
        </DialogTitle>
        <DialogDescription>Choose the platforms to send this track to.</DialogDescription>
      </DialogHeader>

      {dsps.isPending ? (
        <div className="grid gap-2" aria-hidden>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : dsps.isError ? (
        <ErrorState error={dsps.error} onRetry={() => void dsps.refetch()} retrying={dsps.isFetching} />
      ) : (
        <fieldset className="grid gap-2" disabled={mutation.isPending}>
          <legend className="sr-only">Platforms</legend>
          {dsps.data.map((dsp) => {
            const delivery = track.distributions.find((d) => d.dspId === dsp.id);
            const disabled = blocked.has(dsp.id);
            const inputId = `dsp-${dsp.id}`;
            return (
              <label
                key={dsp.id}
                htmlFor={inputId}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 has-checked:border-primary has-checked:bg-primary/5 has-disabled:cursor-not-allowed has-disabled:bg-muted/40"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  className="size-4 shrink-0 accent-primary"
                  disabled={disabled}
                  checked={chosen.includes(dsp.id)}
                  onChange={(e) => toggle(dsp.id, e.target.checked)}
                />
                <UserText className={disabled ? "text-muted-foreground" : "font-medium"}>{dsp.name}</UserText>
                <span className="ms-auto">
                  {delivery?.status === "rejected" ? (
                    <span className="text-sm text-muted-foreground">Send again</span>
                  ) : delivery ? (
                    <DistributionStatusBadge status={delivery.status} />
                  ) : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button onClick={send} disabled={chosen.length === 0 || mutation.isPending}>
          {mutation.isPending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
          {mutation.isPending ? "Sending" : chosen.length === 0 ? "Send" : `Send to ${plural(chosen.length)}`}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

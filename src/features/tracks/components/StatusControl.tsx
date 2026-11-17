import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError, isApiError } from "@/api/problem";
import { showProblemToast } from "@/api/toast";
import type { TrackDetail } from "@/api/tracks";
import { UserText } from "@/components/UserText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { STATUS_ACTION, STATUS_DONE, type TrackStatus } from "../catalog";
import { useChangeTrackStatusMutation } from "../hooks/useTrackQueries";
import { trackKeys } from "../queryKeys";

/**
 * Admin-only status control. Offers exactly the moves the API lists as allowed next; the API stays
 * the authority. "Distributed" is final, so it asks first.
 */
export function StatusControl({ track }: { track: TrackDetail }) {
  const queryClient = useQueryClient();
  const mutation = useChangeTrackStatusMutation(track.id);
  const [confirming, setConfirming] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<TrackStatus | null>(null);

  const change = (target: TrackStatus) => {
    setPendingTarget(target);
    mutation.mutate(target, {
      onSuccess: (updated) => toast.success(STATUS_DONE[target], { description: <UserText>{updated.title}</UserText> }),
      onError: (error) => {
        // 401 is handled globally (sign-out, then back here after signing in).
        if (isApiError(error) && error.status === 401) return;
        if (isApiError(error) && (error.status === 409 || error.status === 404)) {
          // Someone else changed (or removed) it: say why and show the current state.
          const { detail } = describeError(error);
          toast.error("Status not changed", { description: detail });
          void queryClient.invalidateQueries({ queryKey: trackKeys.detail(track.id) });
          return;
        }
        showProblemToast(error);
      },
      onSettled: () => setPendingTarget(null),
    });
  };

  if (track.allowedNextStatuses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Distributed is final. The status can&apos;t change any more.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Change status">
      {track.allowedNextStatuses.map((target) => {
        const busy = mutation.isPending && pendingTarget === target;
        return (
          <Button
            key={target}
            variant={target === "draft" ? "outline" : "default"}
            disabled={mutation.isPending}
            onClick={() => (target === "distributed" ? setConfirming(true) : change(target))}
          >
            {busy ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
            {STATUS_ACTION[target]}
          </Button>
        );
      })}
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as distributed?</AlertDialogTitle>
            <AlertDialogDescription>
              Distributed is final. The status can&apos;t change after this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => change("distributed")}>Mark as distributed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

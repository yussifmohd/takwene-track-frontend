import { LoaderCircle, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { describeError, isApiError } from "@/api/problem";
import { showProblemToast } from "@/api/toast";
import type { TrackDetail, TrackDistribution } from "@/api/tracks";
import { UserText } from "@/components/UserText";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { useIsAdmin } from "@/stores/authStore";
import { ANSWER_ACTION, ANSWER_DONE, type DistributionAnswer } from "../catalog";
import { useRecordAnswerMutation } from "../hooks/useTrackQueries";
import { trackKeys } from "../queryKeys";
import { DistributeDialog } from "./DistributeDialog";
import { DistributionStatusBadge } from "./DistributionStatusBadge";

const isAnswer = (value: string): value is DistributionAnswer => value in ANSWER_ACTION;

function Time({ value }: { value: string }) {
  return <time dateTime={value}>{formatDateTime(value)}</time>;
}

/**
 * Where the track was delivered: a table (stacked rows on phones) of platform, status, sent time and
 * answer time. Admins also get Distribute and, on pending rows, the platform's simulated answer.
 * What is allowed comes from the API (`canDistribute`, `allowedAnswers`).
 */
export function DistributionsSection({ track }: { track: TrackDetail }) {
  const isAdmin = useIsAdmin();
  const queryClient = useQueryClient();
  const answer = useRecordAnswerMutation(track.id);

  const record = (row: TrackDistribution, status: DistributionAnswer) => {
    answer.mutate(
      { dspId: row.dspId, status },
      {
        onSuccess: () => toast.success(`${row.dspName} ${ANSWER_DONE[status]}`, { description: <UserText>{track.title}</UserText> }),
        onError: (error) => {
          if (isApiError(error) && error.status === 401) return;
          if (isApiError(error) && (error.status === 409 || error.status === 404)) {
            toast.error("Answer not recorded", { description: describeError(error).detail });
            void queryClient.invalidateQueries({ queryKey: trackKeys.detail(track.id) });
            return;
          }
          showProblemToast(error);
        },
      },
    );
  };

  const showActions = isAdmin && track.distributions.some((d) => d.allowedAnswers.some(isAnswer));

  return (
    <section aria-labelledby="distributions-title" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="distributions-title" className="text-lg font-semibold">
          Distributions
        </h2>
        {isAdmin && track.canDistribute ? <DistributeDialog track={track} /> : null}
      </div>

      {track.distributions.length === 0 ? (
        <div className="flex items-start gap-3 rounded-lg border border-dashed bg-card px-4 py-5">
          <Send aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Not sent to any platform yet.</p>
        </div>
      ) : (
        <>
          {isAdmin ? <p className="text-sm text-muted-foreground">Platform answers are simulated.</p> : null}
          <div className="rounded-lg border bg-card">
            <table aria-label="Platform deliveries" className="w-full text-sm max-sm:block">
              <thead className="text-left text-xs text-muted-foreground max-sm:sr-only">
                <tr className="border-b">
                  <th scope="col" className="px-4 py-2.5 font-medium">Platform</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Sent</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Answer</th>
                  {showActions ? (
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <span className="sr-only">Record answer</span>
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y max-sm:block">
                {track.distributions.map((row) => {
                  const answers = isAdmin ? row.allowedAnswers.filter(isAnswer) : [];
                  const busy = answer.isPending && answer.variables?.dspId === row.dspId;
                  return (
                    <tr key={row.dspId} className="max-sm:grid max-sm:grid-cols-2 max-sm:gap-x-4 max-sm:gap-y-2 max-sm:px-4 max-sm:py-3">
                      <td className="px-4 py-3 font-medium max-sm:p-0">
                        <UserText>{row.dspName}</UserText>
                      </td>
                      <td className="px-4 py-3 max-sm:justify-self-end max-sm:p-0">
                        <DistributionStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums max-sm:p-0">
                        <span className="sm:sr-only">Sent </span>
                        <Time value={row.submittedAtUtc} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground tabular-nums max-sm:justify-self-end max-sm:p-0">
                        <span className="sm:sr-only">Answer </span>
                        {row.answeredAtUtc ? <Time value={row.answeredAtUtc} /> : "Waiting"}
                      </td>
                      {showActions ? (
                        <td className="px-4 py-2 max-sm:col-span-2 max-sm:p-0">
                          {answers.length > 0 ? (
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              {answers.map((status) => (
                                <Button
                                  key={status}
                                  size="sm"
                                  variant="outline"
                                  disabled={answer.isPending}
                                  onClick={() => record(row, status)}
                                >
                                  {busy && answer.variables?.status === status ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
                                  {ANSWER_ACTION[status]}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

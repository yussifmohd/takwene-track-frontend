import { toast } from "sonner";
import { describeError } from "./problem";

/** Shows a ProblemDetails (or network) error as a toast: title + detail. */
export function showProblemToast(error: unknown) {
  const { title, detail } = describeError(error);
  toast.error(title, { description: detail });
}

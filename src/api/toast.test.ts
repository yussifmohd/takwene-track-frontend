import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "./problem";
import { showProblemToast } from "./toast";

describe("showProblemToast", () => {
  it("shows the ProblemDetails title and detail", () => {
    const spy = vi.spyOn(toast, "error").mockImplementation(() => "id");
    showProblemToast(new ApiError(409, { title: "Conflict", detail: "Cannot change status from distributed to draft." }));
    expect(spy).toHaveBeenCalledWith("Conflict", { description: "Cannot change status from distributed to draft." });
  });
});

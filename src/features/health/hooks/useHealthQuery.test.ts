import { describe, expect, it } from "vitest";
import { HEALTH_REFRESH_MS, healthQueryOptions } from "./useHealthQuery";

describe("healthQueryOptions", () => {
  it("refreshes every 30 seconds only while the tab is visible", () => {
    const options = healthQueryOptions();
    expect(HEALTH_REFRESH_MS).toBe(30_000);
    expect(options.refetchInterval).toBe(30_000);
    expect(options.refetchIntervalInBackground).toBe(false);
    expect(options.queryKey).toEqual(["health"]);
  });
});

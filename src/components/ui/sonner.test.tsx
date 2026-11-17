import { act, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { Toaster } from "./sonner";

describe("Toaster", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; sonner reads it for theme="system".
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {},
      dispatchEvent: () => false,
    }));
  });

  it("shows toasts at the bottom, away from the header's auth controls", async () => {
    // @ts-expect-error – position is not configurable; a caller trying "top-right" still gets bottom.
    render(<Toaster richColors closeButton position="top-right" />);

    act(() => void toast.success("Signed out"));

    const item = await screen.findByText("Signed out");
    const list = item.closest("[data-sonner-toaster]");
    expect(list).toHaveAttribute("data-y-position", "bottom");
  });
});

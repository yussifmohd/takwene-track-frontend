import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, useLocation } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { usePageParam } from "./usePageParam";

function setup(url: string) {
  let result: { page: number; setPage: (n: number) => void; search: string } | undefined;
  function Probe() {
    const [page, setPage] = usePageParam();
    result = { page, setPage, search: useLocation().search };
    return null;
  }
  const router = createMemoryRouter([{ path: "/artists", element: <Probe /> }], { initialEntries: [url] });
  renderHook(() => null, { wrapper: ({ children }: { children: ReactNode }) => <><RouterProvider router={router} />{children}</> });
  return { get: () => result!, router };
}

describe("usePageParam", () => {
  it.each([
    ["/artists", 1],
    ["/artists?page=3", 3],
    ["/artists?page=0", 1],
    ["/artists?page=-2", 1],
    ["/artists?page=abc", 1],
    ["/artists?page=2.5", 1],
    ["/artists?page=99999999999999999999", 1],
  ])("%s → page %i", (url, expected) => {
    expect(setup(url).get().page).toBe(expected);
  });

  it("writes the page to the address and drops it for page 1", () => {
    const view = setup("/artists");
    act(() => view.get().setPage(2));
    expect(view.get().search).toBe("?page=2");
    act(() => view.get().setPage(1));
    expect(view.get().search).toBe("");
  });
});

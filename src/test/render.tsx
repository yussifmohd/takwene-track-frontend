import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";

export function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
}

/** Renders a component with a fresh QueryClient and a memory router. */
export function renderWithProviders(ui: ReactElement, { route = "/", ...options }: RenderOptions & { route?: string } = {}) {
  return renderRoutes([{ path: "*", element: ui }], { route, ...options });
}

/** Renders a route tree (e.g. the app's routes) at a given URL. */
export function renderRoutes(routes: RouteObject[], { route = "/", ...options }: RenderOptions & { route?: string } = {}) {
  const queryClient = createTestQueryClient();
  const router = createMemoryRouter(routes, { initialEntries: [route] });
  const user = userEvent.setup();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
    options,
  );
  return { ...result, user, queryClient, router };
}

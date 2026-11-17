import { createBrowserRouter, type RouteObject } from "react-router";
import { AppShell } from "@/components/AppShell";
import { NotFoundPage } from "@/components/NotFoundPage";
import { RequireAuth, type AuthRouteHandle } from "@/features/auth/components/RequireAuth";
import { AccountPage } from "@/features/auth/pages/AccountPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { HomePage } from "@/pages/HomePage";

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      {
        element: <RequireAuth />,
        handle: { requiresAuth: true } satisfies AuthRouteHandle,
        children: [{ path: "account", element: <AccountPage /> }],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

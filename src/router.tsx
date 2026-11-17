import { createBrowserRouter, type RouteObject } from "react-router";
import { AppShell } from "@/components/AppShell";
import { NotFoundPage } from "@/components/NotFoundPage";
import { HomePage } from "@/pages/HomePage";

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

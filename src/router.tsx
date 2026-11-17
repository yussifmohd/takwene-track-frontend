import { createBrowserRouter, type RouteObject } from "react-router";
import { AppShell } from "@/components/AppShell";
import { NotFoundPage } from "@/components/NotFoundPage";
import { RequireAuth, type AuthRouteHandle } from "@/features/auth/components/RequireAuth";
import { ArtistsPage } from "@/features/artists/pages/ArtistsPage";
import { NewArtistPage } from "@/features/artists/pages/NewArtistPage";
import { AccountPage } from "@/features/auth/pages/AccountPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { NewTrackPage } from "@/features/tracks/pages/NewTrackPage";
import { TrackDetailPage } from "@/features/tracks/pages/TrackDetailPage";
import { TracksPage } from "@/features/tracks/pages/TracksPage";
import { StatusPage } from "@/pages/StatusPage";

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <TracksPage /> },
      { path: "status", element: <StatusPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "artists", element: <ArtistsPage /> },
      { path: "tracks/:id", element: <TrackDetailPage /> },
      {
        element: <RequireAuth />,
        handle: { requiresAuth: true } satisfies AuthRouteHandle,
        children: [
          { path: "account", element: <AccountPage /> },
          {
            path: "artists/new",
            element: <NewArtistPage />,
            handle: {
              requiresRole: {
                role: "Admin",
                deniedTitle: "Only admins can add artists",
                backTo: { path: "/artists", label: "Back to artists" },
              },
            } satisfies AuthRouteHandle,
          },
          {
            path: "tracks/new",
            element: <NewTrackPage />,
            handle: {
              requiresRole: {
                role: "Admin",
                deniedTitle: "Only admins can add tracks",
                backTo: { path: "/", label: "Back to tracks" },
              },
            } satisfies AuthRouteHandle,
          },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);

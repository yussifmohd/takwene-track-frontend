import { NavLink, Outlet } from "react-router";
import { AuthMenu } from "@/features/auth/components/AuthMenu";
import { SessionWatcher } from "@/features/auth/components/SessionWatcher";
import { cn } from "@/lib/utils";
import { useIsAuthenticated } from "@/stores/authStore";
import { BrandMark } from "./BrandMark";

const COMING_SOON = ["Tracks", "Artists"] as const;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "whitespace-nowrap rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-muted",
    isActive && "bg-muted text-foreground shadow-[inset_0_-2px_0_var(--accent)]",
  );

export function AppShell() {
  const isAuthenticated = useIsAuthenticated();
  return (
    <div className="min-h-dvh">
      <SessionWatcher />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap">
          <NavLink to="/" className="flex items-center gap-3 rounded-md">
            <BrandMark className="size-8" />
            <span className="leading-tight">
              <span className="block font-semibold">Track Management</span>
              <span className="block text-xs text-muted-foreground">Takwene distribution</span>
            </span>
          </NavLink>
          <nav aria-label="Main" className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-1 overflow-x-auto px-3 text-sm sm:mx-0 sm:w-auto sm:px-0">
            <NavLink to="/" end className={navLinkClass}>
              Status
            </NavLink>
            {COMING_SOON.map((label) => (
              <span
                key={label}
                aria-disabled="true"
                title="Coming soon"
                className="cursor-not-allowed whitespace-nowrap rounded-md px-3 py-1.5 text-muted-foreground"
              >
                {label}
                <span className="sr-only"> (coming soon)</span>
                <span aria-hidden className="ml-1.5 hidden rounded-full bg-muted px-1.5 py-px text-[0.6875rem] sm:inline">
                  soon
                </span>
              </span>
            ))}
            {isAuthenticated ? (
              <NavLink to="/account" className={navLinkClass}>
                My account
              </NavLink>
            ) : null}
          </nav>
          <div className="ml-auto">
            <AuthMenu />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 outline-none sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

const COMING_SOON = ["Tracks", "Artists"] as const;

export function AppShell() {
  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-3 rounded-md">
            <BrandMark className="size-8" />
            <span className="leading-tight">
              <span className="block font-semibold">Track Management</span>
              <span className="block text-xs text-muted-foreground">Takwene distribution</span>
            </span>
          </NavLink>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors hover:bg-muted",
                  isActive && "bg-muted text-foreground shadow-[inset_0_-2px_0_var(--accent)]",
                )
              }
            >
              Status
            </NavLink>
            {COMING_SOON.map((label) => (
              <span
                key={label}
                aria-disabled="true"
                title="Coming soon"
                className="cursor-not-allowed rounded-md px-3 py-1.5 text-muted-foreground"
              >
                {label} <span className="text-xs">(coming soon)</span>
              </span>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 outline-none sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

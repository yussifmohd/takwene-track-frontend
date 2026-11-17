import { LogIn, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuthStore, useSession } from "@/stores/authStore";
import { loginPathFor } from "../redirect";

/** Header control: "Sign in" (with a return address) or the signed-in email + "Sign out". */
export function AuthMenu() {
  const session = useSession();
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();

  if (!session) {
    if (location.pathname === "/login") return null;
    return (
      <Button asChild variant="outline" size="sm">
        <Link to={loginPathFor(`${location.pathname}${location.search}`)}>
          <LogIn aria-hidden />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:inline" dir="ltr" title={session.email}>
        {session.email}
      </span>
      <Button variant="outline" size="sm" onClick={() => signOut("manual")}>
        <LogOut aria-hidden />
        Sign out
      </Button>
    </div>
  );
}

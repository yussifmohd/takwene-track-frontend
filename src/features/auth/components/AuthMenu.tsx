import { LogIn, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore, useIsAuthenticated, useSession } from "@/stores/authStore";
import { useRequiresAuth } from "../hooks/useRequiresAuth";
import { loginPathFor } from "../redirect";

/** Header control: "Sign in" (with a return address) or the signed-in email + "Sign out". */
export function AuthMenu() {
  const isAuthenticated = useIsAuthenticated();
  const session = useSession();
  const signOut = useAuthStore((s) => s.signOut);
  const location = useLocation();
  const navigate = useNavigate();
  const onProtectedPage = useRequiresAuth();

  if (!isAuthenticated || !session) {
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

  const handleSignOut = async () => {
    // Leave a protected page first, so the guard does not send us to the sign-in page. flushSync
    // commits the new page before the sign-out renders (navigations are otherwise transitions,
    // which the synchronous store update would overtake).
    if (onProtectedPage) await navigate("/", { replace: true, flushSync: true });
    signOut("manual");
    toast.success("Signed out");
  };

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="hidden min-w-0 truncate text-sm text-muted-foreground sm:inline" dir="ltr" title={session.email}>
        {session.email}
      </span>
      <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
        <LogOut aria-hidden />
        Sign out
      </Button>
    </div>
  );
}

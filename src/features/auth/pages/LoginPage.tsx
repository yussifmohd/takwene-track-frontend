import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { getFieldErrors, isApiError } from "@/api/problem";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsAuthenticated } from "@/stores/authStore";
import { useLoginMutation } from "../hooks/useLoginMutation";
import { safeRedirect } from "../redirect";
import { SIGN_OUT_MESSAGES, type SignOutNavigationState } from "../signOutDestination";
import { loginSchema, type LoginValues } from "../schemas";

const UNLOCKS = [
  "Add tracks with their ISRC, genre and release date",
  "Move tracks from draft to submitted to distributed",
  "Add artists and see their contact emails",
] as const;

/** One sentence for whatever went wrong, without revealing which part of the credentials failed. */
function describeLoginError(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Try again.";
  if (error.isNetworkError)
    return "Can't reach the server. Check that the API is running, then try again.";
  if (error.status === 401) return "Invalid email or password.";
  if (error.status === 429) {
    return error.retryAfterSeconds
      ? `Too many sign-in attempts. Try again in ${error.retryAfterSeconds} seconds.`
      : "Too many sign-in attempts. Try again in a minute.";
  }
  return error.problem.detail ?? "Sign-in failed. Try again.";
}

export function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const signOutReason = (useLocation().state as SignOutNavigationState | null)?.signOutReason;
  const signOutMessage = signOutReason ? SIGN_OUT_MESSAGES[signOutReason] : undefined;
  const isAuthenticated = useIsAuthenticated();
  const mutation = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    setFocus,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Already signed in (or just signed in): go to the return address.
  if (isAuthenticated) return <Navigate to={redirectTo} replace />;

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values, {
      onError: (error) => {
        const fieldErrors = getFieldErrors(error);
        if (
          isApiError(error) &&
          error.status === 400 &&
          (fieldErrors.email || fieldErrors.password)
        ) {
          if (fieldErrors.email)
            setError(
              "email",
              { message: fieldErrors.email },
              { shouldFocus: true },
            );
          if (fieldErrors.password)
            setError(
              "password",
              { message: fieldErrors.password },
              { shouldFocus: !fieldErrors.email },
            );
          return;
        }
        setFormError(describeLoginError(error));
        if (isApiError(error) && error.status === 401) {
          resetField("password");
          setFocus("password");
        }
      },
    });
  });

  const pending = mutation.isPending;

  return (
    <section aria-labelledby="login-title">
      <h1 id="login-title" className="text-3xl font-semibold tracking-tight">
        Sign in
      </h1>
      <p className="mt-2 text-muted-foreground">
        Use the Takwene admin account.
      </p>
      {signOutMessage ? (
        <p role="status" className="mt-4 max-w-xl rounded-md border bg-muted px-3 py-2 text-sm">
          {signOutMessage}
        </p>
      ) : null}

      <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] md:items-start md:gap-16">
        <Card className="py-0">
          <CardContent className="py-6">
            <form
              noValidate
              onSubmit={onSubmit}
              className="grid gap-5"
              aria-describedby={formError ? "login-error" : undefined}
            >
              {formError ? (
                <p
                  id="login-error"
                  role="alert"
                  className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  dir="ltr"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email ? (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  dir="ltr"
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  {...register("password")}
                />
                {errors.password ? (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>

              <Button
                type="submit"
                disabled={pending}
                className="w-full sm:w-auto sm:justify-self-start"
              >
                {pending ? (
                  <LoaderCircle aria-hidden className="animate-spin" />
                ) : null}
                {pending ? "Signing in" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside
          aria-labelledby="unlocks-title"
          className="border-l-2 border-accent py-1 pl-5"
        >
          <h2 id="unlocks-title" className="font-medium">
            What signing in unlocks
          </h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {UNLOCKS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Browsing the catalogue and its status stays open to everyone.
          </p>
        </aside>
      </div>
    </section>
  );
}

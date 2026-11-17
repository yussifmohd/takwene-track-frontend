import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { describeError, getFieldErrors, isApiError } from "@/api/problem";
import { PageHeader } from "@/components/PageHeader";
import { UserText } from "@/components/UserText";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelect } from "../components/CountrySelect";
import { useCreateArtistMutation } from "../hooks/useCreateArtistMutation";
import { createArtistSchema, NAME_MAX, type CreateArtistInput, type CreateArtistValues } from "../schemas";

const FIELDS = ["name", "countryCode", "email"] as const satisfies readonly FieldPath<CreateArtistInput>[];

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

export function NewArtistPage() {
  const navigate = useNavigate();
  const mutation = useCreateArtistMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateArtistInput, unknown, CreateArtistValues>({
    resolver: zodResolver(createArtistSchema),
    defaultValues: { name: "", countryCode: "", email: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values, {
      onSuccess: (artist) => {
        toast.success("Artist added", { description: <UserText>{artist.name}</UserText> });
        void navigate("/artists");
      },
      onError: (error) => {
        // 401 is handled globally (sign-out + redirect); nothing to show here.
        if (isApiError(error) && error.status === 401) return;
        const fieldErrors = getFieldErrors(error);
        const known = FIELDS.filter((field) => fieldErrors[field]);
        if (known.length > 0) {
          known.forEach((field, index) => setError(field, { message: fieldErrors[field] }, { shouldFocus: index === 0 }));
          return;
        }
        const { title, detail } = describeError(error);
        setFormError(detail ? `${title}. ${detail}` : title);
      },
    });
  });

  const pending = mutation.isPending;
  const describedBy = (field: (typeof FIELDS)[number], hint?: string) =>
    [errors[field] ? `${field}-error` : null, hint].filter(Boolean).join(" ") || undefined;

  return (
    <>
      <PageHeader title="Add artist" description="Artists can then be credited on tracks." />
      <Card className="max-w-xl py-0">
        <CardContent className="py-6">
          <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-describedby={formError ? "form-error" : undefined}>
            {formError ? (
              <p
                id="form-error"
                role="alert"
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                dir="auto"
                autoComplete="off"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={describedBy("name", "name-hint")}
                {...register("name")}
              />
              <p id="name-hint" className="text-xs text-muted-foreground">
                As it should appear on platforms, in any script. Up to {NAME_MAX} characters.
              </p>
              <FieldError id="name-error" message={errors.name?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="countryCode">Country</Label>
              <CountrySelect
                id="countryCode"
                aria-invalid={errors.countryCode ? true : undefined}
                aria-describedby={describedBy("countryCode")}
                {...register("countryCode")}
              />
              <FieldError id="countryCode-error" message={errors.countryCode?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                dir="ltr"
                autoComplete="off"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy("email", "email-hint")}
                {...register("email")}
              />
              <p id="email-hint" className="text-xs text-muted-foreground">
                Contact address for the artist. Only admins see it.
              </p>
              <FieldError id="email-error" message={errors.email?.message} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
                {pending ? "Adding artist" : "Add artist"}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/artists">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

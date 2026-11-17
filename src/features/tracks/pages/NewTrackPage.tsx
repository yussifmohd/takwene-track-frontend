import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, type FieldPath } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { describeError, getFieldErrors, isApiError } from "@/api/problem";
import { PageHeader } from "@/components/PageHeader";
import { UserText } from "@/components/UserText";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArtistPicker } from "@/features/artists/components/ArtistPicker";
import { GENRES } from "../catalog";
import { useCreateTrackMutation } from "../hooks/useTrackQueries";
import { ISRC_EXAMPLE, ISRC_FORMAT } from "../isrc";
import { createTrackSchema, MAX_RELEASE_DATE, MIN_RELEASE_DATE, TITLE_MAX, type CreateTrackInput, type CreateTrackValues } from "../schemas";

const FIELDS = ["title", "artistId", "isrc", "genre", "releaseDate"] as const satisfies readonly FieldPath<CreateTrackInput>[];

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null;
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

export function NewTrackPage() {
  const navigate = useNavigate();
  const mutation = useCreateTrackMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [artistName, setArtistName] = useState<string | undefined>();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CreateTrackInput, unknown, CreateTrackValues>({
    resolver: zodResolver(createTrackSchema),
    defaultValues: { title: "", artistId: "", isrc: "", genre: "", releaseDate: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    mutation.mutate(values, {
      onSuccess: (track) => {
        toast.success("Track added", { description: <UserText>{track.title}</UserText> });
        void navigate(`/tracks/${track.id}`);
      },
      onError: (error) => {
        // 401 is handled globally (sign-out + redirect back here); nothing to show.
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
      <PageHeader title="Add track" description="New tracks start as drafts. Submit them from the track's page." />
      <Card className="max-w-xl py-0">
        <CardContent className="py-6">
          <form noValidate onSubmit={onSubmit} className="grid gap-5" aria-describedby={formError ? "form-error" : undefined}>
            {formError ? (
              <p id="form-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                dir="auto"
                autoComplete="off"
                aria-invalid={errors.title ? true : undefined}
                aria-describedby={describedBy("title", "title-hint")}
                {...register("title")}
              />
              <p id="title-hint" className="text-xs text-muted-foreground">
                As it should appear on platforms, in any script. Up to {TITLE_MAX} characters.
              </p>
              <FieldError id="title-error" message={errors.title?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="artistId">Artist</Label>
              <Controller
                control={control}
                name="artistId"
                render={({ field }) => (
                  <ArtistPicker
                    id="artistId"
                    inputRef={field.ref}
                    value={field.value || undefined}
                    selectedName={artistName}
                    onChange={(artist) => {
                      setArtistName(artist?.name);
                      field.onChange(artist?.id ?? "");
                    }}
                    aria-invalid={errors.artistId ? true : undefined}
                    aria-describedby={describedBy("artistId", "artistId-hint")}
                  />
                )}
              />
              <p id="artistId-hint" className="text-xs text-muted-foreground">
                Type part of the name, in any script, then pick the artist.
              </p>
              <FieldError id="artistId-error" message={errors.artistId?.message} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="isrc">ISRC</Label>
              <Input
                id="isrc"
                dir="ltr"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder={ISRC_EXAMPLE}
                aria-invalid={errors.isrc ? true : undefined}
                aria-describedby={describedBy("isrc", "isrc-hint")}
                {...register("isrc")}
              />
              <p id="isrc-hint" className="text-xs text-muted-foreground">
                {ISRC_FORMAT}, with or without hyphens. Each ISRC can be used by one track only.
              </p>
              <FieldError id="isrc-error" message={errors.isrc?.message} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid content-start gap-2">
                <Label htmlFor="genre">Genre</Label>
                <select
                  id="genre"
                  className={selectClass}
                  aria-invalid={errors.genre ? true : undefined}
                  aria-describedby={describedBy("genre")}
                  {...register("genre")}
                >
                  <option value="">Choose a genre</option>
                  {GENRES.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
                <FieldError id="genre-error" message={errors.genre?.message} />
              </div>

              <div className="grid content-start gap-2">
                <Label htmlFor="releaseDate">Release date</Label>
                <Input
                  id="releaseDate"
                  type="date"
                  min={MIN_RELEASE_DATE}
                  max={MAX_RELEASE_DATE}
                  aria-invalid={errors.releaseDate ? true : undefined}
                  aria-describedby={describedBy("releaseDate", "releaseDate-hint")}
                  {...register("releaseDate")}
                />
                <p id="releaseDate-hint" className="text-xs text-muted-foreground">
                  Future dates are fine.
                </p>
                <FieldError id="releaseDate-error" message={errors.releaseDate?.message} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? <LoaderCircle aria-hidden className="animate-spin" /> : null}
                {pending ? "Adding track" : "Add track"}
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

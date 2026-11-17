import { X } from "lucide-react";
import { useId, useState, type KeyboardEvent, type Ref } from "react";
import type { Artist } from "@/api/artists";
import { describeError } from "@/api/problem";
import { UserText } from "@/components/UserText";
import { Skeleton } from "@/components/ui/skeleton";
import { countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { useArtistSearch } from "../hooks/useArtistLookup";

export interface ArtistPickerProps {
  id: string;
  /** Selected artist id. */
  value: string | undefined;
  /** Name of the selected artist, when known (shown in the field). */
  selectedName?: string;
  onChange: (artist: Pick<Artist, "id" | "name"> | null) => void;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /** Show a button that clears the selection (filters). */
  clearable?: boolean;
}

/**
 * Pick an artist by typing part of the name (WAI-ARIA combobox with a listbox popup). Focusing the
 * empty field lists the first 10 artists by name; typing searches the API (debounced). Arrow keys move,
 * Enter picks, Escape closes. The value is the artist id; the field shows the name.
 */
export function ArtistPicker({
  id,
  value,
  selectedName,
  onChange,
  placeholder = "Type an artist's name",
  inputRef,
  clearable,
  ...aria
}: ArtistPickerProps) {
  const listId = useId();
  // Text the user is typing; null when not typing. The field otherwise shows the selected artist's
  // name, derived from the props on every render – no copy to keep in sync, so an update from outside
  // (e.g. "Clear filters" changing the address) can never be overwritten by a stale one.
  const [typed, setTyped] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const text = typed ?? (value ? (selectedName ?? "") : "");
  const term = typed ?? "";
  const search = useArtistSearch(term, open);
  const options = search.data?.items ?? [];

  const pick = (artist: Artist) => {
    onChange({ id: artist.id, name: artist.name });
    setTyped(null);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((current) => Math.min(current + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      if (open && active >= 0 && options[active]) {
        event.preventDefault(); // pick, don't submit the form
        pick(options[active]);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  const activeId = open && active >= 0 && options[active] ? `${listId}-${options[active].id}` : undefined;

  return (
    <div className="relative">
      <input
        id={id}
        ref={inputRef}
        type="text"
        role="combobox"
        dir="auto"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeId}
        aria-invalid={aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setTyped(event.target.value);
          setOpen(true);
          setActive(-1);
          if (value) onChange(null); // typing replaces the selection
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
          setTyped(null); // unpicked text is dropped; the field shows the selection again
        }}
        onKeyDown={onKeyDown}
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm",
          clearable && value ? "pe-9" : undefined,
        )}
      />
      {clearable && value ? (
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setTyped(null);
          }}
          className="absolute end-1.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Clear artist"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
      {open ? (
        // mousedown would blur the input before the click lands
        <div
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          onMouseDown={(event) => event.preventDefault()}
        >
          <ul id={listId} role="listbox" aria-label="Artists">
            {options.map((artist, index) => (
              <li
                key={artist.id}
                id={`${listId}-${artist.id}`}
                role="option"
                aria-selected={artist.id === value}
                onClick={() => pick(artist)}
                onMouseMove={() => setActive(index)}
                className={cn(
                  "flex cursor-pointer items-baseline justify-between gap-3 rounded-sm px-2 py-1.5 text-sm",
                  index === active && "bg-highlight ring-2 ring-inset ring-ring",
                  artist.id === value && "font-medium",
                )}
              >
                <UserText className="break-words">{artist.name}</UserText>
                <span className="shrink-0 text-xs text-muted-foreground">{countryName(artist.countryCode)}</span>
              </li>
            ))}
          </ul>
          {search.isPending ? (
            <div className="grid gap-2 p-2" aria-hidden>
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : null}
          <p role="status" className={cn("px-2 py-1.5 text-sm text-muted-foreground", !search.isError && options.length > 0 && "sr-only")}>
            {search.isPending
              ? "Searching artists"
              : search.isError
                ? `Couldn't load artists. ${describeError(search.error).title}.`
                : options.length === 0
                  ? term.trim()
                    ? `No artists match “${term.trim()}”.`
                    : "No artists yet."
                  : `${options.length} ${options.length === 1 ? "artist" : "artists"} found.`}
          </p>
        </div>
      ) : null}
    </div>
  );
}

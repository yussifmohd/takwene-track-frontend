import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * The app's only select: a real `<select>`, so keyboard use (arrows, type-ahead, Enter, Escape), screen
 * readers, phones and forms behave as the browser defines them. Its look, including the open list, lives
 * in one place in `src/index.css` ("Selects"): Chromium's customizable select where supported, themed
 * native options everywhere else.
 */
function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { NativeSelect };

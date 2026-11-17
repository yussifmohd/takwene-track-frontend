import type { ComponentPropsWithoutRef } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { cn } from "@/lib/utils";

/**
 * A native select of country names (type a letter to jump, works with screen readers and on phones);
 * the value is the ISO code the API expects.
 */
export function CountrySelect({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    >
      <option value="">Choose a country</option>
      {COUNTRY_OPTIONS.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  );
}

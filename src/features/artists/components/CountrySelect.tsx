import type { ComponentPropsWithoutRef } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { NativeSelect } from "@/components/ui/native-select";

/**
 * A native select of country names (type a letter to jump, works with screen readers and on phones);
 * the value is the ISO code the API expects.
 */
export function CountrySelect(props: ComponentPropsWithoutRef<"select">) {
  return (
    <NativeSelect {...props}>
      {/* The prompt, not a choice: shown until a country is picked, never selectable. */}
      <option value="" disabled>
        Choose a country
      </option>
      {COUNTRY_OPTIONS.map(({ code, name }) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </NativeSelect>
  );
}

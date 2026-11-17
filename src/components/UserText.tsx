import type { ComponentPropsWithoutRef, ElementType } from "react";

type UserTextProps<T extends ElementType> = { as?: T } & Omit<ComponentPropsWithoutRef<T>, "as" | "dir">;

/**
 * Renders text entered by users (titles, artist names) with dir="auto", so Arabic shows
 * right-to-left inside the English LTR interface (FR-010).
 */
export function UserText<T extends ElementType = "span">({ as, ...props }: UserTextProps<T>) {
  const Component = as ?? "span";
  return <Component dir="auto" {...props} />;
}

import type { ReactNode } from "react";

/** A short sentence about why there is nothing here, and (optionally) what to do about it. */
export function EmptyState({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed px-6 py-10">
      <p className="font-medium">{title}</p>
      {description ? <p className="max-w-prose text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

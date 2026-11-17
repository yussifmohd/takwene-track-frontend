import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="max-w-prose">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

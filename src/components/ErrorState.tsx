import { RotateCw, WifiOff } from "lucide-react";
import { describeError } from "@/api/problem";
import { Button } from "@/components/ui/button";

export function ErrorState({ error, onRetry, retrying }: { error: unknown; onRetry?: () => void; retrying?: boolean }) {
  const { title, detail } = describeError(error);
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-2 text-destructive">
        <WifiOff aria-hidden className="size-5" />
        <p className="font-medium">{title}</p>
      </div>
      {detail ? <p className="max-w-prose text-sm text-muted-foreground">{detail}</p> : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          <RotateCw aria-hidden className={retrying ? "animate-spin" : undefined} />
          {retrying ? "Retrying" : "Retry"}
        </Button>
      ) : null}
    </div>
  );
}

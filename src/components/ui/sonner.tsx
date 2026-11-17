import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: Omit<ToasterProps, "position">) => {
  return (
    <Sonner
      // Follows the OS colour scheme, like the rest of the app (no theme switcher).
      theme="system"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
      // Bottom, never top, and not overridable: a top toast covers the header's sign-in/sign-out
      // controls exactly when they change (e.g. "Signed out"), which looked like a half-rendered menu.
      position="bottom-right"
    />
  )
}

export { Toaster }

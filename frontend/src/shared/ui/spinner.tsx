import * as React from "react"
import { cn } from "@/shared/lib/utils"

const Spinner = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("animate-spin", className)}
    {...props}
  >
    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent" />
  </div>
))
Spinner.displayName = "Spinner"

export { Spinner }

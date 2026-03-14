"use client"

import { cn } from "@/lib/utils"

interface QuotaDisplayProps {
  used: number
  limit: number
  className?: string
  variant?: "default" | "compact"
}

export function QuotaDisplay({
  used,
  limit,
  className,
  variant = "default",
}: QuotaDisplayProps) {
  const remaining = Math.max(0, limit - used)
  const percentage = Math.min(100, (used / limit) * 100)
  const isLow = remaining <= 10
  const isExhausted = remaining === 0

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <span
          className={cn(
            "font-medium",
            isExhausted
              ? "text-destructive"
              : isLow
                ? "text-amber-600 dark:text-amber-500"
                : "text-muted-foreground"
          )}
        >
          {remaining}/{limit}
        </span>
        <span className="text-muted-foreground">validations left</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Daily quota</span>
        <span
          className={cn(
            "font-medium",
            isExhausted
              ? "text-destructive"
              : isLow
                ? "text-amber-600 dark:text-amber-500"
                : "text-foreground"
          )}
        >
          {remaining} of {limit} remaining
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isExhausted
              ? "bg-destructive"
              : isLow
                ? "bg-amber-500"
                : "bg-primary"
          )}
          style={{ width: `${100 - percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Resets daily at midnight CET
      </p>
    </div>
  )
}

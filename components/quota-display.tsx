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
  const isLow = percentage >= 80
  const isExhausted = remaining === 0

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm glass-subtle",
          className
        )}
      >
        <div className="relative h-2 w-16 overflow-hidden rounded-full bg-muted/50">
          <div
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-500",
              isExhausted
                ? "bg-destructive"
                : isLow
                  ? "bg-amber-500"
                  : "bg-primary"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span
          className={cn(
            "font-medium tabular-nums",
            isExhausted
              ? "text-destructive"
              : isLow
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground"
          )}
        >
          {used}/{limit}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl bg-muted/30 backdrop-blur-sm p-4 ring-1 ring-border/30",
        className
      )}
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Daily quota</span>
        <span
          className={cn(
            "font-medium tabular-nums",
            isExhausted
              ? "text-destructive"
              : isLow
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground"
          )}
        >
          {used} of {limit} used
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/50">
        <div
          className={cn(
            "absolute left-0 top-0 h-full transition-all duration-500 rounded-full",
            isExhausted
              ? "bg-destructive"
              : isLow
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-primary to-blue-400"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground/80">
        Resets daily at midnight CET
      </p>
    </div>
  )
}

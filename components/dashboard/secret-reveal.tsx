"use client"

import { Button } from "@/components/ui/button"
import { Copy, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface SecretRevealProps {
  apiKey: string
  secret: string
}

export function SecretReveal({ apiKey, secret }: SecretRevealProps) {
  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow-600" />
        <p className="text-sm text-yellow-700 dark:text-yellow-400">
          Copy your secret now. For security, it cannot be displayed again.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            API Key
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-border bg-muted px-3 py-2 text-xs font-mono break-all">
              {apiKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => copy(apiKey, "API Key")}
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Secret
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded border border-border bg-muted px-3 py-2 text-xs font-mono break-all">
              {secret}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={() => copy(secret, "Secret")}
            >
              <Copy size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

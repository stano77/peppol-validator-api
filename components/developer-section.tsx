"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronDown,
  Code2,
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Play,
  Terminal,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { User } from "@supabase/supabase-js"

interface ApiKeyData {
  id: string
  name: string
  key: string
  usage_count: number
  max_usage: number
  is_active: boolean
  created_at: string
}

interface DeveloperSectionProps {
  user: User | null
  onAuthRequired: () => void
}

type CodeLanguage = "curl" | "nodejs" | "python"

export function DeveloperSection({ user, onAuthRequired }: DeveloperSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [apiKey, setApiKey] = useState<ApiKeyData | null>(null)
  const [apiSecret, setApiSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<CodeLanguage>("curl")

  // API Playground state
  const [testXml, setTestXml] = useState(`<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <!-- Your PEPPOL invoice XML here -->
</Invoice>`)
  const [playgroundResult, setPlaygroundResult] = useState<string | null>(null)
  const [isPlaygroundLoading, setIsPlaygroundLoading] = useState(false)

  useEffect(() => {
    if (isExpanded && user && !apiKey) {
      fetchApiKey()
    }
  }, [isExpanded, user])

  const fetchApiKey = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/v1/keys")
      const data = await res.json()
      setApiKey(data.apiKey)
    } catch (error) {
      console.error("Failed to fetch API key")
    } finally {
      setIsLoading(false)
    }
  }

  const createApiKey = async () => {
    if (!user) {
      onAuthRequired()
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch("/api/v1/keys", { method: "POST" })
      const data = await res.json()
      if (data.apiKey) {
        setApiKey(data.apiKey)
        setApiSecret(data.secret)
        setShowSecret(true)
      }
    } catch (error) {
      console.error("Failed to create API key")
    } finally {
      setIsCreating(false)
    }
  }

  const revokeApiKey = async () => {
    setIsDeleting(true)
    try {
      await fetch("/api/v1/keys", { method: "DELETE" })
      setApiKey(null)
      setApiSecret(null)
    } catch (error) {
      console.error("Failed to revoke API key")
    } finally {
      setIsDeleting(false)
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const runPlayground = async () => {
    if (!apiKey || !apiSecret) {
      setPlaygroundResult("Error: API key and secret required. Create one above.")
      return
    }

    setIsPlaygroundLoading(true)
    setPlaygroundResult(null)

    try {
      const res = await fetch("/api/v1/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
          "X-API-Key": apiKey.key,
          "X-API-Secret": apiSecret,
        },
        body: testXml,
      })
      const data = await res.json()
      setPlaygroundResult(JSON.stringify(data, null, 2))

      // Refresh key to get updated usage
      fetchApiKey()
    } catch (error) {
      setPlaygroundResult(`Error: ${error instanceof Error ? error.message : "Request failed"}`)
    } finally {
      setIsPlaygroundLoading(false)
    }
  }

  const getCodeSnippet = (lang: CodeLanguage): string => {
    const key = apiKey?.key || "YOUR_API_KEY"
    const secret = apiSecret || "YOUR_API_SECRET"

    switch (lang) {
      case "curl":
        return `curl -X POST \\
  "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/validate" \\
  -H "Content-Type: application/xml" \\
  -H "X-API-Key: ${key}" \\
  -H "X-API-Secret: ${secret}" \\
  -d @invoice.xml`

      case "nodejs":
        return `const response = await fetch("${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/validate", {
  method: "POST",
  headers: {
    "Content-Type": "application/xml",
    "X-API-Key": "${key}",
    "X-API-Secret": "${secret}",
  },
  body: xmlContent, // Your UBL XML string
});

const result = await response.json();
console.log(result);`

      case "python":
        return `import requests

response = requests.post(
    "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/v1/validate",
    headers={
        "Content-Type": "application/xml",
        "X-API-Key": "${key}",
        "X-API-Secret": "${secret}",
    },
    data=xml_content,  # Your UBL XML string
)

result = response.json()
print(result)`

      default:
        return ""
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="mx-auto max-w-2xl px-1"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full glass-subtle rounded-2xl p-4 flex items-center justify-between hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Code2 className="h-4 w-4" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">For Developers</h3>
            <p className="text-sm text-muted-foreground">API access for build or run time validation</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-6">
              {/* API Key Management */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Key className="h-4 w-4 text-primary shrink-0" />
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">API Credentials</h4>
                </div>

                {!user ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Sign in to create an API key</p>
                    <Button onClick={onAuthRequired} size="sm">Sign In</Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : apiKey ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {/* API Key */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Key</label>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <code className="block rounded-lg bg-muted/50 px-2 py-2 text-[10px] sm:text-xs font-mono truncate">
                              {apiKey.key}
                            </code>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                            onClick={() => copyToClipboard(apiKey.key, "key")}
                          >
                            {copiedField === "key" ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* API Secret */}
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">API Secret</label>
                        {apiSecret ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <code className="block rounded-lg bg-muted/50 px-2 py-2 text-[10px] sm:text-xs font-mono truncate">
                                  {showSecret ? apiSecret : "•".repeat(16)}
                                </code>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => setShowSecret(!showSecret)}
                              >
                                {showSecret ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() => copyToClipboard(apiSecret, "secret")}
                              >
                                {copiedField === "secret" ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                            </div>
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 leading-relaxed">
                                Save this secret now. It won't be shown again.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-muted-foreground italic">
                            Secret hidden. Regenerate key to get a new secret.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Usage & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {apiKey.usage_count} / {apiKey.max_usage} requests
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createApiKey}
                          disabled={isCreating}
                          className="gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          <span className="hidden sm:inline">Regenerate</span>
                          <span className="sm:hidden">New</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={revokeApiKey}
                          disabled={isDeleting}
                          className="text-destructive hover:text-destructive gap-1.5 flex-1 sm:flex-none text-xs sm:text-sm"
                        >
                          {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">No API key yet</p>
                    <Button onClick={createApiKey} disabled={isCreating} size="sm" className="gap-1.5">
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                      Create API Key
                    </Button>
                  </div>
                )}
              </div>

              {/* Code Snippets */}
              <div className="glass rounded-2xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Terminal className="h-4 w-4 text-primary shrink-0" />
                  <h4 className="font-semibold text-foreground text-sm sm:text-base">Integration</h4>
                </div>

                {/* Language Tabs */}
                <div className="flex gap-1 p-1 bg-muted/50 rounded-lg mb-4 w-full sm:w-fit overflow-x-auto">
                  {(["curl", "nodejs", "python"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap flex-1 sm:flex-none ${selectedLanguage === lang
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {lang === "curl" ? "cURL" : lang === "nodejs" ? "Node.js" : "Python"}
                    </button>
                  ))}
                </div>

                {/* Code Block */}
                <div className="relative overflow-hidden">
                  <pre className="rounded-lg bg-muted/50 p-3 sm:p-4 text-[10px] sm:text-xs md:text-sm overflow-x-auto">
                    <code className="text-foreground font-mono whitespace-pre-wrap break-words">
                      {getCodeSnippet(selectedLanguage)}
                    </code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 sm:top-2 sm:right-2 h-7 w-7 sm:h-8 sm:w-8"
                    onClick={() => copyToClipboard(getCodeSnippet(selectedLanguage), "code")}
                  >
                    {copiedField === "code" ? <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : <Copy className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </Button>
                </div>
              </div>

              {/* API Playground */}
              {apiKey && apiSecret && (
                <div className="glass rounded-2xl p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <Play className="h-4 w-4 text-primary shrink-0" />
                    <h4 className="font-semibold text-foreground text-sm sm:text-base">API Playground</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Request Body (UBL XML)
                      </label>
                      <textarea
                        value={testXml}
                        onChange={(e) => setTestXml(e.target.value)}
                        className="w-full h-24 sm:h-32 rounded-lg bg-muted/50 px-2 sm:px-3 py-2 text-[10px] sm:text-xs md:text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Paste your UBL XML here..."
                      />
                    </div>

                    <Button
                      onClick={runPlayground}
                      disabled={isPlaygroundLoading}
                      size="sm"
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      {isPlaygroundLoading ? (
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      ) : (
                        <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                      Send Request
                    </Button>

                    {playgroundResult && (
                      <div className="overflow-hidden">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Response</label>
                        <pre className="rounded-lg bg-muted/50 p-3 sm:p-4 text-[10px] sm:text-xs md:text-sm overflow-x-auto max-h-64">
                          <code className="text-foreground font-mono whitespace-pre-wrap break-words">
                            {playgroundResult}
                          </code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* API Documentation Link */}
              <div className="text-center text-[10px] sm:text-xs text-muted-foreground px-1">
                <p className="leading-relaxed">
                  POST to <code className="px-1 py-0.5 rounded bg-muted/50 text-foreground text-[10px] sm:text-xs">/api/v1/validate</code>
                </p>
                <p className="mt-1 leading-relaxed">
                  Headers: <code className="px-1 py-0.5 rounded bg-muted/50 text-foreground text-[10px] sm:text-xs">X-API-Key</code>{" "}
                  <code className="px-1 py-0.5 rounded bg-muted/50 text-foreground text-[10px] sm:text-xs">X-API-Secret</code>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

"use client"

import { useState, useCallback } from "react"
import { Sparkles, Loader2, Copy, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ValidationResult } from "@/types/database"

interface AIAssistantProps {
  validationResult: ValidationResult
  xmlContent: string
  className?: string
}

export function AIAssistant({
  validationResult,
  xmlContent,
  className,
}: AIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedBlocks, setCopiedBlocks] = useState<Set<number>>(new Set())

  const analyzeErrors = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch("/api/v1/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xmlContent,
          validationResult,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to analyze errors")
      }

      // Parse SSE stream manually
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullContent = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith("data:")) {
            const data = trimmed.slice(5).trim()
            if (data === "[DONE]") continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === "text-delta" && parsed.delta) {
                fullContent += parsed.delta
                setAnalysis(fullContent)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsAnalyzing(false)
    }
  }, [xmlContent, validationResult])

  const copyCodeBlock = async (code: string, index: number) => {
    await navigator.clipboard.writeText(code)
    setCopiedBlocks((prev) => new Set(prev).add(index))
    setTimeout(() => {
      setCopiedBlocks((prev) => {
        const next = new Set(prev)
        next.delete(index)
        return next
      })
    }, 2000)
  }

  // Parse markdown to render with proper formatting
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n")
    const elements: JSX.Element[] = []
    let inCodeBlock = false
    let codeBlockContent = ""
    let codeBlockLang = ""
    let codeBlockIndex = 0

    lines.forEach((line, lineIndex) => {
      // Code block start/end
      if (line.startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          const currentIndex = codeBlockIndex
          elements.push(
            <div
              key={`code-${currentIndex}`}
              className="relative my-3 group"
            >
              <div className="flex items-center justify-between rounded-t-lg bg-muted/80 px-4 py-2 text-xs font-medium text-muted-foreground border border-border/50 border-b-0">
                <span>{codeBlockLang || "code"}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => copyCodeBlock(codeBlockContent.trim(), currentIndex)}
                >
                  {copiedBlocks.has(currentIndex) ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <pre className="overflow-x-auto rounded-b-lg bg-muted/50 p-4 text-sm border border-border/50 border-t-0">
                <code className={`language-${codeBlockLang}`}>
                  {codeBlockContent.trim()}
                </code>
              </pre>
            </div>
          )
          codeBlockContent = ""
          codeBlockLang = ""
          inCodeBlock = false
          codeBlockIndex++
        } else {
          // Start of code block
          codeBlockLang = line.slice(3).trim()
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeBlockContent += line + "\n"
        return
      }

      // Headers
      if (line.startsWith("## ")) {
        elements.push(
          <h2
            key={lineIndex}
            className="mt-6 mb-3 text-lg font-semibold text-foreground"
          >
            {line.slice(3)}
          </h2>
        )
        return
      }

      if (line.startsWith("### ")) {
        elements.push(
          <h3
            key={lineIndex}
            className="mt-4 mb-2 text-base font-semibold text-foreground"
          >
            {line.slice(4)}
          </h3>
        )
        return
      }

      // Bullet points
      if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={lineIndex} className="ml-4 text-sm text-foreground/90 leading-relaxed">
            {renderInlineMarkdown(line.slice(2))}
          </li>
        )
        return
      }

      // Numbered lists
      const numberedMatch = line.match(/^(\d+)\.\s/)
      if (numberedMatch) {
        elements.push(
          <li
            key={lineIndex}
            className="ml-4 text-sm text-foreground/90 leading-relaxed list-decimal"
          >
            {renderInlineMarkdown(line.slice(numberedMatch[0].length))}
          </li>
        )
        return
      }

      // Empty lines
      if (line.trim() === "") {
        elements.push(<div key={lineIndex} className="h-2" />)
        return
      }

      // Regular paragraphs
      elements.push(
        <p key={lineIndex} className="text-sm text-foreground/90 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      )
    })

    return elements
  }

  // Render inline markdown (bold, code, etc)
  const renderInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = []
    let remaining = text
    let keyIndex = 0

    while (remaining.length > 0) {
      // Bold
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      // Inline code
      const codeMatch = remaining.match(/`([^`]+)`/)

      if (boldMatch && (!codeMatch || boldMatch.index! <= codeMatch.index!)) {
        const before = remaining.slice(0, boldMatch.index)
        if (before) parts.push(before)
        parts.push(
          <strong key={keyIndex++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        )
        remaining = remaining.slice(boldMatch.index! + boldMatch[0].length)
      } else if (codeMatch) {
        const before = remaining.slice(0, codeMatch.index)
        if (before) parts.push(before)
        parts.push(
          <code
            key={keyIndex++}
            className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground"
          >
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.slice(codeMatch.index! + codeMatch[0].length)
      } else {
        parts.push(remaining)
        break
      }
    }

    return parts
  }

  const hasErrors =
    (validationResult.error_count ?? 0) > 0 ||
    (validationResult.warning_count ?? 0) > 0

  if (!hasErrors) {
    return null
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {!analysis && !isAnalyzing && (
        <Button
          onClick={analyzeErrors}
          disabled={isAnalyzing}
          variant="outline"
          className="gap-2 glass-subtle border-glass-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
        >
          <Sparkles className="h-4 w-4" />
          Analyze Errors with AI
        </Button>
      )}

      {isAnalyzing && !analysis && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-primary/5 p-6 ring-1 ring-primary/10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Analyzing your invoice errors...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-center text-sm text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {analysis && (
        <div className="rounded-xl glass p-5 ring-1 ring-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">AI Analysis</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={analyzeErrors}
              disabled={isAnalyzing}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isAnalyzing && "animate-spin")} />
              Re-analyze
            </Button>
          </div>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {renderMarkdown(analysis)}
          </div>
        </div>
      )}
    </div>
  )
}

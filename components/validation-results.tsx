"use client"

import { useState } from "react"
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileWarning,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ValidationResult, ValidationError } from "@/types/database"
import { AIAssistant } from "@/components/ai-assistant"

interface ValidationResultsProps {
  result: ValidationResult
  xmlContent?: string
  onValidateAnother: () => void
  className?: string
}

export function ValidationResults({
  result,
  xmlContent,
  onValidateAnother,
  className,
}: ValidationResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  )

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  // Handle potentially undefined/null values with defaults
  const errorCount = result.error_count ?? 0
  const warningCount = result.warning_count ?? 0
  // Derive isValid from error_count since upstream API doesn't return a 'valid' field
  const isValid = result.valid === true || (typeof result.valid === 'undefined' && errorCount === 0)

  // Get all errors and warnings from the response
  // The upstream API returns flat 'errors' and 'warnings' arrays, not split by validation type
  const allErrors = result.errors || result.xsd_errors || []
  const allWarnings = result.warnings || []

  // Combine all issues for display
  const allIssues = [
    ...allErrors.map((e: ValidationError | string) => typeof e === 'string' ? { message: e, severity: 'error' as const } : { ...e, severity: 'error' as const }),
    ...allWarnings.map((w: ValidationError | string) => typeof w === 'string' ? { message: w, severity: 'warning' as const } : { ...w, severity: 'warning' as const }),
  ]

  // Show combined issues if the API returns flat arrays
  const hasLegacySplitErrors = result.xsd_errors || result.business_rule_errors || result.schematron_errors

  // Build sections based on response format
  const sections = hasLegacySplitErrors ? [
    {
      id: "xsd",
      title: "XSD Schema Validation",
      errors: result.xsd_errors || [],
      description: "UBL 2.1 XML Schema conformance",
    },
    {
      id: "business",
      title: "EN 16931 Business Rules",
      errors: result.business_rule_errors || [],
      description: "European e-invoicing standard compliance",
    },
    {
      id: "schematron",
      title: "Peppol Schematron Rules",
      errors: result.schematron_errors || [],
      description: "Peppol BIS 3.0 specific validations",
    },
  ] : allIssues.length > 0 ? [
    {
      id: "all",
      title: "Validation Issues",
      errors: allIssues,
      description: result.document_type || "All validation checks",
    },
  ] : []
  
  // Show document type info when valid
  const documentType = result.document_type

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Summary Card */}
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-2xl p-8 text-center backdrop-blur-sm",
          isValid
            ? "bg-emerald-500/10 ring-1 ring-emerald-500/20"
            : "bg-destructive/10 ring-1 ring-destructive/20"
        )}
      >
        {isValid ? (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/15 ring-1 ring-destructive/25">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h3
            className={cn(
              "text-2xl font-semibold",
              isValid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
            )}
          >
            {isValid ? "Invoice is Valid" : "Validation Failed"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {errorCount} error{errorCount !== 1 ? "s" : ""},{" "}
            {warningCount} warning
            {warningCount !== 1 ? "s" : ""}
          </p>
          {documentType && isValid && (
            <p className="mt-2 text-sm text-muted-foreground">
              Detected: <span className="font-medium text-foreground">{documentType}</span>
            </p>
          )}
        </div>
      </div>

      {/* Validation Sections */}
      <div className="flex flex-col gap-3">
        {sections.map((section) => {
          const hasErrors = section.errors.length > 0
          const isExpanded = expandedSections.has(section.id)

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-xl bg-card/50 backdrop-blur-sm ring-1 ring-border/50"
            >
              <button
                type="button"
                onClick={() => hasErrors && toggleSection(section.id)}
                className={cn(
                  "flex w-full items-center justify-between p-4 text-left transition-all duration-200",
                  hasErrors && "hover:bg-accent/50 cursor-pointer"
                )}
                disabled={!hasErrors}
              >
                <div className="flex items-center gap-3">
                  {hasErrors ? (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                      <XCircle className="h-5 w-5 text-destructive" />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-foreground">
                      {section.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {hasErrors && (
                    <>
                      <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        {section.errors.length} issue
                        {section.errors.length !== 1 ? "s" : ""}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </>
                  )}
                </div>
              </button>

              {hasErrors && isExpanded && (
                <div className="border-t border-border/50 bg-muted/20">
                  {section.errors.map((error, index) => (
                    <ErrorItem key={index} error={error} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* AI Assistant - only show when there are errors and XML content is available */}
      {!isValid && xmlContent && (
        <AIAssistant
          validationResult={result}
          xmlContent={xmlContent}
        />
      )}

      {/* Action Button */}
      <div className="pt-2">
        <Button
          size="lg"
          onClick={onValidateAnother}
          className="w-full gap-2 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
        >
          <FileWarning className="h-5 w-5" />
          Validate Another Invoice
        </Button>
      </div>
    </div>
  )
}

function ErrorItem({ error }: { error: ValidationError }) {
  const isWarning = error.severity === "warning"

  return (
    <div className="border-b border-border/30 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {isWarning ? (
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
        ) : (
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-destructive/10">
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          </div>
        )}
        <div className="flex min-w-0 flex-col gap-1.5">
          {error.rule_id && (
            <span className="inline-flex w-fit rounded-md bg-muted/50 px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
              {error.rule_id}
            </span>
          )}
          <p className="text-sm text-foreground leading-relaxed">{error.message}</p>
          {error.location && (
            <p className="break-all rounded-md bg-muted/30 px-2 py-1 font-mono text-xs text-muted-foreground">
              {error.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

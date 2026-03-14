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

interface ValidationResultsProps {
  result: ValidationResult
  onValidateAnother: () => void
  className?: string
}

export function ValidationResults({
  result,
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

  const isValid = result.valid && result.error_count === 0

  const sections = [
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
  ]

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Summary Card */}
      <div
        className={cn(
          "flex flex-col items-center gap-4 rounded-xl p-8 text-center",
          isValid
            ? "bg-emerald-50 dark:bg-emerald-950/30"
            : "bg-destructive/10"
        )}
      >
        {isValid ? (
          <CheckCircle2 className="h-16 w-16 text-emerald-600 dark:text-emerald-500" />
        ) : (
          <XCircle className="h-16 w-16 text-destructive" />
        )}
        <div className="flex flex-col gap-1">
          <h3
            className={cn(
              "text-2xl font-semibold",
              isValid
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-destructive"
            )}
          >
            {isValid ? "Invoice is Valid" : "Validation Failed"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {result.error_count} error{result.error_count !== 1 ? "s" : ""},{" "}
            {result.warning_count} warning
            {result.warning_count !== 1 ? "s" : ""}
          </p>
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
              className="overflow-hidden rounded-lg border border-border"
            >
              <button
                type="button"
                onClick={() => hasErrors && toggleSection(section.id)}
                className={cn(
                  "flex w-full items-center justify-between p-4 text-left transition-colors",
                  hasErrors && "hover:bg-muted/50 cursor-pointer"
                )}
                disabled={!hasErrors}
              >
                <div className="flex items-center gap-3">
                  {hasErrors ? (
                    <XCircle className="h-5 w-5 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
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
                      <span className="text-sm font-medium text-destructive">
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
                <div className="border-t border-border bg-muted/30">
                  {section.errors.map((error, index) => (
                    <ErrorItem key={index} error={error} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-2">
        <Button onClick={onValidateAnother} variant="outline" className="gap-2">
          <FileWarning className="h-4 w-4" />
          Validate Another Invoice
        </Button>
      </div>
    </div>
  )
}

function ErrorItem({ error }: { error: ValidationError }) {
  const isWarning = error.severity === "warning"

  return (
    <div className="border-b border-border/50 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        {isWarning ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-500" />
        ) : (
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          {error.rule_id && (
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {error.rule_id}
            </span>
          )}
          <p className="text-sm text-foreground">{error.message}</p>
          {error.location && (
            <p className="break-all font-mono text-xs text-muted-foreground">
              {error.location}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

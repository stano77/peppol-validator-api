"use client"

import { useCallback, useState } from "react"
import { Upload, File, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface FileUploadZoneProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  disabled?: boolean
  className?: string
}

export function FileUploadZone({
  onFileSelect,
  selectedFile,
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files.length > 0) {
        const file = files[0]
        if (file.name.endsWith(".xml")) {
          onFileSelect(file)
        }
      }
    },
    [disabled, onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        onFileSelect(files[0])
      }
      // Reset input value so same file can be selected again
      e.target.value = ""
    },
    [onFileSelect]
  )

  const handleClear = useCallback(() => {
    onFileSelect(null)
  }, [onFileSelect])

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/10 backdrop-blur-sm scale-[1.02]"
          : selectedFile
            ? "border-primary/40 bg-primary/5 backdrop-blur-sm"
            : "border-border/60 hover:border-primary/40 hover:bg-accent/30 backdrop-blur-sm",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".xml"
        onChange={handleFileInput}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        aria-label="Upload XML file"
      />

      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        {selectedFile ? (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/20 backdrop-blur-sm">
              <File className="h-8 w-8 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="gap-1.5 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove file
            </Button>
          </>
        ) : (
          <>
            <div
              className={cn(
                "flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
                isDragging
                  ? "bg-primary/20 ring-1 ring-primary/30 scale-110"
                  : "bg-muted/50 ring-1 ring-border/50"
              )}
            >
              <Upload
                className={cn(
                  "h-8 w-8 transition-colors duration-300",
                  isDragging ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-foreground">
                Drop your XML invoice here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse files
              </p>
            </div>
            <p className="text-xs text-muted-foreground/80">
              Supports UBL 2.1 XML invoices up to 5MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}

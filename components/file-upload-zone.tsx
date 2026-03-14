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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

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
        "relative rounded-xl border-2 border-dashed transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5"
          : selectedFile
            ? "border-primary/50 bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <File className="h-7 w-7 text-primary" />
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
              className="gap-1.5"
            >
              <X className="h-4 w-4" />
              Remove file
            </Button>
          </>
        ) : (
          <>
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full transition-colors",
                isDragging ? "bg-primary/20" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "h-7 w-7 transition-colors",
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
            <p className="text-xs text-muted-foreground">
              Supports UBL 2.1 XML invoices up to 5MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}

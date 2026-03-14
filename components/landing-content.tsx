"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Shield, Zap, FileCheck, Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploadZone } from "@/components/file-upload-zone"
import { QuotaDisplay } from "@/components/quota-display"
import { ValidationResults } from "@/components/validation-results"
import { AuthModal } from "@/components/auth-modal"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile, QuotaInfo, ValidationResult } from "@/types/database"

const PENDING_FILE_KEY = "pendingValidationFile"

interface LandingContentProps {
  user: User | null
  profile: Profile | null
  initialQuota: QuotaInfo | null
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function LandingContent({
  user,
  profile,
  initialQuota,
}: LandingContentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null)
  const [quota, setQuota] = useState<QuotaInfo | null>(initialQuota)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Check for pending validation after OAuth redirect
  useEffect(() => {
    const checkPendingValidation = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const hasPending = urlParams.get("pendingValidation") === "true"

      if (hasPending && user) {
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname)

        // Try to restore file from localStorage
        const pendingData = localStorage.getItem(PENDING_FILE_KEY)
        if (pendingData) {
          try {
            const { name, content } = JSON.parse(pendingData)
            const blob = new Blob([content], { type: "application/xml" })
            const file = new File([blob], name, { type: "application/xml" })
            setSelectedFile(file)
            localStorage.removeItem(PENDING_FILE_KEY)

            // Auto-trigger validation
            await runValidation(file)
          } catch {
            localStorage.removeItem(PENDING_FILE_KEY)
          }
        }
        localStorage.removeItem("pendingValidation")
      }
    }

    checkPendingValidation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const runValidation = useCallback(
    async (file: File) => {
      if (!user) return

      setIsValidating(true)
      setError(null)
      setValidationResult(null)

      try {
        const content = await file.text()
        const response = await fetch("/api/v1/validate-ui", {
          method: "POST",
          headers: {
            "Content-Type": "application/xml",
          },
          body: content,
        })

        const data = await response.json()

        if (!response.ok) {
          if (response.status === 403 && data.quota) {
            setQuota({
              validations_today: data.quota.used,
              daily_limit: data.quota.limit,
              remaining: data.quota.remaining,
            })
          }
          throw new Error(data.error || "Validation failed")
        }

        // Update quota from response
        if (data.quota) {
          setQuota({
            validations_today: data.quota.used,
            daily_limit: data.quota.limit,
            remaining: data.quota.remaining,
          })
        }

        setValidationResult(data as ValidationResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsValidating(false)
      }
    },
    [user]
  )

  const handleValidate = async () => {
    if (!selectedFile) return

    if (!user) {
      // Store file content for after OAuth
      const content = await selectedFile.text()
      localStorage.setItem(
        PENDING_FILE_KEY,
        JSON.stringify({
          name: selectedFile.name,
          content,
          timestamp: Date.now(),
        })
      )
      setShowAuthModal(true)
      return
    }

    await runValidation(selectedFile)
  }

  const handleValidateAnother = () => {
    setSelectedFile(null)
    setValidationResult(null)
    setError(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const canValidate =
    selectedFile && (!user || (quota && quota.remaining > 0)) && !isValidating

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-foreground">
            Peppol Validator
          </span>
          <div className="flex items-center gap-4">
            {user && quota && (
              <QuotaDisplay
                used={quota.validations_today}
                limit={quota.daily_limit}
                variant="compact"
              />
            )}
            {user ? (
              <div className="flex items-center gap-3">
                {profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-8"
        >
          {/* Hero Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
              Validate PEPPOL Invoices
              <span className="text-primary"> Instantly</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
              Full 3-layer validation: UBL 2.1 XSD schema, EN 16931 business
              rules, and Peppol BIS 3.0 Schematron. Get results in seconds.
            </p>
          </div>

          {/* Main Content Area */}
          <div className="mx-auto w-full max-w-2xl">
            {validationResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ValidationResults
                  result={validationResult}
                  onValidateAnother={handleValidateAnother}
                />
              </motion.div>
            ) : (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col gap-6"
              >
                {/* Upload Zone */}
                <FileUploadZone
                  selectedFile={selectedFile}
                  onFileSelect={setSelectedFile}
                  disabled={isValidating}
                />

                {/* Quota Display for logged in users */}
                {user && quota && (
                  <QuotaDisplay
                    used={quota.validations_today}
                    limit={quota.daily_limit}
                  />
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Validate Button */}
                <Button
                  size="lg"
                  onClick={handleValidate}
                  disabled={!canValidate}
                  className="w-full gap-2 text-base"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-5 w-5" />
                      Validate Invoice
                    </>
                  )}
                </Button>

                {/* Sign in prompt for non-users */}
                {!user && selectedFile && (
                  <p className="text-center text-sm text-muted-foreground">
                    Sign in required to validate. Free accounts get 50
                    validations per day.
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Features Section - only show when no validation result */}
          {!validationResult && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 grid gap-4 md:grid-cols-3"
            >
              {[
                {
                  icon: Shield,
                  title: "3-Layer Validation",
                  desc: "XSD schema, EN 16931 rules, and Peppol Schematron in one request.",
                },
                {
                  icon: Zap,
                  title: "Instant Results",
                  desc: "Get comprehensive validation results in seconds, not minutes.",
                },
                {
                  icon: FileCheck,
                  title: "Detailed Reports",
                  desc: "Clear error messages with rule IDs and exact locations.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-5xl px-6 text-center text-sm text-muted-foreground">
          Peppol Validator API
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

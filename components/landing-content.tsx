"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Shield, FileCheck, Loader2, LogOut, Sparkles, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploadZone } from "@/components/file-upload-zone"
import { QuotaDisplay } from "@/components/quota-display"
import { ValidationResults } from "@/components/validation-results"
import { AuthModal } from "@/components/auth-modal"
import { ThemeToggle } from "@/components/theme-toggle"
import { DeveloperSection } from "@/components/developer-section"
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
  const [validatedXmlContent, setValidatedXmlContent] = useState<string | null>(null)
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
      setValidatedXmlContent(null)

      try {
        const content = await file.text()
        setValidatedXmlContent(content)
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
    setValidatedXmlContent(null)
    setError(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const canValidate =
    selectedFile && (!user || (quota && quota.remaining > 0)) && !isValidating

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Gradient Mesh Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        {/* Light mode gradient orbs */}
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px] dark:bg-primary/10" />
        <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-blue-400/20 blur-[100px] dark:bg-blue-500/10" />
        <div className="absolute -bottom-40 left-1/3 h-[450px] w-[450px] rounded-full bg-cyan-400/15 blur-[110px] dark:bg-cyan-500/8" />
        <div className="absolute bottom-1/4 right-1/4 h-[300px] w-[300px] rounded-full bg-indigo-400/15 blur-[80px] dark:bg-indigo-500/8" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-glass-border">
        <div className="glass-subtle">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              peppol-validator.eu
            </span>
            <div className="flex items-center gap-3">
              {user && quota && typeof quota.validations_today === 'number' && typeof quota.daily_limit === 'number' && (
                <QuotaDisplay
                  used={quota.validations_today}
                  limit={quota.daily_limit}
                  variant="compact"
                />
              )}
              <ThemeToggle />
              {user ? (
                <div className="flex items-center gap-3">
                  {profile?.avatar_url && (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full ring-2 ring-glass-border"
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="gap-1.5 hover:bg-accent"
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
                  className="glass-subtle border-glass-border hover:bg-accent"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative mx-auto max-w-5xl px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-10"
        >
          {/* Hero Header */}
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance"
            >
              Validate Invoices
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Instantly
              </span>
              <sup className="ml-2 text-xs sm:text-sm font-semibold text-primary align-super">Beta</sup>
            </motion.h1>

          </div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto w-full max-w-2xl"
          >
            {validationResult ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="glass rounded-2xl p-6"
              >
                <ValidationResults
                  result={validationResult}
                  xmlContent={validatedXmlContent || undefined}
                  onValidateAnother={handleValidateAnother}
                />
              </motion.div>
            ) : (
              <div className="glass rounded-2xl p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  {/* Upload Zone */}
                  <FileUploadZone
                    selectedFile={selectedFile}
                    onFileSelect={setSelectedFile}
                    disabled={isValidating}
                  />

                  {/* Quota Display for logged in users */}
                  {user && quota && typeof quota.validations_today === 'number' && typeof quota.daily_limit === 'number' && (
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
                      className="rounded-xl bg-destructive/10 backdrop-blur-sm p-4 text-center text-sm text-destructive border border-destructive/20"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Validate Button */}
                  <Button
                    size="lg"
                    onClick={handleValidate}
                    disabled={!canValidate}
                    className="w-full gap-2 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
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


                </div>
              </div>
            )}
          </motion.div>

          {/* Disclaimer Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 mx-auto max-w-2xl"
          >
            <div className="glass-subtle rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Important Notice
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Please only validate <span className="font-medium text-foreground">test invoices</span>, not real production documents containing sensitive data.
                    The <Sparkles className="inline h-4 w-4 text-primary" /> AI assistant uses invoice content to help identify validation errors and suggest fixes.
                  </p>

                </div>
              </div>
            </div>
          </motion.div>

          {/* Developer Section - Collapsible */}
          <DeveloperSection
            user={user}
            onAuthRequired={() => setShowAuthModal(true)}
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-glass-border">
        <div className="glass-subtle py-8">
          <div className="mx-auto max-w-5xl px-6 flex justify-center">
            <a
              href="https://github.com/stano77/peppol-validator-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

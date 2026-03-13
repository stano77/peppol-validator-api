"use client"

import { motion } from "framer-motion"
import { AuthButtons } from "@/components/auth-buttons"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        className="w-full max-w-sm rounded-lg border border-border bg-card p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage your API keys
          </p>
        </div>
        <div className="mt-8">
          <AuthButtons />
        </div>
      </motion.div>
    </div>
  )
}

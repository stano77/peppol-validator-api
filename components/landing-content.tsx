"use client"

import { motion } from "framer-motion"
import { Shield, Zap, Code, Key, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function LandingContent() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-foreground">
            Peppol Validator API
          </span>
          <Link href="/auth/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Validate Peppol documents
            <br />
            <span className="text-primary">via a simple API</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Full 3-layer Peppol BIS 3.0 validation: UBL 2.1 XSD, EN 16931
            business rules, and Peppol Schematron. Get results in seconds.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/auth/login">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight size={16} />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg">
                How it works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            2 free validations per API key. No credit card required.
          </p>
        </motion.div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Sign up",
                desc: "Create an account with Google or Apple in seconds.",
                icon: Key,
              },
              {
                step: "2",
                title: "Get your API key",
                desc: "Generate an API key and secret from your dashboard.",
                icon: Code,
              },
              {
                step: "3",
                title: "Send requests",
                desc: "POST your UBL XML and get validation results instantly.",
                icon: Zap,
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="rounded-lg border border-border bg-card p-6 text-center"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: Number(item.step) * 0.1 }}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <item.icon size={24} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            What you get
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {[
              {
                icon: Shield,
                title: "Full 3-layer validation",
                desc: "UBL 2.1 XSD schema, EN 16931 CEN business rules, and Peppol BIS 3.0 Schematron rules.",
              },
              {
                icon: Zap,
                title: "Fast responses",
                desc: "Get validation results in seconds, not minutes.",
              },
              {
                icon: Code,
                title: "Simple REST API",
                desc: "One POST endpoint. Send XML, get JSON results. Works with any language.",
              },
              {
                icon: Key,
                title: "Secure API keys",
                desc: "API key + secret authentication. Secrets are hashed and never stored in plain text.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-lg border border-border bg-card p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code example */}
      <section className="border-t border-border bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Quick start
          </h2>
          <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
              cURL
            </div>
            <pre className="overflow-x-auto p-4 text-sm text-foreground">
              <code>{`curl -X POST https://your-domain.com/api/v1/validate \\
  -H "X-API-Key: pv_your_api_key" \\
  -H "X-API-Secret: pvs_your_secret" \\
  -H "Content-Type: application/xml" \\
  -d @invoice.xml`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          Peppol Validator API
        </div>
      </footer>
    </div>
  )
}

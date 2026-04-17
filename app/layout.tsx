import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/lib/theme-provider"
import "./globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

const siteUrl = "https://peppol-validator.eu"
const siteName = "PEPPOL Validator"
const siteDescription = "Free PEPPOL invoice validation API with 3-layer validation: UBL 2.1 XSD schema, EN 16931 business rules, and Peppol BIS 3.0 Schematron. REST API for developers. 50 free validations per day."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PEPPOL Invoice Validator API - Free UBL & EN 16931 Validation",
    template: "%s | PEPPOL Validator"
  },
  description: siteDescription,
  keywords: [
    // Primary keywords
    "PEPPOL validator",
    "PEPPOL validation API",
    "UBL invoice validator",
    "EN 16931 validation",
    "Peppol BIS 3.0 validator",
    // Technical keywords for developers
    "e-invoice validation API",
    "XML invoice validator",
    "Schematron validation",
    "UBL 2.1 validation",
    "electronic invoicing API",
    "PEPPOL compliance check",
    // European e-invoicing terms
    "European e-invoicing",
    "B2G invoicing",
    "CIUS validation",
    "e-Rechnung validator",
    "Fattura elettronica validator",
    "factura electrónica",
    // Integration keywords
    "REST API invoice validation",
    "invoice validation service",
    "PEPPOL API integration",
    "automated invoice validation"
  ],
  authors: [{ name: "peppol-validator.eu" }],
  creator: "peppol-validator.eu",
  publisher: "peppol-validator.eu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_EU",
    url: siteUrl,
    siteName: siteName,
    title: "PEPPOL Invoice Validator API - Free UBL & EN 16931 Validation",
    description: siteDescription,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PEPPOL Invoice Validator - 3-Layer Validation API",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PEPPOL Invoice Validator API - Free UBL & EN 16931 Validation",
    description: siteDescription,
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "en": siteUrl,
      "x-default": siteUrl,
    },
  },
  category: "Technology",
  classification: "Business Software",
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

// JSON-LD Structured Data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${siteUrl}/#webapp`,
      name: "PEPPOL Invoice Validator",
      description: siteDescription,
      url: siteUrl,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free tier with 50 validations per day"
      },
      featureList: [
        "UBL 2.1 XSD Schema Validation",
        "EN 16931 Business Rules Validation", 
        "Peppol BIS 3.0 Schematron Validation",
        "REST API Integration",
        "AI-powered Error Analysis"
      ],
      screenshot: `${siteUrl}/og-image.jpg`
    },
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "peppol-validator.eu",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: siteName,
      publisher: { "@id": `${siteUrl}/#organization` }
    },
    {
      "@type": "SoftwareApplication",
      name: "PEPPOL Validator API",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR"
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "50"
      }
    }
  ]
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <link rel="canonical" href={siteUrl} />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

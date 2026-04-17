import { streamText } from "ai"
import { createClient } from "@/lib/supabase/server"

// AI-powered error analysis endpoint
export async function POST(request: Request) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { xmlContent, validationResult } = await request.json()

    if (!xmlContent || !validationResult) {
      return Response.json(
        { error: "Missing xmlContent or validationResult" },
        { status: 400 }
      )
    }

    // Extract errors for analysis
    const errors = validationResult.errors || []
    const warnings = validationResult.warnings || []
    const errorCount = validationResult.error_count || 0
    const warningCount = validationResult.warning_count || 0

    // If no errors, nothing to analyze
    if (errorCount === 0 && warningCount === 0) {
      return Response.json(
        { error: "No validation errors to analyze" },
        { status: 400 }
      )
    }

    // Truncate XML if too long (to stay within token limits)
    const maxXmlLength = 15000
    const truncatedXml =
      xmlContent.length > maxXmlLength
        ? xmlContent.substring(0, maxXmlLength) + "\n... [truncated]"
        : xmlContent

    const systemPrompt = `LANGUAGE REQUIREMENT: You MUST respond exclusively in Slovak (slovenčina). Every explanation, heading, bullet, comment, and sentence you write must be in Slovak. This applies even if the user writes to you in English or any other language, and even if the validation error messages are in English — you translate and explain them in Slovak. The ONLY things that stay in their original form are: XML element/attribute names, rule IDs (e.g. BR-01, PEPPOL-EN16931-R001), XPath expressions, and the content of \`\`\`xml code blocks. Never respond in English or any other language.

You are an expert PEPPOL e-invoicing consultant specializing in:
- UBL 2.1 XML Schema validation
- EN 16931 European e-invoicing standard
- Peppol BIS 3.0 (Billing) specifications

Your task is to analyze validation errors and help users fix their PEPPOL invoices.

When analyzing errors:
1. Explain the root cause in simple terms (in Slovak)
2. Reference the relevant specification (UBL, EN 16931, or Peppol BIS)
3. Provide the EXACT corrected XML snippet that the user can copy-paste
4. If multiple errors are related, explain the connection (in Slovak)

Format your response using markdown:
- Use ## for section headers (Slovak text)
- Use \`\`\`xml code blocks for XML snippets (XML stays as-is)
- Use **bold** for important terms (Slovak)
- Use bullet points for lists (Slovak)

Always provide copy-pastable XML corrections wrapped in \`\`\`xml code blocks. All surrounding prose must be in Slovak.`

    const userPrompt = `Please analyze the following PEPPOL invoice validation errors and help me fix them.

## Validation Summary
- ${errorCount} error(s)
- ${warningCount} warning(s)
- Document type: ${validationResult.document_type || "Unknown"}

## Errors
${errors
  .map(
    (e: { rule_id?: string; message: string; location?: string }, i: number) =>
      `${i + 1}. ${e.rule_id ? `[${e.rule_id}] ` : ""}${e.message}${e.location ? `\n   Location: ${e.location}` : ""}`
  )
  .join("\n")}

${
  warnings.length > 0
    ? `## Warnings
${warnings
  .map(
    (w: { rule_id?: string; message: string; location?: string }, i: number) =>
      `${i + 1}. ${w.rule_id ? `[${w.rule_id}] ` : ""}${w.message}${w.location ? `\n   Location: ${w.location}` : ""}`
  )
  .join("\n")}`
    : ""
}

## Invoice XML
\`\`\`xml
${truncatedXml}
\`\`\`

Please:
1. Explain why each error occurred
2. Identify the root cause(s)
3. Provide the corrected XML snippet(s) I can copy-paste to fix these issues
4. If relevant, mention any best practices to avoid similar errors`

    const result = streamText({
      model: "anthropic/claude-sonnet-4",
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxOutputTokens: 4000,
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error("AI analysis error:", error)
    return Response.json({ error: "Failed to analyze errors" }, { status: 500 })
  }
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Authentication error
        </h1>
        <p className="mt-2 text-muted-foreground">
          Something went wrong during sign in. Please try again.
        </p>
        <Link href="/auth/login" className="mt-6 inline-block">
          <Button>Back to sign in</Button>
        </Link>
      </div>
    </div>
  )
}

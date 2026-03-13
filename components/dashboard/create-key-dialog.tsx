"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createKeySchema, type CreateKeyInput } from "@/lib/schemas"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SecretReveal } from "./secret-reveal"
import { Plus } from "lucide-react"
import { toast } from "sonner"

interface CreateKeyDialogProps {
  onCreated: () => void
}

export function CreateKeyDialog({ onCreated }: CreateKeyDialogProps) {
  const [open, setOpen] = useState(false)
  const [createdKey, setCreatedKey] = useState<{
    key: string
    secret: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateKeyInput>({
    resolver: zodResolver(createKeySchema),
    defaultValues: { name: "" },
  })

  const onSubmit = async (data: CreateKeyInput) => {
    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      toast.error("Failed to create API key")
      return
    }

    const result = await res.json()
    setCreatedKey({ key: result.key, secret: result.secret })
    onCreated()
  }

  const handleClose = () => {
    setOpen(false)
    setCreatedKey(null)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <Plus size={16} />
        Create API Key
      </DialogTrigger>
      <DialogContent>
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Save your secret now. It will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <SecretReveal apiKey={createdKey.key} secret={createdKey.secret} />
            <Button onClick={handleClose} className="mt-4 w-full">
              Done
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your key a name to identify it later.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Production, Testing"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Key"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

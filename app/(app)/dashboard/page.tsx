"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { UsageStats } from "@/components/dashboard/usage-stats"
import { ApiKeysList } from "@/components/dashboard/api-keys-list"
import { CreateKeyDialog } from "@/components/dashboard/create-key-dialog"
import type { ApiKey } from "@/types/database"

export default function DashboardPage() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchKeys = useCallback(async () => {
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .order("created_at", { ascending: false })

    setKeys(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your API keys and monitor usage
          </p>
        </div>
        <CreateKeyDialog onCreated={fetchKeys} />
      </div>

      <UsageStats keys={keys} loading={loading} />
      <ApiKeysList keys={keys} loading={loading} onRefresh={fetchKeys} />
    </div>
  )
}

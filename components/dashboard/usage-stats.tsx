import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Key, Activity, CheckCircle } from "lucide-react"
import type { ApiKey } from "@/types/database"

interface UsageStatsProps {
  keys: ApiKey[]
  loading: boolean
}

export function UsageStats({ keys, loading }: UsageStatsProps) {
  const totalKeys = keys.length
  const activeKeys = keys.filter((k) => k.is_active).length
  const totalValidations = keys.reduce((sum, k) => sum + k.usage_count, 0)

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const stats = [
    { label: "API Keys", value: totalKeys, icon: Key },
    { label: "Active Keys", value: activeKeys, icon: CheckCircle },
    { label: "Total Validations", value: totalValidations, icon: Activity },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <stat.icon size={16} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

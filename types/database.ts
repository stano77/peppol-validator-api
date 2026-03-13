export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: string
  user_id: string
  name: string
  key: string
  secret_hash: string
  usage_count: number
  max_usage: number
  is_active: boolean
  created_at: string
}

export interface ValidationLog {
  id: string
  api_key_id: string
  status: string
  response_time_ms: number | null
  created_at: string
}

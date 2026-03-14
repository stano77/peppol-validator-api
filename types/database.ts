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
  api_key_id: string | null
  user_id: string | null
  status: string
  response_time_ms: number | null
  created_at: string
}

export interface UserQuota {
  id: string
  user_id: string
  validations_today: number
  last_reset_date: string
  daily_limit: number
  created_at: string
}

export interface QuotaInfo {
  validations_today: number
  daily_limit: number
  remaining: number
}

export interface ValidationResult {
  valid: boolean
  error_count: number
  warning_count: number
  xsd_errors?: ValidationError[]
  business_rule_errors?: ValidationError[]
  schematron_errors?: ValidationError[]
}

export interface ValidationError {
  rule_id?: string
  location?: string
  message: string
  severity?: 'error' | 'warning'
}

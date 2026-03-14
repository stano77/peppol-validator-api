-- ============================================================
-- Add user_quotas table for daily validation limits
-- Daily quota: 50 validations per user, resets at midnight CET
-- ============================================================

-- User Quotas table
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  validations_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_limit INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_quotas_user ON public.user_quotas(user_id);

-- Enable RLS
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own quota"
  ON public.user_quotas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quota"
  ON public.user_quotas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quota"
  ON public.user_quotas FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get or create user quota with CET timezone reset
CREATE OR REPLACE FUNCTION public.get_or_create_quota(p_user_id UUID)
RETURNS TABLE (
  validations_today INTEGER,
  daily_limit INTEGER,
  last_reset_date DATE
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  -- Get current date in CET timezone
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  -- Try to get existing quota
  SELECT * INTO v_record FROM public.user_quotas WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create new quota record
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 0, v_cet_date, 50)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    -- Reset quota for new day
    UPDATE public.user_quotas
    SET validations_today = 0, last_reset_date = v_cet_date
    WHERE user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT v_record.validations_today, v_record.daily_limit, v_record.last_reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user validation count (returns updated quota info)
CREATE OR REPLACE FUNCTION public.increment_user_validation(p_user_id UUID)
RETURNS TABLE (
  validations_today INTEGER,
  daily_limit INTEGER,
  quota_exceeded BOOLEAN
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  -- Get current date in CET timezone
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  -- Get or create quota, reset if needed
  SELECT * INTO v_record FROM public.user_quotas WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Create new quota record with 1 validation
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 1, v_cet_date, 50)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    -- Reset quota for new day and set to 1
    UPDATE public.user_quotas
    SET validations_today = 1, last_reset_date = v_cet_date
    WHERE user_id = p_user_id
    RETURNING * INTO v_record;
  ELSE
    -- Increment existing quota
    UPDATE public.user_quotas
    SET validations_today = validations_today + 1
    WHERE user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT 
    v_record.validations_today, 
    v_record.daily_limit,
    (v_record.validations_today > v_record.daily_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also update validation_logs to optionally track user_id directly (for UI validations)
ALTER TABLE public.validation_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for user validation logs
CREATE INDEX IF NOT EXISTS idx_validation_logs_user ON public.validation_logs(user_id);

-- Update RLS policy for validation_logs to allow users to view their direct logs
DROP POLICY IF EXISTS "Users can view own validation_logs" ON public.validation_logs;

CREATE POLICY "Users can view own validation_logs"
  ON public.validation_logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.api_keys
      WHERE api_keys.id = validation_logs.api_key_id
      AND api_keys.user_id = auth.uid()
    )
  );

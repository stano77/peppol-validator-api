-- ============================================================
-- Fix ambiguous column references in quota functions
-- ============================================================

-- Drop existing functions first (required to change return type)
DROP FUNCTION IF EXISTS public.get_or_create_quota(UUID);
DROP FUNCTION IF EXISTS public.increment_user_validation(UUID);

-- Recreate the functions with proper table-qualified column names

CREATE OR REPLACE FUNCTION public.get_or_create_quota(p_user_id UUID)
RETURNS TABLE (
  out_validations_today INTEGER,
  out_daily_limit INTEGER,
  out_last_reset_date DATE
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  -- Get current date in CET timezone
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  -- Try to get existing quota
  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id;

  IF NOT FOUND THEN
    -- Create new quota record
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 0, v_cet_date, 50)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    -- Reset quota for new day
    UPDATE public.user_quotas uq
    SET validations_today = 0, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT v_record.validations_today, v_record.daily_limit, v_record.last_reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user validation count (returns updated quota info)
CREATE OR REPLACE FUNCTION public.increment_user_validation(p_user_id UUID)
RETURNS TABLE (
  out_validations_today INTEGER,
  out_daily_limit INTEGER,
  out_quota_exceeded BOOLEAN
) AS $$
DECLARE
  v_cet_date DATE;
  v_record public.user_quotas%ROWTYPE;
BEGIN
  -- Get current date in CET timezone
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  -- Get or create quota, reset if needed
  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    -- Create new quota record with 1 validation
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 1, v_cet_date, 50)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    -- Reset quota for new day and set to 1
    UPDATE public.user_quotas uq
    SET validations_today = 1, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  ELSE
    -- Increment existing quota
    UPDATE public.user_quotas uq
    SET validations_today = uq.validations_today + 1
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT 
    v_record.validations_today, 
    v_record.daily_limit,
    (v_record.validations_today > v_record.daily_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

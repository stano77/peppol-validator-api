-- ============================================================
-- Reduce free daily quota from 50 to 5 validations per user
-- Updates: table default, existing rows, and both quota functions
-- Safe to re-run (idempotent).
-- ============================================================

-- 1. Change the column default for any future inserts that don't specify daily_limit.
ALTER TABLE public.user_quotas
  ALTER COLUMN daily_limit SET DEFAULT 5;

-- 2. Bring existing users down to the new limit.
--    Only touches rows still on the old default (50), so manually upgraded users are left alone.
UPDATE public.user_quotas
  SET daily_limit = 5
  WHERE daily_limit = 50;

-- 3. Replace both functions so new rows they INSERT also use 5.
DROP FUNCTION IF EXISTS public.get_or_create_quota(UUID);
DROP FUNCTION IF EXISTS public.increment_user_validation(UUID);

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
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 0, v_cet_date, 5)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    UPDATE public.user_quotas uq
    SET validations_today = 0, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  END IF;

  RETURN QUERY SELECT v_record.validations_today, v_record.daily_limit, v_record.last_reset_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  v_cet_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Paris')::DATE;

  SELECT * INTO v_record FROM public.user_quotas uq WHERE uq.user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_quotas (user_id, validations_today, last_reset_date, daily_limit)
    VALUES (p_user_id, 1, v_cet_date, 5)
    RETURNING * INTO v_record;
  ELSIF v_record.last_reset_date < v_cet_date THEN
    UPDATE public.user_quotas uq
    SET validations_today = 1, last_reset_date = v_cet_date
    WHERE uq.user_id = p_user_id
    RETURNING * INTO v_record;
  ELSE
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

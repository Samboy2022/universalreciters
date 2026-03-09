
CREATE OR REPLACE FUNCTION public.unlock_video(_user_id uuid, _video_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _fee integer;
  _balance numeric;
  _already_unlocked boolean;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM public.transactions
    WHERE user_id = _user_id
      AND category = 'video_unlock'
      AND description = 'Unlocked video: ' || _video_id::text
      AND status = 'completed'
  ) INTO _already_unlocked;

  IF _already_unlocked THEN
    RETURN jsonb_build_object('success', true, 'already_unlocked', true);
  END IF;

  -- Get video unlock fee
  SELECT unlock_fee INTO _fee FROM public.videos WHERE id = _video_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Video not found');
  END IF;

  IF _fee IS NULL OR _fee <= 0 THEN
    -- Free video, just mark as unlocked
    INSERT INTO public.transactions (user_id, type, category, description, amount, status)
    VALUES (_user_id, 'debit', 'video_unlock', 'Unlocked video: ' || _video_id::text, 0, 'completed');
    RETURN jsonb_build_object('success', true, 'fee', 0);
  END IF;

  -- Check balance
  SELECT money_balance INTO _balance FROM public.profiles WHERE id = _user_id;
  IF _balance < _fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'required', _fee, 'balance', _balance);
  END IF;

  -- Deduct balance
  UPDATE public.profiles SET money_balance = money_balance - _fee WHERE id = _user_id;

  -- Record transaction
  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_user_id, 'debit', 'video_unlock', 'Unlocked video: ' || _video_id::text, _fee, 'completed');

  RETURN jsonb_build_object('success', true, 'fee', _fee);
END;
$$;

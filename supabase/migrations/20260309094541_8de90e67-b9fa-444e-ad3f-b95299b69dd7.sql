
CREATE OR REPLACE FUNCTION public.redeem_pin(_pin_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _pin RECORD;
  _new_balance numeric;
BEGIN
  -- Find and lock the pin
  SELECT * INTO _pin
  FROM public.redemption_pins
  WHERE pin_code = UPPER(_pin_code)
    AND is_redeemed = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or already redeemed PIN');
  END IF;

  -- Mark pin as redeemed
  UPDATE public.redemption_pins
  SET is_redeemed = true, redeemed_by = _user_id, redeemed_at = now()
  WHERE id = _pin.id;

  -- Add balance to profile
  UPDATE public.profiles
  SET money_balance = COALESCE(money_balance, 0) + _pin.value
  WHERE id = _user_id
  RETURNING money_balance INTO _new_balance;

  -- Create transaction record
  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_user_id, 'credit', 'pin_redemption', 'PIN redeemed: ' || _pin.pin_code, _pin.value, 'completed');

  RETURN jsonb_build_object('success', true, 'value', _pin.value, 'new_balance', _new_balance);
END;
$$;


CREATE OR REPLACE FUNCTION public.admin_deduct_balance(_user_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current_balance numeric;
  _new_balance numeric;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT COALESCE(money_balance, 0) INTO _current_balance FROM public.profiles WHERE id = _user_id;

  IF _current_balance < _amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance. Current: ' || _current_balance);
  END IF;

  UPDATE public.profiles
  SET money_balance = COALESCE(money_balance, 0) - _amount
  WHERE id = _user_id
  RETURNING money_balance INTO _new_balance;

  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_user_id, 'debit', 'admin_deduction', 'Admin deduction', _amount, 'completed');

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$$;

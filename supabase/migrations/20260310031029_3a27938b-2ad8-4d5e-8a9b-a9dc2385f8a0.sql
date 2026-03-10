
-- Create get_admin_stats function
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM public.profiles),
    'activeUsers', (SELECT COUNT(*) FROM public.profiles WHERE is_active = true),
    'totalVideos', (SELECT COUNT(*) FROM public.videos),
    'totalRecitations', (SELECT COUNT(*) FROM public.recitations),
    'totalPins', (SELECT COUNT(*) FROM public.redemption_pins),
    'redeemedPins', (SELECT COUNT(*) FROM public.redemption_pins WHERE is_redeemed = true),
    'totalTransactions', (SELECT COUNT(*) FROM public.transactions),
    'totalRevenue', COALESCE((SELECT SUM(amount) FROM public.transactions WHERE type = 'debit' AND status = 'completed'), 0),
    'totalUserBalance', COALESCE((SELECT SUM(money_balance) FROM public.profiles), 0),
    'totalPointsBalance', COALESCE((SELECT SUM(points) FROM public.profiles), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Create admin_add_balance function
CREATE OR REPLACE FUNCTION public.admin_add_balance(_user_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _new_balance numeric;
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE public.profiles
  SET money_balance = COALESCE(money_balance, 0) + _amount
  WHERE id = _user_id
  RETURNING money_balance INTO _new_balance;

  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_user_id, 'credit', 'admin_deposit', 'Admin deposit', _amount, 'completed');

  RETURN jsonb_build_object('success', true, 'new_balance', _new_balance);
END;
$$;

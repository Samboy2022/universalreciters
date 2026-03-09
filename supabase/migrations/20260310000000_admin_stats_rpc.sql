
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _total_users bigint;
  _active_users bigint;
  _total_videos bigint;
  _total_recitations bigint;
  _total_pins bigint;
  _redeemed_pins bigint;
  _total_transactions bigint;
  _total_revenue numeric;
  _total_user_balance numeric;
  _total_points_balance bigint;
BEGIN
  SELECT count(*) INTO _total_users FROM public.profiles;
  SELECT count(*) INTO _active_users FROM public.profiles WHERE is_active = true;
  SELECT count(*) INTO _total_videos FROM public.videos;
  SELECT count(*) INTO _total_recitations FROM public.recitations;
  SELECT count(*) INTO _total_pins FROM public.redemption_pins;
  SELECT count(*) INTO _redeemed_pins FROM public.redemption_pins WHERE is_redeemed = true;
  SELECT count(*) INTO _total_transactions FROM public.transactions;

  SELECT COALESCE(sum(amount), 0) INTO _total_revenue FROM public.transactions WHERE type = 'debit';
  SELECT COALESCE(sum(money_balance), 0) INTO _total_user_balance FROM public.profiles;
  SELECT COALESCE(sum(points), 0) INTO _total_points_balance FROM public.profiles;

  RETURN jsonb_build_object(
    'totalUsers', _total_users,
    'activeUsers', _active_users,
    'totalVideos', _total_videos,
    'totalRecitations', _total_recitations,
    'totalPins', _total_pins,
    'redeemedPins', _redeemed_pins,
    'totalTransactions', _total_transactions,
    'totalRevenue', _total_revenue,
    'totalUserBalance', _total_user_balance,
    'totalPointsBalance', _total_points_balance
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_add_balance(_user_id uuid, _amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET money_balance = COALESCE(money_balance, 0) + _amount
  WHERE id = _user_id;

  INSERT INTO public.transactions (user_id, amount, type, category, description, status)
  VALUES (_user_id, _amount, 'credit', 'admin_deposit', 'Admin balance deposit', 'completed');
END;
$$;

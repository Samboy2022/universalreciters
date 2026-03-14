
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
  -- Count total users
  SELECT COALESCE(count(*), 0) INTO _total_users FROM public.profiles;
  
  -- Count active users
  SELECT COALESCE(count(*), 0) INTO _active_users FROM public.profiles WHERE is_active = true;
  
  -- Count total videos
  SELECT COALESCE(count(*), 0) INTO _total_videos FROM public.videos;
  
  -- Count total recitations
  SELECT COALESCE(count(*), 0) INTO _total_recitations FROM public.recitations;
  
  -- Count total pins
  SELECT COALESCE(count(*), 0) INTO _total_pins FROM public.redemption_pins;
  
  -- Count redeemed pins
  SELECT COALESCE(count(*), 0) INTO _redeemed_pins FROM public.redemption_pins WHERE is_redeemed = true;
  
  -- Count total transactions
  SELECT COALESCE(count(*), 0) INTO _total_transactions FROM public.transactions;

  -- Calculate total revenue from debit transactions (money spent by users)
  SELECT COALESCE(sum(amount), 0) INTO _total_revenue 
  FROM public.transactions 
  WHERE type = 'debit' AND status = 'completed';
  
  -- Calculate total user balance
  SELECT COALESCE(sum(money_balance), 0) INTO _total_user_balance FROM public.profiles;
  
  -- Calculate total points balance
  SELECT COALESCE(sum(points), 0) INTO _total_points_balance FROM public.profiles;

  -- Return all stats as JSON
  RETURN jsonb_build_object(
    'totalUsers', COALESCE(_total_users, 0),
    'activeUsers', COALESCE(_active_users, 0),
    'totalVideos', COALESCE(_total_videos, 0),
    'totalRecitations', COALESCE(_total_recitations, 0),
    'totalPins', COALESCE(_total_pins, 0),
    'redeemedPins', COALESCE(_redeemed_pins, 0),
    'totalTransactions', COALESCE(_total_transactions, 0),
    'totalRevenue', COALESCE(_total_revenue, 0),
    'totalUserBalance', COALESCE(_total_user_balance, 0),
    'totalPointsBalance', COALESCE(_total_points_balance, 0)
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

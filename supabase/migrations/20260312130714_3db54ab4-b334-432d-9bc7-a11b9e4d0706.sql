
-- Table to track who already paid for a stream view (one-time charge per user per stream)
CREATE TABLE public.stream_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  UNIQUE(stream_id, user_id)
);

ALTER TABLE public.stream_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stream views" ON public.stream_views
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all stream views" ON public.stream_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Function: charge viewer ₦3, give ₦2 to admin, ₦1 to creator
CREATE OR REPLACE FUNCTION public.pay_stream_view(_user_id uuid, _stream_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance numeric;
  _creator_id uuid;
  _already_paid boolean;
  _fee numeric := 3;
  _admin_share numeric := 2;
  _creator_share numeric := 1;
  _admin_id uuid;
BEGIN
  -- Check if already paid
  SELECT EXISTS(
    SELECT 1 FROM public.stream_views
    WHERE stream_id = _stream_id AND user_id = _user_id
  ) INTO _already_paid;

  IF _already_paid THEN
    RETURN jsonb_build_object('success', true, 'already_paid', true);
  END IF;

  -- Get creator
  SELECT user_id INTO _creator_id FROM public.streams WHERE id = _stream_id;
  IF _creator_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stream not found');
  END IF;

  -- Check viewer balance
  SELECT COALESCE(money_balance, 0) INTO _balance FROM public.profiles WHERE id = _user_id;
  IF _balance < _fee THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'required', _fee, 'balance', _balance);
  END IF;

  -- Get first admin user
  SELECT ur.user_id INTO _admin_id FROM public.user_roles ur WHERE ur.role = 'admin' LIMIT 1;

  -- Deduct from viewer
  UPDATE public.profiles SET money_balance = COALESCE(money_balance, 0) - _fee WHERE id = _user_id;

  -- Credit creator ₦1
  UPDATE public.profiles SET money_balance = COALESCE(money_balance, 0) + _creator_share WHERE id = _creator_id;

  -- Credit admin ₦2
  IF _admin_id IS NOT NULL THEN
    UPDATE public.profiles SET money_balance = COALESCE(money_balance, 0) + _admin_share WHERE id = _admin_id;
  END IF;

  -- Record the view payment
  INSERT INTO public.stream_views (stream_id, user_id, amount) VALUES (_stream_id, _user_id, _fee);

  -- Transaction records
  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_user_id, 'debit', 'stream_view', 'Paid to watch stream: ' || _stream_id::text, _fee, 'completed');

  INSERT INTO public.transactions (user_id, type, category, description, amount, status)
  VALUES (_creator_id, 'credit', 'stream_earning', 'Earning from stream view: ' || _stream_id::text, _creator_share, 'completed');

  IF _admin_id IS NOT NULL THEN
    INSERT INTO public.transactions (user_id, type, category, description, amount, status)
    VALUES (_admin_id, 'credit', 'stream_commission', 'Commission from stream view: ' || _stream_id::text, _admin_share, 'completed');
  END IF;

  RETURN jsonb_build_object('success', true, 'fee', _fee);
END;
$$;

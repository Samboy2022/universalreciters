
-- Fix public exposure of profiles: restrict full table to self & admins; expose limited public view
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Public-safe view exposing only non-sensitive fields (no email, money_balance, referral_code, referred_by)
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT id, name, avatar_url, points, ward, lga, state, country, is_active, created_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Conversations: allow creator to update & delete their conversations
CREATE POLICY "Creators can update their conversations"
ON public.conversations FOR UPDATE
USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their conversations"
ON public.conversations FOR DELETE
USING (auth.uid() = created_by);

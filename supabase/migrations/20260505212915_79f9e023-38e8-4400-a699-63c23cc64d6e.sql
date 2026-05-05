
-- Remove the overly broad policy added previously
DROP POLICY IF EXISTS "Authenticated can view limited profile fields" ON public.profiles;
DROP VIEW IF EXISTS public.public_profiles;

-- Safe RPC returning only non-sensitive public fields
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  points integer,
  ward text,
  lga text,
  state text,
  country text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, avatar_url, points, ward, lga, state, country, is_active, created_at
  FROM public.profiles;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated;

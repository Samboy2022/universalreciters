
CREATE OR REPLACE FUNCTION public.get_public_profiles_by_ids(_ids uuid[])
RETURNS TABLE (
  id uuid,
  name text,
  avatar_url text,
  points integer,
  ward text,
  lga text,
  state text,
  country text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, avatar_url, points, ward, lga, state, country
  FROM public.profiles
  WHERE id = ANY(_ids);
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles_by_ids(uuid[]) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles_by_ids(uuid[]) TO authenticated;

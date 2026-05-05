
CREATE OR REPLACE FUNCTION public.get_public_profiles_filtered(
  _ward text DEFAULT NULL,
  _lga text DEFAULT NULL,
  _state text DEFAULT NULL,
  _limit int DEFAULT 100,
  _exclude uuid DEFAULT NULL
)
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
  WHERE (_ward IS NULL OR ward = _ward)
    AND (_lga IS NULL OR lga = _lga)
    AND (_state IS NULL OR state = _state)
    AND (_exclude IS NULL OR id <> _exclude)
  ORDER BY points DESC NULLS LAST, name ASC
  LIMIT _limit;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles_filtered(text, text, text, int, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_public_profiles_filtered(text, text, text, int, uuid) TO authenticated;

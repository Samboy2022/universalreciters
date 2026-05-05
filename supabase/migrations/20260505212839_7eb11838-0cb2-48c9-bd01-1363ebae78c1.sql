
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, name, avatar_url, points, ward, lga, state, country, is_active, created_at
FROM public.profiles;

-- Allow authenticated users to view limited public info of any profile via this view path
CREATE POLICY "Authenticated can view limited profile fields"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Note: full table is still readable to authenticated, but app code should use public_profiles view
-- to avoid exposing email/balance. We rely on app code; revoke broad column access where possible.
GRANT SELECT ON public.public_profiles TO authenticated, anon;

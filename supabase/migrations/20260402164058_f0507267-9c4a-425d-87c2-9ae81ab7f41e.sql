
-- 1. Create all tables first (no cross-referencing policies yet)
CREATE TABLE public.custom_admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.custom_admin_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  custom_role_id uuid NOT NULL REFERENCES public.custom_admin_roles(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);
ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.custom_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.custom_admin_roles(id) ON DELETE CASCADE,
  page_slug text NOT NULL,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  UNIQUE(role_id, page_slug)
);
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- 2. Now add all policies (all tables exist)
CREATE POLICY "Admins can manage custom roles" ON public.custom_admin_roles
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Custom role users can view own role" ON public.custom_admin_roles
  FOR SELECT TO public USING (
    id IN (SELECT custom_role_id FROM public.user_custom_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage user custom roles" ON public.user_custom_roles
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own custom roles" ON public.user_custom_roles
  FOR SELECT TO public USING (user_id = auth.uid());

CREATE POLICY "Admins can manage role permissions" ON public.custom_role_permissions
  FOR ALL TO public USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Custom role users can view own permissions" ON public.custom_role_permissions
  FOR SELECT TO public USING (
    role_id IN (SELECT custom_role_id FROM public.user_custom_roles WHERE user_id = auth.uid())
  );

-- 3. Helper functions
CREATE OR REPLACE FUNCTION public.has_custom_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_custom_roles WHERE user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.check_custom_permission(_user_id uuid, _page_slug text, _action text DEFAULT 'view')
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_custom_roles ucr
    JOIN public.custom_role_permissions crp ON crp.role_id = ucr.custom_role_id
    WHERE ucr.user_id = _user_id
      AND crp.page_slug = _page_slug
      AND (
        (_action = 'view' AND crp.can_view = true) OR
        (_action = 'edit' AND crp.can_edit = true) OR
        (_action = 'delete' AND crp.can_delete = true)
      )
  );
$$;

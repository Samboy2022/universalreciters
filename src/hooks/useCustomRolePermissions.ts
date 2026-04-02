import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CustomPermission {
  page_slug: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const useCustomRolePermissions = (userId: string | undefined) => {
  const [permissions, setPermissions] = useState<CustomPermission[]>([]);
  const [hasCustomRole, setHasCustomRole] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      // Check if user has custom role
      const { data: customRoles } = await supabase
        .from("user_custom_roles")
        .select("custom_role_id")
        .eq("user_id", userId);

      if (!customRoles || customRoles.length === 0) {
        setHasCustomRole(false);
        setPermissions([]);
        setIsLoading(false);
        return;
      }

      setHasCustomRole(true);

      const roleIds = customRoles.map((r) => r.custom_role_id);
      const { data: perms } = await supabase
        .from("custom_role_permissions")
        .select("page_slug, can_view, can_edit, can_delete")
        .in("role_id", roleIds);

      // Merge permissions across roles (most permissive wins)
      const merged: Record<string, CustomPermission> = {};
      (perms || []).forEach((p) => {
        if (!merged[p.page_slug]) {
          merged[p.page_slug] = { ...p };
        } else {
          merged[p.page_slug].can_view = merged[p.page_slug].can_view || p.can_view;
          merged[p.page_slug].can_edit = merged[p.page_slug].can_edit || p.can_edit;
          merged[p.page_slug].can_delete = merged[p.page_slug].can_delete || p.can_delete;
        }
      });

      setPermissions(Object.values(merged));
      setIsLoading(false);
    };

    fetchPermissions();
  }, [userId]);

  const canAccessPage = (pageSlug: string) =>
    permissions.some((p) => p.page_slug === pageSlug && p.can_view);

  const canEditPage = (pageSlug: string) =>
    permissions.some((p) => p.page_slug === pageSlug && p.can_edit);

  const canDeletePage = (pageSlug: string) =>
    permissions.some((p) => p.page_slug === pageSlug && p.can_delete);

  return { permissions, hasCustomRole, isLoading, canAccessPage, canEditPage, canDeletePage };
};

import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Shield, Users, UserPlus } from "lucide-react";

const ADMIN_PAGES = [
  { slug: "dashboard", label: "Overview Dashboard" },
  { slug: "cms", label: "CMS / Content" },
  { slug: "surahs", label: "Recitation Videos" },
  { slug: "surah-texts", label: "Surah Texts" },
  { slug: "rankings", label: "Ranking Control" },
  { slug: "learning", label: "Learning Materials" },
  { slug: "wallet", label: "Wallet Management" },
  { slug: "videos", label: "Stream Videos" },
  { slug: "users", label: "Users" },
  { slug: "pins", label: "Redemption PINs" },
  { slug: "payments", label: "Payments" },
];

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface RolePermission {
  page_slug: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface AssignedUser {
  id: string;
  user_id: string;
  profiles?: { name: string; email: string } | null;
}

const AdminCustomRoles = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [assignedUsers, setAssignedUsers] = useState<AssignedUser[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [assignUserId, setAssignUserId] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const fetchRoles = async () => {
    const { data } = await supabase
      .from("custom_admin_roles")
      .select("*")
      .order("created_at", { ascending: false });
    setRoles((data as CustomRole[]) || []);
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, name, email").order("name");
    setAllUsers(data || []);
  };

  useEffect(() => {
    fetchRoles();
    fetchAllUsers();
  }, []);

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("custom_admin_roles").insert({
      name: newRoleName.trim(),
      description: newRoleDesc.trim() || null,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role created" });
      setNewRoleName("");
      setNewRoleDesc("");
      fetchRoles();
    }
    setCreating(false);
  };

  const deleteRole = async (roleId: string) => {
    const { error } = await supabase.from("custom_admin_roles").delete().eq("id", roleId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role deleted" });
      if (selectedRole?.id === roleId) setSelectedRole(null);
      fetchRoles();
    }
  };

  const selectRole = async (role: CustomRole) => {
    setSelectedRole(role);

    const { data: perms } = await supabase
      .from("custom_role_permissions")
      .select("page_slug, can_view, can_edit, can_delete")
      .eq("role_id", role.id);

    // Build full permissions list
    const permMap: Record<string, RolePermission> = {};
    (perms || []).forEach((p) => {
      permMap[p.page_slug] = p;
    });
    const fullPerms = ADMIN_PAGES.map((page) => ({
      page_slug: page.slug,
      can_view: permMap[page.slug]?.can_view || false,
      can_edit: permMap[page.slug]?.can_edit || false,
      can_delete: permMap[page.slug]?.can_delete || false,
    }));
    setPermissions(fullPerms);

    // Fetch assigned users
    const { data: assigned } = await supabase
      .from("user_custom_roles")
      .select("id, user_id")
      .eq("custom_role_id", role.id);

    if (assigned && assigned.length > 0) {
      const userIds = assigned.map((a) => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const enriched = assigned.map((a) => ({
        ...a,
        profiles: profiles?.find((p) => p.id === a.user_id) || null,
      }));
      setAssignedUsers(enriched);
    } else {
      setAssignedUsers([]);
    }
  };

  const togglePermission = (pageSlug: string, field: "can_view" | "can_edit" | "can_delete") => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.page_slug !== pageSlug) return p;
        const updated = { ...p, [field]: !p[field] };
        // If removing view, also remove edit/delete
        if (field === "can_view" && !updated.can_view) {
          updated.can_edit = false;
          updated.can_delete = false;
        }
        // If adding edit or delete, ensure view is on
        if ((field === "can_edit" || field === "can_delete") && updated[field]) {
          updated.can_view = true;
        }
        return updated;
      })
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    setSavingPerms(true);

    // Delete existing then re-insert
    await supabase.from("custom_role_permissions").delete().eq("role_id", selectedRole.id);

    const toInsert = permissions
      .filter((p) => p.can_view || p.can_edit || p.can_delete)
      .map((p) => ({
        role_id: selectedRole.id,
        page_slug: p.page_slug,
        can_view: p.can_view,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase.from("custom_role_permissions").insert(toInsert);
      if (error) {
        toast({ title: "Error saving permissions", description: error.message, variant: "destructive" });
        setSavingPerms(false);
        return;
      }
    }

    toast({ title: "Permissions saved" });
    setSavingPerms(false);
  };

  const assignUser = async () => {
    if (!selectedRole || !assignUserId) return;
    const { error } = await supabase.from("user_custom_roles").insert({
      user_id: assignUserId,
      custom_role_id: selectedRole.id,
      assigned_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User assigned to role" });
      setAssignUserId("");
      setAssignDialogOpen(false);
      selectRole(selectedRole);
    }
  };

  const removeUserFromRole = async (assignmentId: string) => {
    const { error } = await supabase.from("user_custom_roles").delete().eq("id", assignmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "User removed from role" });
      if (selectedRole) selectRole(selectedRole);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Custom Roles Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create roles with specific page access and action permissions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Roles List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Roles</CardTitle>
              <CardDescription>Create and manage custom roles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Role name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                />
                <Button onClick={createRole} disabled={creating || !newRoleName.trim()} className="w-full gap-2">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Role
                </Button>
              </div>

              <div className="space-y-2">
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No custom roles yet</p>
                ) : (
                  roles.map((role) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRole?.id === role.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => selectRole(role)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-muted-foreground">{role.description}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRole(role.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions & Users */}
          <div className="lg:col-span-2 space-y-6">
            {selectedRole ? (
              <>
                {/* Page Permissions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Permissions for "{selectedRole.name}"
                    </CardTitle>
                    <CardDescription>
                      Select which pages this role can access and what actions they can perform
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-muted-foreground pb-2 border-b">
                        <span>Page</span>
                        <span className="text-center">View</span>
                        <span className="text-center">Edit</span>
                        <span className="text-center">Delete</span>
                      </div>
                      {permissions.map((perm) => {
                        const page = ADMIN_PAGES.find((p) => p.slug === perm.page_slug);
                        return (
                          <div key={perm.page_slug} className="grid grid-cols-4 gap-4 items-center py-2">
                            <span className="text-sm font-medium text-foreground">{page?.label}</span>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={perm.can_view}
                                onCheckedChange={() => togglePermission(perm.page_slug, "can_view")}
                              />
                            </div>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={perm.can_edit}
                                onCheckedChange={() => togglePermission(perm.page_slug, "can_edit")}
                              />
                            </div>
                            <div className="flex justify-center">
                              <Checkbox
                                checked={perm.can_delete}
                                onCheckedChange={() => togglePermission(perm.page_slug, "can_delete")}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Button onClick={savePermissions} disabled={savingPerms} className="mt-4 w-full gap-2">
                      {savingPerms ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      Save Permissions
                    </Button>
                  </CardContent>
                </Card>

                {/* Assigned Users */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Assigned Users
                      </CardTitle>
                      <CardDescription>Users with this role can login via the admin portal</CardDescription>
                    </div>
                    <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-1">
                          <UserPlus className="w-4 h-4" />
                          Assign User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign User to "{selectedRole.name}"</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Select User</Label>
                            <Select value={assignUserId} onValueChange={setAssignUserId}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose a user" />
                              </SelectTrigger>
                              <SelectContent>
                                {allUsers
                                  .filter((u) => !assignedUsers.some((a) => a.user_id === u.id))
                                  .map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.name} ({u.email})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={assignUser} disabled={!assignUserId} className="w-full">
                            Assign Role
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    {assignedUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No users assigned to this role yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {assignedUsers.map((au) => (
                          <div key={au.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                            <div>
                              <p className="font-medium text-foreground">{au.profiles?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{au.profiles?.email || ""}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUserFromRole(au.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Select a role to manage its permissions and users</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomRoles;

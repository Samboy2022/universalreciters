import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, CheckCircle, XCircle, Loader2, Plus, Edit, Wallet, ArrowRight } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  state: string;
  lga: string;
  ward: string;
  points: number;
  money_balance: number;
  is_active: boolean;
  created_at: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create User Form
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    state: "",
    lga: "",
    ward: "",
  });

  // Wallet Form
  const [walletAmount, setWalletAmount] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && !error) {
      setUsers(data);
      setFilteredUsers(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.state.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  const toggleUserActive = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !currentStatus })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error updating user", variant: "destructive" });
    } else {
      toast({ title: `User ${currentStatus ? "deactivated" : "activated"}` });
      fetchUsers();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: createForm.email,
        password: createForm.password,
        options: {
          data: {
            name: createForm.name,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Auth signup automatically creates a profile via trigger, but we need to update it with extra fields
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: createForm.name,
            state: createForm.state,
            lga: createForm.lga,
            ward: createForm.ward,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;
      }

      toast({ title: "User created successfully" });
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", password: "", state: "", lga: "", ward: "" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: selectedUser.name,
          state: selectedUser.state,
          lga: selectedUser.lga,
          ward: selectedUser.ward,
          points: selectedUser.points,
        })
        .eq("id", selectedUser.id);

      if (error) throw error;
      toast({ title: "User updated successfully" });
      setIsEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddBalance = async () => {
    if (!selectedUser || walletAmount <= 0) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase.rpc("admin_add_balance", {
        _user_id: selectedUser.id,
        _amount: walletAmount,
      });
      if (error) throw error;
      toast({ title: `Added ₦${walletAmount.toLocaleString()} to user wallet` });
      setWalletAmount(0);
      setIsWalletOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeductBalance = async () => {
    if (!selectedUser || walletAmount <= 0) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc("admin_deduct_balance" as any, {
        _user_id: selectedUser.id,
        _amount: walletAmount,
      });
      if (error) throw error;
      const result = data as any;
      if (result && !result.success) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: `Deducted ₦${walletAmount.toLocaleString()} from user wallet` });
      setWalletAmount(0);
      setIsWalletOpen(false);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentItems = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">View and manage user accounts</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users by name, email, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{users.filter((u) => u.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{users.filter((u) => !u.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Inactive</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Balance</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell className="text-muted-foreground">{user.email}</TableCell>
                          <TableCell>
                            <span className="text-xs truncate block max-w-[150px]">
                              {user.ward}, {user.lga}, {user.state}
                            </span>
                          </TableCell>
                          <TableCell>{user.points.toLocaleString()}</TableCell>
                          <TableCell>₦{Number(user.money_balance || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setSelectedUser(user); setIsWalletOpen(true); }}
                                title="Wallet"
                              >
                                <Wallet className="w-4 h-4 text-primary" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setSelectedUser(user); setIsEditOpen(true); }}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleUserActive(user.id, user.is_active)}
                                title={user.is_active ? "Deactivate" : "Activate"}
                              >
                                {user.is_active ? (
                                  <XCircle className="w-4 h-4 text-destructive" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {currentItems.map((user) => (
                    <Card key={user.id} className="overflow-hidden">
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-lg">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Points</p>
                            <p className="font-medium">{user.points.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Balance</p>
                            <p className="font-medium">₦{Number(user.money_balance || 0).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="font-medium text-xs">{user.ward}, {user.lga}, {user.state}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            className="flex-1"
                            variant="outline"
                            onClick={() => { setSelectedUser(user); setIsWalletOpen(true); }}
                          >
                            <Wallet className="w-4 h-4 mr-1" /> Wallet
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            variant="outline"
                            onClick={() => { setSelectedUser(user); setIsEditOpen(true); }}
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleUserActive(user.id, user.is_active)}
                          >
                            {user.is_active ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-success" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {!isLoading && filteredUsers.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Create User Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name</Label>
                <Input
                  id="create-name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Email</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Password</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-state">State</Label>
                  <Input
                    id="create-state"
                    value={createForm.state}
                    onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-lga">LGA</Label>
                  <Input
                    id="create-lga"
                    value={createForm.lga}
                    onChange={(e) => setCreateForm({ ...createForm, lga: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-ward">Ward</Label>
                <Input
                  id="create-ward"
                  value={createForm.ward}
                  onChange={(e) => setCreateForm({ ...createForm, ward: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email (Cannot be changed)</Label>
                  <Input value={selectedUser.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-state">State</Label>
                    <Input
                      id="edit-state"
                      value={selectedUser.state}
                      onChange={(e) => setSelectedUser({ ...selectedUser, state: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lga">LGA</Label>
                    <Input
                      id="edit-lga"
                      value={selectedUser.lga}
                      onChange={(e) => setSelectedUser({ ...selectedUser, lga: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-ward">Ward</Label>
                  <Input
                    id="edit-ward"
                    value={selectedUser.ward}
                    onChange={(e) => setSelectedUser({ ...selectedUser, ward: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-points">Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={selectedUser.points}
                    onChange={(e) => setSelectedUser({ ...selectedUser, points: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Wallet Management Dialog */}
        <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wallet Management</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6 py-4">
                <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">₦{Number(selectedUser.money_balance || 0).toLocaleString()}</p>
                  </div>
                  <Wallet className="w-8 h-8 text-primary opacity-50" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="wallet-amount">Amount (₦)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="wallet-amount"
                      type="number"
                      placeholder="Enter amount..."
                      value={walletAmount}
                      onChange={(e) => setWalletAmount(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleAddBalance} disabled={isProcessing || walletAmount <= 0}>
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Top Up"}
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={handleDeductBalance} disabled={isProcessing || walletAmount <= 0}>
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deduct"}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Top up credits the user's account. Deduct removes from their balance.</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Wallet as WalletIcon,
  Coins,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Key,
  Copy,
  TrendingUp,
  Clock,
  CheckCircle,
  Loader2,
  Building2,
  Send,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string | null;
  amount: number;
  points_amount: number | null;
  status: string;
  created_at: string;
}

interface Bank {
  id: string;
  name: string;
  code: string;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const Wallet = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [redemptionPin, setRedemptionPin] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  // Withdrawal state
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  // Paystack funding state
  const [fundAmount, setFundAmount] = useState("");
  const [fundingViaPaystack, setFundingViaPaystack] = useState(false);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setTransactions(data);
    setLoadingTx(false);
  };

  const fetchBanks = async () => {
    const { data } = await supabase
      .from("banks")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setBanks(data);
  };

  const fetchWithdrawalRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setWithdrawalRequests(data);
  };

  useEffect(() => {
    fetchTransactions();
    fetchBanks();
    fetchWithdrawalRequests();
  }, [user]);

  const handleRedeemPin = async () => {
    if (!redemptionPin || !user) {
      toast({ title: "Enter a valid PIN", variant: "destructive" });
      return;
    }
    setRedeeming(true);
    try {
      const { data, error } = await supabase.rpc("redeem_pin", {
        _pin_code: redemptionPin.toUpperCase(),
        _user_id: user.id,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; value?: number };
      if (!result.success) {
        toast({ title: result.error || "Invalid or already redeemed PIN", variant: "destructive" });
        setRedeeming(false);
        return;
      }
      await refreshProfile();
      fetchTransactions();
      toast({ title: "PIN Redeemed!", description: `₦${Number(result.value).toLocaleString()} added to your wallet` });
      setRedemptionPin("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  const handleBuyPoints = async () => {
    const amount = parseInt(buyAmount);
    if (!amount || amount < 1 || !user) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    const cost = amount * 70;
    if ((profile?.money_balance || 0) < cost) {
      toast({ title: "Insufficient balance", description: `You need ₦${cost.toLocaleString()}`, variant: "destructive" });
      return;
    }
    await supabase.from("profiles").update({
      money_balance: (profile?.money_balance || 0) - cost,
      points: (profile?.points || 0) + amount,
    }).eq("id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "debit", category: "buy_points",
      description: `Bought ${amount} points`, amount: cost, points_amount: amount, status: "completed",
    });
    await refreshProfile();
    fetchTransactions();
    setBuyAmount("");
    toast({ title: "Points purchased!", description: `${amount} points added` });
  };

  const handleSellPoints = async () => {
    const amount = parseInt(sellAmount);
    if (!amount || amount < 50 || !user) {
      toast({ title: "Minimum 50 points required", variant: "destructive" });
      return;
    }
    if ((profile?.points || 0) < amount) {
      toast({ title: "Insufficient points", variant: "destructive" });
      return;
    }
    const value = amount * 50;
    await supabase.from("profiles").update({
      points: (profile?.points || 0) - amount,
      money_balance: (profile?.money_balance || 0) + value,
    }).eq("id", user.id);
    await supabase.from("transactions").insert({
      user_id: user.id, type: "credit", category: "sell_points",
      description: `Sold ${amount} points`, amount: value, points_amount: -amount, status: "completed",
    });
    await refreshProfile();
    fetchTransactions();
    setSellAmount("");
    toast({ title: "Points sold!", description: `₦${value.toLocaleString()} added to balance` });
  };

  const handleWithdrawalRequest = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 1000 || !user) {
      toast({ title: "Minimum ₦1,000 required", variant: "destructive" });
      return;
    }
    if ((profile?.money_balance || 0) < amount) {
      toast({ title: "Insufficient balance", variant: "destructive" });
      return;
    }
    if (!selectedBankId || !accountNumber || !accountName) {
      toast({ title: "Please fill in all bank details", variant: "destructive" });
      return;
    }
    if (accountNumber.length < 10) {
      toast({ title: "Invalid account number", variant: "destructive" });
      return;
    }

    const bank = banks.find((b) => b.id === selectedBankId);
    if (!bank) return;

    setSubmittingWithdrawal(true);
    try {
      // Deduct balance immediately and hold it
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ money_balance: (profile?.money_balance || 0) - amount })
        .eq("id", user.id);
      if (updateError) throw updateError;

      // Create withdrawal request
      const { error: wError } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        amount,
        bank_name: bank.name,
        bank_code: bank.code,
        account_number: accountNumber,
        account_name: accountName,
      });
      if (wError) throw wError;

      // Record transaction
      await supabase.from("transactions").insert({
        user_id: user.id, type: "debit", category: "withdrawal",
        description: `Withdrawal to ${bank.name} - ${accountNumber}`, amount, status: "pending",
      });

      await refreshProfile();
      fetchTransactions();
      fetchWithdrawalRequests();
      setWithdrawAmount("");
      setAccountNumber("");
      setAccountName("");
      setSelectedBankId("");
      toast({ title: "Withdrawal request submitted!", description: "Admin will process your request shortly." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/register?ref=${profile?.referral_code || ""}`
    );
    toast({ title: "Referral link copied!" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="text-warning border-warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved": return <Badge variant="outline" className="text-success border-success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Points Balance</p>
                  <p className="text-3xl font-bold mt-1">{(profile?.points || 0).toLocaleString()}</p>
                  <p className="text-xs opacity-70 mt-1">≈ ₦{((profile?.points || 0) * 50).toLocaleString()}</p>
                </div>
                <Coins className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-accent text-accent-foreground">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Money Balance</p>
                  <p className="text-3xl font-bold mt-1">₦{Number(profile?.money_balance || 0).toLocaleString()}</p>
                  <p className="text-xs opacity-70 mt-1">Available for withdrawal</p>
                </div>
                <WalletIcon className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{transactions.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">All-time</p>
                </div>
                <TrendingUp className="w-10 h-10 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Points Transactions</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="buy">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="buy">Buy Points</TabsTrigger>
                  <TabsTrigger value="sell">Sell Points</TabsTrigger>
                </TabsList>
                <TabsContent value="buy" className="space-y-4 mt-4">
                  <div className="bg-muted rounded-lg p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">₦70 per point</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Number of Points</Label>
                    <Input type="number" placeholder="Enter amount" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} />
                    {buyAmount && <p className="text-sm text-muted-foreground">Cost: ₦{(parseInt(buyAmount) * 70).toLocaleString()}</p>}
                  </div>
                  <Button className="w-full" onClick={handleBuyPoints}><CreditCard className="w-4 h-4 mr-2" />Buy Points</Button>
                </TabsContent>
                <TabsContent value="sell" className="space-y-4 mt-4">
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Rate</span><span className="font-medium">₦50 per point</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Minimum</span><span className="font-medium">50 points</span></div>
                  </div>
                  <div className="space-y-2">
                    <Label>Points to Sell</Label>
                    <Input type="number" placeholder="Minimum 50" value={sellAmount} onChange={(e) => setSellAmount(e.target.value)} />
                    {sellAmount && parseInt(sellAmount) >= 50 && <p className="text-sm text-muted-foreground">You'll receive: ₦{(parseInt(sellAmount) * 50).toLocaleString()}</p>}
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleSellPoints}><ArrowUpRight className="w-4 h-4 mr-2" />Sell Points</Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Fund Wallet</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="pin">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="pin">Redemption PIN</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>
                <TabsContent value="pin" className="space-y-4 mt-4">
                  <div className="bg-accent/10 rounded-lg p-4 text-sm">
                    <p className="font-medium text-foreground mb-1">How it works:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Enter your redemption PIN code</li>
                      <li>• The PIN value will be added to your wallet</li>
                      <li>• Each PIN can only be used once</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter PIN Code</Label>
                    <Input placeholder="Enter your PIN" value={redemptionPin} onChange={(e) => setRedemptionPin(e.target.value.toUpperCase())} />
                  </div>
                  <Button className="w-full" onClick={handleRedeemPin} disabled={redeeming}>
                    {redeeming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    {redeeming ? "Redeeming..." : "Redeem PIN"}
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-4">
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">₦{Number(profile?.money_balance || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum</span>
                      <span className="font-medium">₦1,000</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Select Bank</Label>
                    <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                      <SelectTrigger><SelectValue placeholder="Choose your bank" /></SelectTrigger>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input placeholder="0123456789" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))} />
                  </div>

                  <div className="space-y-2">
                    <Label>Account Name</Label>
                    <Input placeholder="Your account name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount to Withdraw</Label>
                    <Input type="number" placeholder="Min ₦1,000" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                  </div>

                  <Button className="w-full" onClick={handleWithdrawalRequest} disabled={submittingWithdrawal}>
                    {submittingWithdrawal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Withdrawal Request
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests */}
        {withdrawalRequests.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Withdrawal Requests</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {withdrawalRequests.map((wr) => (
                  <div key={wr.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">₦{Number(wr.amount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{wr.bank_name} • {wr.account_number} • {wr.account_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(wr.created_at), { addSuffix: true })}</p>
                      {wr.admin_note && <p className="text-xs text-destructive mt-1">Note: {wr.admin_note}</p>}
                    </div>
                    {getStatusBadge(wr.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Referral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-success" />Referral Program</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Earn 1 point for every new user who registers with your referral link!</p>
            <div className="flex gap-2">
              <Input value={`${window.location.origin}/register?ref=${profile?.referral_code || ""}`} readOnly className="flex-1" />
              <Button variant="outline" onClick={copyReferralLink}><Copy className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {loadingTx ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-success/20" : "bg-destructive/20"}`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="w-5 h-5 text-success" /> : <ArrowUpRight className="w-5 h-5 text-destructive" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{tx.description || tx.category}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${tx.type === "credit" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "credit" ? "+" : "-"}₦{Number(tx.amount).toLocaleString()}
                      </p>
                      {tx.points_amount && (
                        <p className="text-xs text-muted-foreground">{tx.points_amount > 0 ? "+" : ""}{tx.points_amount} pts</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;

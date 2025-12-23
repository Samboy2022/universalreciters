import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

const transactions = [
  { id: 1, type: "credit", description: "Point Maturity Bonus", amount: 100, date: "Today" },
  { id: 2, type: "debit", description: "Recitation Fee", amount: -30, date: "Today" },
  { id: 3, type: "credit", description: "Referral Bonus", amount: 1, date: "Yesterday", isPoints: true },
  { id: 4, type: "credit", description: "Recitation Completed", amount: 1, date: "Yesterday", isPoints: true },
  { id: 5, type: "debit", description: "Video Unlock", amount: -3, date: "2 days ago" },
];

const Wallet = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [redemptionPin, setRedemptionPin] = useState("");

  const handleBuyPoints = () => {
    const amount = parseInt(buyAmount);
    if (!amount || amount < 1) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Processing...", 
      description: `Buying ${amount} points for ₦${amount * 70}` 
    });
  };

  const handleSellPoints = () => {
    const amount = parseInt(sellAmount);
    if (!amount || amount < 50) {
      toast({ 
        title: "Minimum 50 points required", 
        variant: "destructive" 
      });
      return;
    }
    toast({ 
      title: "Sale initiated", 
      description: `Selling ${amount} points for ₦${amount * 50}` 
    });
  };

  const handleWithdraw = () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 1000) {
      toast({ 
        title: "Minimum ₦1,000 required", 
        variant: "destructive" 
      });
      return;
    }
    toast({ 
      title: "Withdrawal initiated", 
      description: `₦${amount} will be sent to your bank account` 
    });
  };

  const handleRedeemPin = () => {
    if (!redemptionPin || redemptionPin.length !== 12) {
      toast({ 
        title: "Invalid PIN", 
        description: "Please enter a valid 12-digit PIN",
        variant: "destructive" 
      });
      return;
    }
    toast({ 
      title: "PIN Redeemed!", 
      description: "₦100 added to your wallet" 
    });
    setRedemptionPin("");
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://universalreciters.com/ref/${user?.referralCode || "DEMO123"}`);
    toast({ title: "Referral link copied!" });
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
                  <p className="text-3xl font-bold mt-1">
                    {(user?.wallet?.points || 150).toLocaleString()}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    ≈ ₦{((user?.wallet?.points || 150) * 50).toLocaleString()}
                  </p>
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
                  <p className="text-3xl font-bold mt-1">
                    ₦{(user?.wallet?.money || 5000).toLocaleString()}
                  </p>
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
                  <p className="text-sm text-muted-foreground">Maturing Points</p>
                  <p className="text-3xl font-bold text-foreground mt-1">25</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    In 18 days → ₦2,500
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Points Transactions</CardTitle>
            </CardHeader>
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
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                    />
                    {buyAmount && (
                      <p className="text-sm text-muted-foreground">
                        Cost: ₦{(parseInt(buyAmount) * 70).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button className="w-full" onClick={handleBuyPoints}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy with Paystack
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="space-y-4 mt-4">
                  <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">₦50 per point</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Minimum</span>
                      <span className="font-medium">50 points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">30-Day Maturity Rate</span>
                      <span className="font-medium text-success">₦100 per point</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Points to Sell</Label>
                    <Input
                      type="number"
                      placeholder="Minimum 50"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                    />
                    {sellAmount && parseInt(sellAmount) >= 50 && (
                      <p className="text-sm text-muted-foreground">
                        You'll receive: ₦{(parseInt(sellAmount) * 50).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleSellPoints}>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Sell Points
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fund Wallet</CardTitle>
            </CardHeader>
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
                      <li>• Each PIN = ₦100</li>
                      <li>• Buy ₦2,000 bundle = 21 PINs</li>
                      <li>• Share extra PINs with friends</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter 12-Digit PIN</Label>
                    <Input
                      placeholder="XXXXXXXXXXXX"
                      value={redemptionPin}
                      onChange={(e) => setRedemptionPin(e.target.value.toUpperCase())}
                      maxLength={12}
                    />
                  </div>
                  <Button className="w-full" onClick={handleRedeemPin}>
                    <Key className="w-4 h-4 mr-2" />
                    Redeem PIN
                  </Button>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-4">
                  <div className="bg-muted rounded-lg p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available</span>
                      <span className="font-medium">₦{(user?.wallet?.money || 5000).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">Minimum</span>
                      <span className="font-medium">₦1,000</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount to Withdraw</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" variant="outline" onClick={handleWithdraw}>
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Withdraw to Bank
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Referral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              Referral Program
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Earn 1 point for every new user who registers with your referral link!
            </p>
            <div className="flex gap-2">
              <Input
                value={`universalreciters.com/ref/${user?.referralCode || "DEMO123"}`}
                readOnly
                className="flex-1"
              />
              <Button variant="outline" onClick={copyReferralLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "credit" ? "bg-success/20" : "bg-destructive/20"
                  }`}>
                    {tx.type === "credit" ? (
                      <ArrowDownLeft className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                  <div className={`font-semibold ${
                    tx.type === "credit" ? "text-success" : "text-destructive"
                  }`}>
                    {tx.type === "credit" ? "+" : ""}{tx.amount}{tx.isPoints ? " pts" : ""}
                    {!tx.isPoints && tx.type === "debit" && " ₦"}
                    {!tx.isPoints && tx.type === "credit" && " ₦"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Wallet;

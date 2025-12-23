import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/ui/Logo";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Key, CheckCircle } from "lucide-react";

const Payment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [redemptionPin, setRedemptionPin] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePaystackPayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful!",
        description: "Your account has been activated. Welcome to Universal Reciters!",
      });
      navigate("/dashboard");
    }, 2000);
  };

  const handleRedemptionPin = async () => {
    if (!redemptionPin || redemptionPin.length !== 12) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a valid 12-digit redemption PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "PIN Redeemed!",
        description: "₦100 has been added to your wallet.",
      });
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero islamic-pattern p-4">
      <Card className="w-full max-w-md shadow-glow">
        <CardHeader className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <CardTitle className="text-2xl">Activate Your Account</CardTitle>
          <CardDescription>
            Pay ₦1,000 to activate your account and start learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="paystack" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paystack" className="gap-2">
                <CreditCard className="w-4 h-4" />
                Paystack
              </TabsTrigger>
              <TabsTrigger value="pin" className="gap-2">
                <Key className="w-4 h-4" />
                Redemption PIN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paystack" className="mt-6">
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Registration Fee</span>
                    <span className="font-semibold text-foreground">₦1,000</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Processing Fee</span>
                    <span className="font-semibold text-foreground">₦0</span>
                  </div>
                  <div className="border-t border-border mt-3 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">Total</span>
                      <span className="font-bold text-primary text-lg">₦1,000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Unlimited access to recitation videos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>AI-powered voice checking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Compete and earn rewards</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePaystackPayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Pay with Paystack"
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pin" className="mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pin">Redemption PIN</Label>
                  <Input
                    id="pin"
                    placeholder="Enter your 12-digit PIN"
                    value={redemptionPin}
                    onChange={(e) => setRedemptionPin(e.target.value)}
                    maxLength={12}
                  />
                  <p className="text-xs text-muted-foreground">
                    Each redemption PIN is worth ₦100. You need 10 PINs (₦1,000) to activate.
                  </p>
                </div>

                <div className="bg-accent/10 rounded-lg p-4 text-sm">
                  <h4 className="font-medium text-foreground mb-2">How to get Redemption PINs</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Purchase from authorized agents</li>
                    <li>• Buy with Paystack (₦2,000 = 21 PINs)</li>
                    <li>• Receive from referrals</li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  onClick={handleRedemptionPin}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    "Redeem PIN"
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Payment;

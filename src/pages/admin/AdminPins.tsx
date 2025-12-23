import { useState, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Key, Plus, Download, Loader2, Copy, Check } from "lucide-react";

interface PinData {
  id: string;
  pin_code: string;
  value: number;
  is_redeemed: boolean;
  redeemed_at: string | null;
  created_at: string;
}

const generatePin = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 12; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
};

const AdminPins = () => {
  const [pins, setPins] = useState<PinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quantity, setQuantity] = useState(10);
  const [pinValue, setPinValue] = useState(100);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPins = async () => {
    const { data, error } = await supabase
      .from("redemption_pins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (data && !error) {
      setPins(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPins();
  }, []);

  const handleGeneratePins = async () => {
    if (quantity < 1 || quantity > 100) {
      toast({ title: "Quantity must be between 1 and 100", variant: "destructive" });
      return;
    }

    setIsGenerating(true);

    try {
      const newPins = Array.from({ length: quantity }, () => ({
        pin_code: generatePin(),
        value: pinValue,
        created_by: user?.id,
      }));

      const { error } = await supabase.from("redemption_pins").insert(newPins);

      if (error) throw error;

      toast({ title: `${quantity} PINs generated successfully!` });
      fetchPins();
    } catch (error: any) {
      toast({
        title: "Error generating PINs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const exportPins = () => {
    const unusedPins = pins.filter((p) => !p.is_redeemed);
    const csv = ["PIN Code,Value,Created At"]
      .concat(unusedPins.map((p) => `${p.pin_code},₦${p.value},${new Date(p.created_at).toLocaleDateString()}`))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pins-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const unusedCount = pins.filter((p) => !p.is_redeemed).length;
  const redeemedCount = pins.filter((p) => p.is_redeemed).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Redemption PINs</h1>
          <p className="text-muted-foreground">Generate and manage redemption codes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{pins.length}</p>
              <p className="text-sm text-muted-foreground">Total PINs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-success">{unusedCount}</p>
              <p className="text-sm text-muted-foreground">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{redeemedCount}</p>
              <p className="text-sm text-muted-foreground">Redeemed</p>
            </CardContent>
          </Card>
        </div>

        {/* Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Generate New PINs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity (1-100)</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  min={1}
                  max={100}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Value (₦)</Label>
                <Input
                  id="value"
                  type="number"
                  value={pinValue}
                  onChange={(e) => setPinValue(parseInt(e.target.value) || 0)}
                  min={1}
                  className="w-32"
                />
              </div>
              <Button onClick={handleGeneratePins} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Generate
              </Button>
              <Button variant="outline" onClick={exportPins} disabled={unusedCount === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export Unused
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* PINs Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pins.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No PINs generated yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Redeemed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pins.map((pin) => (
                    <TableRow key={pin.id}>
                      <TableCell className="font-mono font-medium">{pin.pin_code}</TableCell>
                      <TableCell>₦{pin.value}</TableCell>
                      <TableCell>
                        <Badge variant={pin.is_redeemed ? "secondary" : "default"}>
                          {pin.is_redeemed ? "Redeemed" : "Available"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(pin.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {pin.redeemed_at ? new Date(pin.redeemed_at).toLocaleDateString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {!pin.is_redeemed && (
                          <Button size="sm" variant="ghost" onClick={() => copyPin(pin.pin_code)}>
                            {copiedPin === pin.pin_code ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPins;

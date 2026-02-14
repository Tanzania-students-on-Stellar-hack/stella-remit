import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBalance } from "@/lib/stellar";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeftRight, ArrowDown, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const ASSETS = [
  { code: "XLM", label: "Stellar Lumens (XLM)" },
  { code: "USDC", label: "Test USDC" },
];

const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  XLM: { USDC: 0.12, XLM: 1 },
  USDC: { XLM: 8.33, USDC: 1 },
};

const convertSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, "Amount must be greater than 0"),
});

const Convert = () => {
  const { profile } = useAuth();
  const [fromAsset, setFromAsset] = useState("XLM");
  const [toAsset, setToAsset] = useState("USDC");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<{ asset: string; balance: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile?.stellar_public_key) {
      getBalance(profile.stellar_public_key).then(setBalances);
    }
  }, [profile?.stellar_public_key]);

  const rate = EXCHANGE_RATES[fromAsset]?.[toAsset] ?? 0;
  const convertedAmount = amount && !isNaN(parseFloat(amount)) ? (parseFloat(amount) * rate).toFixed(4) : "0.0000";
  const fromBalance = balances.find((b) => b.asset === fromAsset)?.balance || "0";

  const handleSwapDirection = () => {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
    setAmount("");
    setErrors({});
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!profile?.stellar_public_key) {
      toast.error("Please create a wallet first");
      return;
    }

    const parsed = convertSchema.safeParse({ amount });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (parseFloat(amount) > parseFloat(fromBalance)) {
      setErrors({ amount: "Insufficient balance" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        sender_id: profile.user_id || "",
        receiver_id: profile.user_id || "",
        amount: parseFloat(amount),
        asset: `${fromAsset}→${toAsset}`,
        memo: `Convert ${amount} ${fromAsset} to ${convertedAmount} ${toAsset}`,
        status: "completed",
        tx_hash: `sim_${Date.now()}`,
      });

      if (error) throw error;
      toast.success(`Converted ${amount} ${fromAsset} to ${convertedAmount} ${toAsset}`);
      setAmount("");
      const b = await getBalance(profile.stellar_public_key);
      setBalances(b);
    } catch (err: any) {
      toast.error(err.message || "Conversion failed");
    }
    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-serif">Convert Assets</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-accent" /> Swap Assets
            </CardTitle>
            <CardDescription>Convert between XLM and test stablecoins</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConvert} className="space-y-4">
              {/* From */}
              <div className="space-y-2">
                <Label>From</Label>
                <div className="flex gap-3">
                  <Select value={fromAsset} onValueChange={(v) => { setFromAsset(v); if (v === toAsset) setToAsset(fromAsset); setErrors({}); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSETS.map((a) => (
                        <SelectItem key={a.code} value={a.code}>{a.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex-1">
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setErrors({}); }}
                      placeholder="0.00"
                      className={errors.amount ? "border-destructive" : ""}
                    />
                    {errors.amount && (
                      <p className="text-xs text-destructive mt-1">{errors.amount}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Available: {parseFloat(fromBalance).toFixed(2)} {fromAsset}
                </p>
              </div>

              {/* Swap direction button */}
              <div className="flex justify-center">
                <Button type="button" variant="ghost" size="icon" onClick={handleSwapDirection} className="rounded-full border border-border">
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              {/* To */}
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex gap-3">
                  <Select value={toAsset} onValueChange={(v) => { setToAsset(v); if (v === fromAsset) setFromAsset(toAsset); }}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSETS.map((a) => (
                        <SelectItem key={a.code} value={a.code}>{a.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={convertedAmount}
                    readOnly
                    className="flex-1 bg-muted"
                  />
                </div>
              </div>

              {/* Rate info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
                <Info className="h-3.5 w-3.5" />
                <span>1 {fromAsset} ≈ {rate} {toAsset} (simulated testnet rate)</span>
              </div>

              <Button type="submit" className="w-full" disabled={loading || !profile?.stellar_public_key || fromAsset === toAsset}>
                {loading ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Converting...</>
                ) : (
                  `Convert ${fromAsset} to ${toAsset}`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <p>
                This is a testnet demonstration. In production, conversions would use Stellar's built-in
                decentralized exchange (SDEX) with real market rates and path payments for optimal pricing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Convert;

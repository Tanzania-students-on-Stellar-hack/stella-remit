import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { txExplorerUrl } from "@/lib/stellar";
import { Send, CheckCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const sendSchema = z.object({
  recipient: z.string().trim().min(1, "Recipient is required").max(256),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than 0"),
  memo: z.string().max(28, "Memo must be under 28 characters").optional(),
});

const SendMoney = () => {
  const { profile } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!profile?.stellar_public_key) {
      toast.error("Please create a wallet first");
      return;
    }

    const parsed = sendSchema.safeParse({ recipient, amount, memo });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      // Get user's secret key from localStorage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let secretKey = localStorage.getItem(`stellar_secret_${user.id}`);
      
      if (!secretKey) {
        secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
        if (!secretKey) throw new Error("Secret key required");
      }

      // Validate secret key format
      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S', not 'G'.");
      }

      // Import Stellar SDK and send payment
      const { Keypair, TransactionBuilder, Operation, Asset, Memo } = await import("@stellar/stellar-sdk");
      const { server, networkPassphrase } = await import("@/lib/stellar");

      const senderKeypair = Keypair.fromSecret(secretKey);
      const account = await server.loadAccount(senderKeypair.publicKey());
      const fee = await server.fetchBaseFee();

      const txBuilder = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: networkPassphrase,
      });

      txBuilder.addOperation(
        Operation.payment({
          destination: recipient.trim(),
          asset: Asset.native(),
          amount: amount.trim(),
        })
      );

      if (memo.trim()) {
        txBuilder.addMemo(Memo.text(memo.trim()));
      }

      txBuilder.setTimeout(30);
      const tx = txBuilder.build();
      tx.sign(senderKeypair);

      const result = await server.submitTransaction(tx);

      // Try to save transaction to database (optional - won't fail if receiver not found)
      try {
        const { data: receiverProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("stellar_public_key", recipient.trim())
          .maybeSingle();

        await supabase.from("transactions").insert({
          sender_id: user.id,
          receiver_id: receiverProfile?.user_id || user.id,
          amount: parseFloat(amount),
          asset: "XLM",
          memo: memo.trim() || null,
          tx_hash: result.hash,
          status: "completed",
        });
      } catch (dbError) {
        console.warn("Failed to save transaction to database:", dbError);
        // Don't fail the payment if database save fails
      }

      setTxHash(result.hash);
      toast.success("Payment sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send payment");
    }
    setLoading(false);
  };

  if (txHash) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
              <h2 className="text-2xl font-bold font-serif mb-2">Payment Sent!</h2>
              <p className="text-muted-foreground mb-6">
                Your payment of {amount} XLM has been sent successfully.
              </p>
              <code className="text-xs bg-muted px-3 py-2 rounded block break-all mb-4">
                {txHash}
              </code>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <a href={txExplorerUrl(txHash)} target="_blank" rel="noopener noreferrer">
                    View on Explorer <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button onClick={() => { setTxHash(null); setAmount(""); setRecipient(""); setMemo(""); }}>
                  Send Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold font-serif mb-6">Send Money</h1>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Send className="h-5 w-5 text-accent" /> Transfer Funds
            </CardTitle>
            <CardDescription>Send XLM to any Stellar address (Mainnet — real funds)</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Address</Label>
                <Input
                  value={recipient}
                  onChange={(e) => { setRecipient(e.target.value); setErrors({}); }}
                  placeholder="G... (Stellar public key)"
                  required
                  maxLength={256}
                  className={errors.recipient ? "border-destructive" : ""}
                />
                {errors.recipient && <p className="text-xs text-destructive">{errors.recipient}</p>}
              </div>
              <div className="space-y-2">
                <Label>Amount (XLM)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); setErrors({}); }}
                  placeholder="100.00"
                  required
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              </div>
              <div className="space-y-2">
                <Label>Memo (optional)</Label>
                <Input
                  value={memo}
                  onChange={(e) => { setMemo(e.target.value); setErrors({}); }}
                  placeholder="e.g., Tuition payment"
                  maxLength={28}
                  className={errors.memo ? "border-destructive" : ""}
                />
                {errors.memo && <p className="text-xs text-destructive">{errors.memo}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading || !profile?.stellar_public_key}>
                {loading ? "Sending..." : "Send Payment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SendMoney;

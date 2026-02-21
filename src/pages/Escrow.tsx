import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

const escrowSchema = z.object({
  recipientKey: z.string().trim().min(1, "Recipient address required").max(256),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be > 0"),
  deadline: z.string().min(1, "Deadline required"),
});

interface EscrowRecord {
  id: string;
  creator_id: string;
  recipient_id: string;
  recipient_address?: string; // Optional for backward compatibility
  escrow_public_key?: string;
  amount: number;
  asset: string;
  status: string;
  deadline: string;
  created_at: string;
  tx_hashes?: any[];
}

const Escrow = () => {
  const { user, profile } = useAuth();
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [recipientKey, setRecipientKey] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchEscrows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("escrows")
      .select("*")
      .order("created_at", { ascending: false });
    setEscrows((data as EscrowRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      escrowSchema.parse({ recipientKey, amount, deadline });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setCreating(true);
    try {
      // Get user's secret key
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      let secretKey = localStorage.getItem(`stellar_secret_${currentUser.id}`);
      
      if (!secretKey) {
        secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
        if (!secretKey) throw new Error("Secret key required");
      }

      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S'.");
      }

      // Import Stellar SDK
      const { Keypair, TransactionBuilder, Operation, Asset, Memo } = await import("@stellar/stellar-sdk");
      const { server, networkPassphrase } = await import("@/lib/stellar");

      // Validate recipient account exists
      try {
        await server.loadAccount(recipientKey.trim());
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error("Recipient account not found. The account needs to be funded first.");
        }
        throw error;
      }

      const creatorKeypair = Keypair.fromSecret(secretKey);
      
      // Create escrow keypair
      const escrowKeypair = Keypair.random();
      
      const creatorAccount = await server.loadAccount(creatorKeypair.publicKey());
      const fee = await server.fetchBaseFee();
      const escrowFundAmount = (parseFloat(amount) + 2).toFixed(7);

      // Create and fund escrow account
      const createTx = new TransactionBuilder(creatorAccount, {
        fee: fee.toString(),
        networkPassphrase: networkPassphrase,
      })
        .addOperation(Operation.createAccount({
          destination: escrowKeypair.publicKey(),
          startingBalance: escrowFundAmount,
        }))
        .addMemo(Memo.text("Escrow deposit"))
        .setTimeout(30)
        .build();

      createTx.sign(creatorKeypair);
      const payResult = await server.submitTransaction(createTx);

      // Look up recipient
      const { data: recipientProfile, error: lookupError } = await supabase
        .from("profiles")
        .select("user_id, stellar_public_key")
        .eq("stellar_public_key", recipientKey.trim())
        .maybeSingle();

      console.log("Recipient lookup:", {
        recipientKey: recipientKey.trim(),
        recipientProfile,
        lookupError,
        foundUser: recipientProfile?.user_id
      });
      
      // Also try to find all profiles to debug
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("user_id, stellar_public_key")
        .limit(10);
      
      console.log("All profiles in database:", allProfiles);

      // Store escrow record
      const { error: insertError } = await supabase.from("escrows").insert({
        creator_id: currentUser.id,
        recipient_id: recipientProfile?.user_id || null, // Use null if recipient not found
        recipient_address: recipientKey.trim(), // Store the actual recipient address
        amount: parseFloat(amount),
        asset: "XLM",
        status: "pending",
        deadline: new Date(deadline).toISOString(),
        escrow_public_key: escrowKeypair.publicKey(),
        tx_hashes: [payResult.hash],
      });

      if (insertError) throw insertError;

      // Store escrow secret for later release (in production, use secure vault)
      localStorage.setItem(`escrow_secret_${escrowKeypair.publicKey()}`, escrowKeypair.secret());

      toast.success("Escrow created! Funds are locked until recipient releases.");
      setRecipientKey("");
      setAmount("");
      setDeadline("");
      await fetchEscrows();
    } catch (err: any) {
      toast.error(err.message || "Failed to create escrow");
    }
    setCreating(false);
  };

  const handleRelease = async (escrowId: string) => {
    try {
      // Get escrow details
      const { data: escrow, error: escrowError } = await supabase
        .from("escrows")
        .select("*")
        .eq("id", escrowId)
        .single();

      if (escrowError || !escrow) throw new Error("Escrow not found");
      if (escrow.status !== "pending") throw new Error("Escrow is not pending");

      // Get recipient's secret key
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");
      if (escrow.recipient_id !== currentUser.id) throw new Error("Only recipient can release");

      // Get recipient's Stellar address from escrow record
      let recipientAddress = escrow.recipient_address;
      
      console.log("Escrow data:", {
        escrow_id: escrow.id,
        recipient_id: escrow.recipient_id,
        recipient_address: escrow.recipient_address,
        current_user: currentUser.id
      });
      
      // Fallback: if old escrow without recipient_address, look it up from profile
      if (!recipientAddress) {
        console.log("No recipient_address in escrow, looking up from profile...");
        
        const { data: recipientProfile, error: profileError } = await supabase
          .from("profiles")
          .select("stellar_public_key")
          .eq("user_id", escrow.recipient_id)
          .single();
        
        console.log("Profile lookup result:", { recipientProfile, profileError });
        
        if (profileError || !recipientProfile?.stellar_public_key) {
          throw new Error("Recipient address not found. The recipient needs to create a wallet first, or create a new escrow.");
        }
        
        recipientAddress = recipientProfile.stellar_public_key;
        console.log("Using recipient address from profile:", recipientAddress);
      } else {
        console.log("Using recipient address from escrow:", recipientAddress);
      }

      // Get escrow secret from localStorage
      const escrowSecret = localStorage.getItem(`escrow_secret_${escrow.escrow_public_key}`);
      if (!escrowSecret) {
        throw new Error("Escrow secret not found. The creator needs to provide it.");
      }

      // Import Stellar SDK
      const { Keypair, TransactionBuilder, Operation, Asset, Memo } = await import("@stellar/stellar-sdk");
      const { server, networkPassphrase } = await import("@/lib/stellar");

      const escrowKeypair = Keypair.fromSecret(escrowSecret);

      // Load escrow account
      const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());
      const fee = await server.fetchBaseFee();

      // Build transaction to release funds from escrow to recipient
      const releaseTx = new TransactionBuilder(escrowAccount, {
        fee: fee.toString(),
        networkPassphrase: networkPassphrase,
      })
        .addOperation(Operation.payment({
          destination: recipientAddress, // Use the recipient address (from record or profile)
          asset: Asset.native(),
          amount: escrow.amount.toString(),
        }))
        .addMemo(Memo.text("Escrow release"))
        .setTimeout(30)
        .build();

      releaseTx.sign(escrowKeypair);
      
      console.log("Submitting release transaction...");
      const result = await server.submitTransaction(releaseTx);
      console.log("Transaction successful:", result.hash);

      // Update escrow status
      const txHashes = [...(escrow.tx_hashes || []), result.hash];
      await supabase
        .from("escrows")
        .update({ status: "released", tx_hashes: txHashes })
        .eq("id", escrowId);

      // Record transaction
      await supabase.from("transactions").insert({
        sender_id: escrow.creator_id,
        receiver_id: escrow.recipient_id,
        amount: escrow.amount,
        asset: escrow.asset,
        memo: "Escrow release",
        tx_hash: result.hash,
        status: "completed",
      });

      toast.success(`Escrow released! TX: ${result.hash.substring(0, 10)}...`);
      await fetchEscrows();
    } catch (err: any) {
      console.error("Release error:", err);
      
      // Better error messages
      let errorMessage = err.message || "Failed to release escrow";
      
      if (err.response?.data?.extras?.result_codes) {
        const codes = err.response.data.extras.result_codes;
        console.error("Stellar error codes:", codes);
        errorMessage = `Transaction failed: ${codes.transaction || codes.operations?.[0] || 'Unknown error'}`;
      }
      
      toast.error(errorMessage);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "released") return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === "expired") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-serif">Escrow</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" /> Create Escrow
            </CardTitle>
            <CardDescription>Hold funds until the recipient confirms</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Stellar Address</Label>
                <Input
                  value={recipientKey}
                  onChange={(e) => setRecipientKey(e.target.value)}
                  placeholder="G..."
                  required
                  maxLength={256}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (XLM)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Escrow"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm">Your Escrows</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : escrows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No escrows yet</div>
            ) : (
              <div className="divide-y divide-border">
                {escrows.map((esc) => {
                  const isCreator = esc.creator_id === user?.id;
                  
                  // Check if current user is recipient by comparing Stellar addresses
                  const userPublicKey = profile?.stellar_public_key;
                  const isRecipientByAddress = userPublicKey && esc.recipient_address && 
                    userPublicKey.toLowerCase() === esc.recipient_address.toLowerCase();
                  
                  const isRecipient = esc.recipient_id === user?.id || isRecipientByAddress;
                  const hasNoRecipientUser = !esc.recipient_id; // Recipient not in system
                  
                  return (
                  <div key={esc.id} className="px-6 py-4 flex items-center gap-4">
                    {statusIcon(esc.status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium font-sans">{esc.amount} {esc.asset}</div>
                      <div className="text-xs text-muted-foreground">
                        Deadline: {format(new Date(esc.deadline), "MMM d, yyyy h:mm a")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isCreator && "You created this"} 
                        {isRecipient && !isCreator && " • You are the recipient"}
                        {hasNoRecipientUser && !isRecipient && " • Recipient not in system"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        esc.status === "released" ? "bg-success/10 text-success" :
                        esc.status === "expired" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {esc.status}
                      </span>
                      {esc.status === "pending" && isRecipient && !isCreator && (
                        <Button size="sm" variant="outline" onClick={() => handleRelease(esc.id)}>
                          Release
                        </Button>
                      )}
                      {esc.status === "pending" && hasNoRecipientUser && !isRecipient && (
                        <span className="text-xs text-muted-foreground">
                          Recipient must log in to release
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Escrow;

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Clock, CheckCircle } from "lucide-react";
import { createSorobanEscrow, releaseSorobanEscrow, ESCROW_CONTRACT_ID } from "@/lib/soroban";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function SorobanEscrow() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("24");
  const [escrowId, setEscrowId] = useState("");

  const handleCreateEscrow = async () => {
    if (!recipientAddress || !amount) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // In production, get this from your auth context
      const secretKey = prompt("Enter your Stellar secret key:");
      if (!secretKey) throw new Error("Secret key required");

      const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      const deadline = Math.floor(Date.now() / 1000) + parseInt(hours) * 3600;

      const result = await createSorobanEscrow(
        sourceKeypair,
        recipientAddress,
        amount,
        deadline
      );

      toast({
        title: "Escrow created!",
        description: `Transaction hash: ${result.hash}`,
      });

      setRecipientAddress("");
      setAmount("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!escrowId) {
      toast({
        title: "Missing escrow ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const secretKey = prompt("Enter your Stellar secret key:");
      if (!secretKey) throw new Error("Secret key required");

      const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);

      const result = await releaseSorobanEscrow(sourceKeypair, escrowId);

      toast({
        title: "Escrow released!",
        description: `Transaction hash: ${result.hash}`,
      });

      setEscrowId("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Soroban Smart Contract Escrow</h1>
          <p className="text-muted-foreground mt-2">
            Secure escrow powered by Soroban smart contracts on Stellar
          </p>
        </div>

        {ESCROW_CONTRACT_ID.startsWith("CX") && (
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">
                ⚠️ Contract Not Deployed Yet
              </CardTitle>
              <CardDescription className="text-yellow-700 dark:text-yellow-300 space-y-2">
                <p>To use Soroban smart contracts, you need to deploy the Rust contract first.</p>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="font-semibold">Quick Start:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Install Rust: <a href="https://rustup.rs/" target="_blank" rel="noopener" className="underline">rustup.rs</a></li>
                    <li>Install Soroban CLI: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">cargo install soroban-cli</code></li>
                    <li>Build contract: <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">cd contracts/escrow && cargo build --release</code></li>
                    <li>Deploy to testnet (see DEPLOY_SOROBAN_NOW.md)</li>
                    <li>Update contract ID in src/lib/soroban.ts</li>
                  </ol>
                  <p className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                    <strong>For hackathon demo:</strong> Focus on the Cross-Border Payment feature at <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">/cross-border</code> - it works perfectly without Soroban deployment!
                  </p>
                </div>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Create Escrow
              </CardTitle>
              <CardDescription>
                Lock funds in a smart contract until deadline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (XLM)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Lock Duration (hours)</Label>
                <Input
                  id="hours"
                  type="number"
                  placeholder="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>

              <Button
                onClick={handleCreateEscrow}
                disabled={loading || ESCROW_CONTRACT_ID.startsWith("CX")}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Create Escrow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Release Escrow
              </CardTitle>
              <CardDescription>
                Claim funds from an existing escrow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="escrowId">Escrow ID</Label>
                <Input
                  id="escrowId"
                  type="number"
                  placeholder="0"
                  value={escrowId}
                  onChange={(e) => setEscrowId(e.target.value)}
                />
              </div>

              <Button
                onClick={handleReleaseEscrow}
                disabled={loading || ESCROW_CONTRACT_ID.startsWith("CX")}
                className="w-full"
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Release Escrow
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Create Escrow:</strong> Funds are locked in a Soroban smart contract with a deadline.
            </p>
            <p>
              <strong>2. Wait for Deadline:</strong> Neither party can access funds until the deadline passes.
            </p>
            <p>
              <strong>3. Release:</strong> Recipient can claim funds after deadline, or creator can refund if unclaimed.
            </p>
            <p className="text-muted-foreground">
              Contract ID: <code className="text-xs">{ESCROW_CONTRACT_ID}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

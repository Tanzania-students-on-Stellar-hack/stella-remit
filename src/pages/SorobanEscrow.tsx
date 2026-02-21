import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Clock, CheckCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createSorobanEscrow, releaseSorobanEscrow, getEscrowDetails, getContractCounter, ESCROW_CONTRACT_ID } from "@/lib/soroban";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function SorobanEscrow() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [hours, setHours] = useState("24");
  const [timeUnit, setTimeUnit] = useState<"seconds" | "minutes" | "hours" | "days">("hours");
  const [escrowId, setEscrowId] = useState("");
  const [createdEscrows, setCreatedEscrows] = useState<Array<{
    id: string;
    recipient: string;
    amount: string;
    deadline: number;
    txHash: string;
  }>>([]);

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
      
      // Calculate deadline based on time unit
      const timeMultipliers = {
        seconds: 1,
        minutes: 60,
        hours: 3600,
        days: 86400,
      };
      
      const durationInSeconds = parseInt(hours) * timeMultipliers[timeUnit];
      const deadline = Math.floor(Date.now() / 1000) + durationInSeconds;

      const result = await createSorobanEscrow(
        sourceKeypair,
        recipientAddress,
        amount,
        deadline
      );

      // Extract escrow ID from result
      const newEscrowId = result.result ? StellarSdk.scValToNative(result.result) : "0";

      // Save to local list
      const newEscrow = {
        id: newEscrowId.toString(),
        recipient: recipientAddress,
        amount: amount,
        deadline: deadline,
        txHash: result.hash,
      };
      setCreatedEscrows([newEscrow, ...createdEscrows]);

      toast({
        title: "Escrow created!",
        description: `Escrow ID: ${newEscrowId} | TX: ${result.hash.substring(0, 10)}...`,
        duration: 10000,
      });

      // Show escrow ID prominently
      alert(`✅ Escrow Created Successfully!\n\nEscrow ID: ${newEscrowId}\n\nSave this ID! The recipient needs it to release the funds after the deadline.\n\nTransaction: ${result.hash}`);

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
      const secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
      if (!secretKey) throw new Error("Secret key required");

      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S', not 'G'.");
      }

      const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      
      console.log("Attempting to release escrow ID:", escrowId);
      console.log("Using account:", sourceKeypair.publicKey());
      console.log("Check transaction on Stellar Expert after submission");

      const result = await releaseSorobanEscrow(sourceKeypair, escrowId);

      toast({
        title: "Escrow released!",
        description: `Transaction hash: ${result.hash}`,
      });

      // Show link to transaction
      console.log(`View transaction: https://stellar.expert/explorer/testnet/tx/${result.hash}`);

      setEscrowId("");
    } catch (error: any) {
      console.error("Release error:", error);
      
      let errorMessage = error.message;
      
      // Parse common errors from the event log
      if (errorMessage.includes("Deadline not reached") || errorMessage.includes("time_check")) {
        errorMessage = "❌ Cannot release yet - the deadline has not passed.\n\nCheck the 'Your Created Escrows' section to see when it can be released.";
      } else if (errorMessage.includes("Escrow not found") || errorMessage.includes("escrow_not_found")) {
        errorMessage = `❌ Escrow ID ${escrowId} not found in the contract.\n\nMake sure:\n• The escrow was created successfully\n• You're using the correct ID\n• The contract storage persisted`;
      } else if (errorMessage.includes("already released") || errorMessage.includes("already_released")) {
        errorMessage = "❌ This escrow has already been released.";
      } else if (errorMessage.includes("UnreachableCodeReached")) {
        errorMessage = `❌ Release failed. Common reasons:\n\n• Escrow ID ${escrowId} doesn't exist\n• You're not the recipient\n• Deadline hasn't passed yet\n• Escrow already released\n\nTip: Create a new escrow with a short deadline (30 seconds) to test immediately!`;
      } else if (errorMessage.includes("require_auth")) {
        errorMessage = "❌ Authorization failed. You must be the recipient to release this escrow.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 10000,
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
                <Label htmlFor="hours">Lock Duration</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="hours"
                    type="number"
                    placeholder="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                  <Select value={timeUnit} onValueChange={(value: any) => setTimeUnit(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds">Seconds</SelectItem>
                      <SelectItem value="minutes">Minutes</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  For testing, use seconds or minutes
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Enter the Escrow ID provided by the creator
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-semibold">Requirements to release:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>You must be the recipient</li>
                  <li>The deadline must have passed</li>
                  <li>Escrow must not be already released</li>
                </ul>
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

        {createdEscrows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Created Escrows</CardTitle>
              <CardDescription>
                Share the Escrow ID with the recipient so they can release funds after the deadline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {createdEscrows.map((escrow) => (
                  <div key={escrow.id} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg">Escrow ID: {escrow.id}</div>
                        <div className="text-sm text-muted-foreground">
                          Amount: {escrow.amount} XLM
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Recipient: {escrow.recipient.substring(0, 10)}...{escrow.recipient.substring(escrow.recipient.length - 6)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Deadline: {new Date(escrow.deadline * 1000).toLocaleString()}
                        </div>
                        <div className={`text-sm font-semibold ${
                          Date.now() / 1000 >= escrow.deadline ? "text-green-600" : "text-orange-600"
                        }`}>
                          {Date.now() / 1000 >= escrow.deadline 
                            ? "✓ Can be released now" 
                            : `⏳ Can be released in ${Math.ceil((escrow.deadline - Date.now() / 1000) / 60)} minutes`
                          }
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(escrow.id);
                          toast({
                            title: "Copied!",
                            description: "Escrow ID copied to clipboard",
                          });
                        }}
                      >
                        Copy ID
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      TX: {escrow.txHash.substring(0, 20)}...
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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

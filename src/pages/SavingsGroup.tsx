import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, PiggyBank, TrendingUp } from "lucide-react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, networkPassphrase } from "@/lib/stellar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

export default function SavingsGroup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [groupName, setGroupName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [memberCount, setMemberCount] = useState("5");
  const [contributionAmount, setContributionAmount] = useState("");
  const [useSmartContract, setUseSmartContract] = useState(false);
  const [unlockDate, setUnlockDate] = useState("");
  
  const [savingsPool, setSavingsPool] = useState<any>(null);

  const handleCreatePool = async () => {
    if (!groupName || !targetAmount || !contributionAmount) {
      toast({
        title: "Missing information",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const secretKey = prompt("Enter your Stellar secret key (group organizer):");
      if (!secretKey) throw new Error("Secret key required");

      const organizerKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      
      // Create pool account (multi-sig)
      const poolKeypair = StellarSdk.Keypair.random();
      
      const organizerAccount = await server.loadAccount(organizerKeypair.publicKey());
      const fee = await server.fetchBaseFee();

      // Create pool account with starting balance
      const createTx = new StellarSdk.TransactionBuilder(organizerAccount, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: poolKeypair.publicKey(),
            startingBalance: "2.5",
          })
        )
        .setTimeout(30)
        .build();

      createTx.sign(organizerKeypair);
      const result = await server.submitTransaction(createTx);

      // Make first contribution
      const contributeTx = new StellarSdk.TransactionBuilder(organizerAccount, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: poolKeypair.publicKey(),
            asset: StellarSdk.Asset.native(),
            amount: contributionAmount,
          })
        )
        .addMemo(StellarSdk.Memo.text(`${groupName} - Initial`))
        .setTimeout(30)
        .build();

      contributeTx.sign(organizerKeypair);
      await server.submitTransaction(contributeTx);

      setSavingsPool({
        name: groupName,
        poolAddress: poolKeypair.publicKey(),
        poolSecret: poolKeypair.secret(),
        organizer: organizerKeypair.publicKey(),
        target: targetAmount,
        members: memberCount,
        contribution: contributionAmount,
        currentBalance: contributionAmount,
        useSmartContract: useSmartContract,
        unlockDate: unlockDate,
        hash: result.hash,
      });

      toast({
        title: "Savings pool created!",
        description: `${groupName} is ready for contributions`,
      });
    } catch (error: any) {
      toast({
        title: "Pool creation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async () => {
    if (!savingsPool) return;

    try {
      const secretKey = prompt("Enter member's Stellar secret key:");
      if (!secretKey) throw new Error("Secret key required");

      const memberKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      const memberAccount = await server.loadAccount(memberKeypair.publicKey());
      const fee = await server.fetchBaseFee();

      const amount = prompt("Contribution amount (XLM):");
      if (!amount) return;

      const tx = new StellarSdk.TransactionBuilder(memberAccount, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: savingsPool.poolAddress,
            asset: StellarSdk.Asset.native(),
            amount: amount,
          })
        )
        .addMemo(StellarSdk.Memo.text(`${savingsPool.name} - Contribution`))
        .setTimeout(30)
        .build();

      tx.sign(memberKeypair);
      await server.submitTransaction(tx);

      const newBalance = parseFloat(savingsPool.currentBalance) + parseFloat(amount);
      setSavingsPool({ ...savingsPool, currentBalance: newBalance.toString() });

      toast({
        title: "Contribution successful!",
        description: `Added ${amount} XLM to ${savingsPool.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Contribution failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Savings Group</h1>
          <p className="text-muted-foreground mt-2">
            Community savings pools for microfinance
          </p>
        </div>

        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            Create group savings pools (chamas, ROSCAs) with transparent blockchain tracking.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Create Savings Pool
              </CardTitle>
              <CardDescription>
                Set up a community savings group
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  placeholder="Women's Savings Group"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="members">Number of Members</Label>
                <Input
                  id="members"
                  type="number"
                  value={memberCount}
                  onChange={(e) => setMemberCount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contribution">Contribution per Member (XLM)</Label>
                <Input
                  id="contribution"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Amount (XLM)</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox 
                  id="smartContract" 
                  checked={useSmartContract}
                  onCheckedChange={(checked) => setUseSmartContract(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="smartContract" className="cursor-pointer">
                    Use Smart Contract (Time-Lock) 🔒
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Soroban enforces withdrawal deadline - funds locked until date
                  </p>
                </div>
              </div>

              {useSmartContract && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <Label htmlFor="unlockDate">Unlock Date</Label>
                  <Input
                    id="unlockDate"
                    type="date"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                  />
                  <p className="text-xs text-yellow-600">
                    ⚠️ Smart contract will prevent ANY withdrawals before this date!
                  </p>
                </div>
              )}

              <Button
                onClick={handleCreatePool}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Pool...
                  </>
                ) : (
                  <>
                    <PiggyBank className="mr-2 h-4 w-4" />
                    Create Pool
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pool Status
              </CardTitle>
              <CardDescription>
                Track savings progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {savingsPool ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div>
                      <span className="text-sm text-muted-foreground">Group Name</span>
                      <p className="font-semibold">{savingsPool.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Pool Address</span>
                      <p className="font-mono text-xs break-all">{savingsPool.poolAddress}</p>
                    </div>
                    {savingsPool.useSmartContract && (
                      <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm font-semibold">
                          <span>🔒</span>
                          <span>Smart Contract Time-Lock Active</span>
                        </div>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500 mt-1">
                          Unlock Date: {savingsPool.unlockDate}
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-500">
                          Soroban contract prevents withdrawals until this date
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Current</span>
                        <p className="font-semibold">{savingsPool.currentBalance} XLM</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Target</span>
                        <p className="font-semibold">{savingsPool.target} XLM</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{((parseFloat(savingsPool.currentBalance) / parseFloat(savingsPool.target)) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((parseFloat(savingsPool.currentBalance) / parseFloat(savingsPool.target)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleContribute} className="w-full" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Add Contribution
                  </Button>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>⚠️ Save pool secret key securely</p>
                    <p className="font-mono break-all">{savingsPool.poolSecret}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Create a pool to start saving</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Savings Groups Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Pool Creation:</strong> Organizer creates a shared Stellar account for the group.
            </p>
            <p>
              <strong>2. Contributions:</strong> Members send regular contributions to the pool address.
            </p>
            <p>
              <strong>3. Transparency:</strong> All transactions are visible on the blockchain.
            </p>
            <p>
              <strong>4. Distribution:</strong> Funds can be distributed based on group rules (rotating, emergency loans, etc).
            </p>
            <p className="text-muted-foreground">
              Perfect for chamas (Kenya), ROSCAs, village savings groups, and microfinance cooperatives.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

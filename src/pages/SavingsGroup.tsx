import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, PiggyBank, TrendingUp, Phone, X } from "lucide-react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, networkPassphrase } from "@/lib/stellar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function SavingsGroup() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPools, setLoadingPools] = useState(true);
  
  const [groupName, setGroupName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [memberCount, setMemberCount] = useState("5");
  const [contributionAmount, setContributionAmount] = useState("");
  const [useSmartContract, setUseSmartContract] = useState(false);
  const [unlockDate, setUnlockDate] = useState("");
  const [memberPhones, setMemberPhones] = useState<string[]>([""]);
  const [memberEmails, setMemberEmails] = useState<string[]>([""]);
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  
  const [savingsPool, setSavingsPool] = useState<any>(null);
  const [myPools, setMyPools] = useState<any[]>([]);

  // Load user's pools on mount
  useEffect(() => {
    if (user) {
      loadMyPools();
    }
  }, [user]);

  const loadMyPools = async () => {
    try {
      const { data, error } = await supabase
        .from("savings_pools")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setMyPools(data || []);
      
      // Load the most recent pool as active
      if (data && data.length > 0) {
        setSavingsPool({
          ...data[0],
          poolAddress: data[0].pool_address,
          currentBalance: data[0].current_balance,
          target: data[0].target_amount,
          contribution: data[0].contribution_amount,
          members: data[0].member_count,
          useSmartContract: data[0].use_smart_contract,
          unlockDate: data[0].unlock_date,
        });
      }
    } catch (error: any) {
      console.error("Error loading pools:", error);
    } finally {
      setLoadingPools(false);
    }
  };

  const addPhoneField = () => {
    setMemberPhones([...memberPhones, ""]);
  };

  const removePhoneField = (index: number) => {
    const newPhones = memberPhones.filter((_, i) => i !== index);
    setMemberPhones(newPhones);
  };

  const updatePhoneField = (index: number, value: string) => {
    const newPhones = [...memberPhones];
    newPhones[index] = value;
    setMemberPhones(newPhones);
  };

  const addEmailField = () => {
    setMemberEmails([...memberEmails, ""]);
  };

  const removeEmailField = (index: number) => {
    const newEmails = memberEmails.filter((_, i) => i !== index);
    setMemberEmails(newEmails);
  };

  const updateEmailField = (index: number, value: string) => {
    const newEmails = [...memberEmails];
    newEmails[index] = value;
    setMemberEmails(newEmails);
  };

  const sendPoolInvitations = async (poolData: any) => {
    const validPhones = memberPhones.filter(phone => phone.trim() !== "");
    
    if (validPhones.length === 0) {
      return;
    }

    console.log("Sending SMS to:", validPhones);

    const { data, error } = await supabase.functions.invoke("send-pool-invitation", {
      body: {
        phoneNumbers: validPhones,
        poolName: poolData.name,
        poolAddress: poolData.poolAddress,
        targetAmount: poolData.target,
        contributionAmount: poolData.contribution,
        memberCount: poolData.members,
      },
    });

    if (error) {
      console.error("SMS function error:", error);
      throw error;
    }

    console.log("SMS response:", data);

    toast({
      title: "Invitations sent!",
      description: `SMS sent to ${validPhones.length} member(s)`,
    });
  };

  const sendEmailInvitations = async (poolData: any) => {
    const validEmails = memberEmails.filter(email => email.trim() !== "" && email.includes('@'));
    
    if (validEmails.length === 0) {
      return;
    }

    console.log("Sending emails to:", validEmails);

    // Use Supabase Auth to send magic link emails with pool info
    for (const email of validEmails) {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/savings-group`,
            data: {
              pool_name: poolData.name,
              pool_address: poolData.poolAddress,
              target_amount: poolData.target,
              contribution_amount: poolData.contribution,
            },
          },
        });

        if (error) {
          console.error(`Email error for ${email}:`, error);
        }
      } catch (err) {
        console.error(`Failed to send email to ${email}:`, err);
      }
    }

    toast({
      title: "Email invitations sent!",
      description: `Sent ${validEmails.length} email invitation(s)`,
    });
  };

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
      // Get user's profile to get their user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Try to get secret key from localStorage
      let secretKey = localStorage.getItem(`stellar_secret_${user.id}`);
      
      if (!secretKey) {
        secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
        if (!secretKey) throw new Error("Secret key required");
      }

      // Validate secret key format
      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S', not 'G'. Please enter your SECRET key, not your public key.");
      }

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

      // Save pool to database
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data: poolData, error: dbError } = await supabase
        .from("savings_pools")
        .insert({
          creator_id: currentUser.id,
          name: groupName,
          pool_address: poolKeypair.publicKey(),
          target_amount: parseFloat(targetAmount),
          contribution_amount: parseFloat(contributionAmount),
          member_count: parseInt(memberCount),
          current_balance: parseFloat(contributionAmount),
          use_smart_contract: useSmartContract,
          unlock_date: unlockDate || null,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      const poolInfo = {
        id: poolData.id,
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
      };

      setSavingsPool(poolInfo);
      await loadMyPools(); // Reload pools list

      toast({
        title: "Savings pool created!",
        description: `${groupName} is ready for contributions`,
      });

      // Send SMS invitations if enabled
      if (sendSMS) {
        try {
          await sendPoolInvitations({
            name: groupName,
            poolAddress: poolKeypair.publicKey(),
            target: targetAmount,
            contribution: contributionAmount,
            members: memberCount,
          });
        } catch (smsError: any) {
          console.error("SMS error:", smsError);
          toast({
            title: "Pool created, but SMS failed",
            description: "Pool was created successfully, but SMS invitations could not be sent.",
            variant: "default",
          });
        }
      }

      // Send Email invitations if enabled
      if (sendEmail) {
        try {
          await sendEmailInvitations({
            name: groupName,
            poolAddress: poolKeypair.publicKey(),
            target: targetAmount,
            contribution: contributionAmount,
            members: memberCount,
          });
        } catch (emailError: any) {
          console.error("Email error:", emailError);
          toast({
            title: "Pool created, but Email failed",
            description: "Pool was created successfully, but email invitations could not be sent.",
            variant: "default",
          });
        }
      }
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
      // Get user's profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Try to get secret key from localStorage
      let secretKey = localStorage.getItem(`stellar_secret_${user.id}`);
      
      if (!secretKey) {
        secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
        if (!secretKey) throw new Error("Secret key required");
      }

      // Validate secret key format
      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S', not 'G'. Please enter your SECRET key, not your public key.");
      }

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

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox 
                  id="sendSMS" 
                  checked={sendSMS}
                  onCheckedChange={(checked) => setSendSMS(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="sendSMS" className="cursor-pointer">
                    Send SMS Invitations 📱
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify members via SMS when pool is created
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <Checkbox 
                  id="sendEmail" 
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="sendEmail" className="cursor-pointer">
                    Send Email Invitations 📧
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notify members via email when pool is created
                  </p>
                </div>
              </div>

              {sendSMS && (
                <div className="space-y-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Member Phone Numbers</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPhoneField}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Add Member
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {memberPhones.map((phone, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="+255 XXX XXX XXX"
                          value={phone}
                          onChange={(e) => updatePhoneField(index, e.target.value)}
                        />
                        {memberPhones.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhoneField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Include country code (e.g., +255 for Tanzania, +254 for Kenya)
                  </p>
                </div>
              )}

              {sendEmail && (
                <div className="space-y-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label>Member Email Addresses</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEmailField}
                    >
                      📧 Add Member
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {memberEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={email}
                          onChange={(e) => updateEmailField(index, e.target.value)}
                        />
                        {memberEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEmailField(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Members will receive an email invitation with pool details
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
                Your Savings Pools
              </CardTitle>
              <CardDescription>
                All your savings groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPools ? (
                <div className="py-8 text-center text-muted-foreground">Loading pools...</div>
              ) : myPools.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No savings pools yet. Create one above!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myPools.map((pool) => {
                    const progress = (parseFloat(pool.current_balance || '0') / parseFloat(pool.target_amount)) * 100;
                    return (
                      <div key={pool.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{pool.pool_name}</h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              {pool.pool_address?.substring(0, 10)}...{pool.pool_address?.substring(pool.pool_address.length - 6)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSavingsPool({
                                name: pool.pool_name,
                                poolAddress: pool.pool_address,
                                currentBalance: pool.current_balance || '0',
                                target: pool.target_amount,
                                contribution: pool.contribution_amount,
                                members: pool.member_count,
                                useSmartContract: pool.use_smart_contract,
                                unlockDate: pool.unlock_date,
                                poolSecret: localStorage.getItem(`pool_secret_${pool.pool_address}`) || '',
                              });
                              toast({ title: "Pool selected", description: `Now viewing ${pool.pool_name}` });
                            }}
                          >
                            View
                          </Button>
                        </div>

                        {pool.use_smart_contract && (
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800 text-xs">
                            <span className="text-yellow-700 dark:text-yellow-400 font-semibold">
                              🔒 Locked until {new Date(pool.unlock_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground text-xs">Current</span>
                            <p className="font-semibold">{parseFloat(pool.current_balance || '0').toFixed(2)} XLM</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Target</span>
                            <p className="font-semibold">{parseFloat(pool.target_amount).toFixed(2)} XLM</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground text-xs">Members</span>
                            <p className="font-semibold">{pool.member_count}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold">{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {savingsPool && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  {savingsPool.name}
                </CardTitle>
                <CardDescription>
                  Pool details and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Pool Address</span>
                    <p className="font-mono text-xs break-all">{savingsPool.poolAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <p className="font-semibold text-lg">{savingsPool.currentBalance} XLM</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Target Amount</span>
                      <p className="font-semibold text-lg">{savingsPool.target} XLM</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleContribute} className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Add Contribution
                </Button>

                {!savingsPool.useSmartContract && savingsPool.poolSecret && (
                  <div className="text-xs text-muted-foreground space-y-1 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">⚠️ Pool Secret Key</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-yellow-700 dark:text-yellow-400 font-semibold">
                        Click to reveal
                      </summary>
                      <p className="font-mono break-all mt-2 p-2 bg-black/10 rounded text-xs">
                        {savingsPool.poolSecret}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(savingsPool.poolSecret);
                          toast({ title: "Secret key copied!" });
                        }}
                      >
                        Copy Secret Key
                      </Button>
                    </details>
                  </div>
                )}

                {savingsPool.useSmartContract && (
                  <div className="text-xs text-muted-foreground space-y-1 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <p className="font-semibold text-green-700 dark:text-green-400">✅ Smart Contract Protected</p>
                    <p className="text-green-600 dark:text-green-500">
                      Funds locked until {savingsPool.unlockDate}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBalance, isTestnet } from "@/lib/stellar";
import { supabase } from "@/integrations/supabase/client";
import { Send, Download, ArrowLeftRight, Shield, RefreshCw, Wallet, Bell, AlertTriangle } from "lucide-react";
import { RecentTransactions } from "@/components/RecentTransactions";
import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import { ImportWalletDialog } from "@/components/ImportWalletDialog";
import { FundingGuide } from "@/components/FundingGuide";
import { toast } from "sonner";

interface BalanceItem {
  asset: string;
  balance: string;
}

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [walletCreating, setWalletCreating] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem("stellarremit_onboarding_done") !== "true";
  });

  const completeOnboarding = () => {
    localStorage.setItem("stellarremit_onboarding_done", "true");
    setShowOnboarding(false);
  };

  const fetchBalances = useCallback(async () => {
    if (!profile?.stellar_public_key) return;
    setLoadingBalance(true);
    try {
      const b = await getBalance(profile.stellar_public_key);
      setBalances(b);
    } catch {
      setBalances([]);
    }
    setLoadingBalance(false);
  }, [profile?.stellar_public_key]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Real-time transaction notifications
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel("dashboard-transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          const tx = payload.new as any;
          if (tx.receiver_id === profile.user_id) {
            toast.info(`Received ${tx.amount} ${tx.asset}`, {
              description: tx.memo || "New incoming payment",
              icon: <Bell className="h-4 w-4" />,
            });
            // Auto-refresh balance on incoming tx
            fetchBalances();
          } else if (tx.sender_id === profile.user_id) {
            // Refresh balance after sending
            fetchBalances();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, fetchBalances]);

  const handleCreateWallet = async () => {
    setWalletCreating(true);
    try {
      // Generate Stellar keypair on client side
      const { Keypair } = await import("@stellar/stellar-sdk");
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      // Update profile with public key
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stellar_public_key: publicKey })
        .eq("user_id", profile?.user_id);

      if (updateError) throw updateError;

      // Store secret key in localStorage temporarily (not secure, but works for demo)
      // In production, this should be stored securely on the backend
      localStorage.setItem(`stellar_secret_${profile?.user_id}`, secretKey);

      toast.success("Stellar wallet created! Please save your secret key securely.");
      toast.info(`Secret Key: ${secretKey}`, { duration: 10000 });
      
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to create wallet");
    }
    setWalletCreating(false);
  };

  const xlmBalance = balances.find((b) => b.asset === "XLM")?.balance || "0";

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-serif">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.display_name || "User"}
          </p>
        </div>

        {/* Onboarding Tutorial */}
        {showOnboarding && (
          <OnboardingTutorial onComplete={completeOnboarding} />
        )}

        {/* Network Warning */}
        <Card className={isTestnet ? "border-blue-500/40 bg-blue-500/5" : "border-warning/40 bg-warning/5"}>
          <CardContent className="py-4">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isTestnet ? "text-blue-500" : "text-warning"}`} />
              <p className="text-foreground">
                {isTestnet ? (
                  <>
                    <strong>Testnet Mode:</strong> You are on Stellar Testnet. All transactions use test XLM (no real value). Perfect for development and demos! Get free test XLM from Friendbot.
                  </>
                ) : (
                  <>
                    <strong>Live Network:</strong> You are on the Stellar Mainnet. All transactions use real XLM and are irreversible. Double-check addresses and amounts before sending.
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Status */}
        {!profile?.stellar_public_key ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="py-8 text-center">
              <Wallet className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Your Stellar Wallet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                You need a Stellar wallet to send and receive money. We'll create one securely for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleCreateWallet} disabled={walletCreating}>
                  {walletCreating ? "Creating..." : "Create New Wallet"}
                </Button>
                <ImportWalletDialog />
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                    XLM Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-sans">
                    {loadingBalance ? "..." : parseFloat(xlmBalance).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Stellar Lumens ({isTestnet ? "Testnet" : "Mainnet"})
                  </p>
                </CardContent>
              </Card>
              {balances
                .filter((b) => b.asset !== "XLM")
                .map((b) => (
                  <Card key={b.asset}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                        {b.asset} Balance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold font-sans">
                        {parseFloat(b.balance).toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Stellar Asset</p>
                    </CardContent>
                  </Card>
                ))}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={fetchBalances} disabled={loadingBalance}>
                    <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingBalance ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Links */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { to: "/send", label: "Send Money", icon: Send, desc: "Transfer to another wallet" },
                { to: "/receive", label: "Receive", icon: Download, desc: "Share your address" },
                { to: "/convert", label: "Convert", icon: ArrowLeftRight, desc: "Swap assets" },
                { to: "/escrow", label: "Escrow", icon: Shield, desc: "Secure transactions" },
              ].map((item) => (
                <Link key={item.to} to={item.to}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <item.icon className="h-8 w-8 text-accent mb-3" />
                      <h3 className="font-semibold font-sans">{item.label}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Funding Guide */}
            <FundingGuide publicKey={profile.stellar_public_key} />

            {/* Recent Transactions */}
            <RecentTransactions />

            {/* Wallet Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-sans">Wallet Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Public Address (Share this to receive payments)</label>
                  <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                    {profile.stellar_public_key}
                  </code>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Secret Key (Never share this!)</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const secretKey = localStorage.getItem(`stellar_secret_${profile?.user_id}`);
                        if (secretKey) {
                          navigator.clipboard.writeText(secretKey);
                          toast.success("Secret key copied to clipboard!");
                        } else {
                          toast.error("Secret key not found. You may have imported this wallet.");
                        }
                      }}
                    >
                      Copy Secret Key
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const secretKey = localStorage.getItem(`stellar_secret_${profile?.user_id}`);
                        if (secretKey) {
                          alert(`Your Secret Key:\n\n${secretKey}\n\n⚠️ NEVER share this with anyone!\n⚠️ Anyone with this key can access your funds!`);
                        } else {
                          toast.error("Secret key not found. You may have imported this wallet.");
                        }
                      }}
                    >
                      View Secret Key
                    </Button>
                  </div>
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Keep your secret key safe! Anyone with this key can access your funds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

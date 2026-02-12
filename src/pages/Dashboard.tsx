import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getBalance, fundWithFriendbot } from "@/lib/stellar";
import { supabase } from "@/integrations/supabase/client";
import { Send, Download, ArrowLeftRight, Shield, RefreshCw, Wallet, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface BalanceItem {
  asset: string;
  balance: string;
}

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [balances, setBalances] = useState<BalanceItem[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [funding, setFunding] = useState(false);
  const [walletCreating, setWalletCreating] = useState(false);

  const fetchBalances = async () => {
    if (!profile?.stellar_public_key) return;
    setLoadingBalance(true);
    try {
      const b = await getBalance(profile.stellar_public_key);
      setBalances(b);
    } catch {
      setBalances([]);
    }
    setLoadingBalance(false);
  };

  useEffect(() => {
    fetchBalances();
  }, [profile?.stellar_public_key]);

  const handleCreateWallet = async () => {
    setWalletCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-wallet");
      if (error) throw error;
      toast.success("Stellar wallet created!");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Failed to create wallet");
    }
    setWalletCreating(false);
  };

  const handleFund = async () => {
    if (!profile?.stellar_public_key) return;
    setFunding(true);
    try {
      await fundWithFriendbot(profile.stellar_public_key);
      toast.success("Account funded with 10,000 testnet XLM!");
      await fetchBalances();
    } catch (err: any) {
      toast.error(err.message || "Failed to fund account");
    }
    setFunding(false);
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

        {/* Wallet Status */}
        {!profile?.stellar_public_key ? (
          <Card className="border-accent/30 bg-accent/5">
            <CardContent className="py-8 text-center">
              <Wallet className="h-12 w-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Create Your Stellar Wallet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                You need a Stellar wallet to send and receive money. We'll create one securely for you.
              </p>
              <Button onClick={handleCreateWallet} disabled={walletCreating}>
                {walletCreating ? "Creating..." : "Create Wallet"}
              </Button>
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
                  <p className="text-xs text-muted-foreground mt-1">Stellar Lumens (Testnet)</p>
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
                      <p className="text-xs text-muted-foreground mt-1">Testnet Asset</p>
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
                  <Button size="sm" variant="outline" onClick={handleFund} disabled={funding}>
                    {funding ? "Funding..." : "Fund (Testnet)"}
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

            {/* Wallet Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-sans">Wallet Address</CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                  {profile.stellar_public_key}
                </code>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;

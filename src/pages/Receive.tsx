import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { accountExplorerUrl, fundWithFriendbot } from "@/lib/stellar";
import { useState } from "react";

const Receive = () => {
  const { profile } = useAuth();
  const [funding, setFunding] = useState(false);
  const publicKey = profile?.stellar_public_key;

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      toast.success("Address copied!");
    }
  };

  const handleFund = async () => {
    if (!publicKey) return;
    setFunding(true);
    try {
      await fundWithFriendbot(publicKey);
      toast.success("Account funded with testnet XLM!");
    } catch {
      toast.error("Failed to fund account");
    }
    setFunding(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold font-serif mb-6">Receive Money</h1>

        {!publicKey ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Please create a wallet from the Dashboard first.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-sans flex items-center gap-2">
                  <Download className="h-5 w-5 text-accent" /> Your Wallet Address
                </CardTitle>
                <CardDescription>Share this address to receive payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <QRCodeSVG value={publicKey} size={200} />
                  </div>
                </div>
                <div>
                  <code className="text-xs bg-muted px-3 py-2 rounded block break-all">{publicKey}</code>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={copyAddress}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Address
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={accountExplorerUrl(publicKey)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-sans">Fund with Testnet XLM</CardTitle>
                <CardDescription>Get free testnet XLM from Stellar Friendbot</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleFund} disabled={funding} className="w-full">
                  {funding ? "Funding..." : "Fund Account (Free Testnet XLM)"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Receive;

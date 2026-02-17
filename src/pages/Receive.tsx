import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { accountExplorerUrl } from "@/lib/stellar";

const Receive = () => {
  const { profile } = useAuth();
  const publicKey = profile?.stellar_public_key;

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      toast.success("Address copied!");
    }
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
            <Card className="border-warning/40 bg-warning/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-foreground">
                    <strong>Mainnet Warning:</strong> This is the live Stellar network.
                    Only send real XLM to this address. Transactions are irreversible.
                  </p>
                </div>
              </CardContent>
            </Card>

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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Receive;

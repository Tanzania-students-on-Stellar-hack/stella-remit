import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download, ExternalLink, AlertTriangle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { accountExplorerUrl, isTestnet } from "@/lib/stellar";
import { useState } from "react";

const Receive = () => {
  const { profile } = useAuth();
  const publicKey = profile?.stellar_public_key;
  const [qrFormat, setQrFormat] = useState<'address' | 'uri'>('address');

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      toast.success("Address copied!");
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = 'stellar-wallet-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR code downloaded!");
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const qrValue = qrFormat === 'uri' 
    ? `web+stellar:pay?destination=${publicKey}` 
    : publicKey || '';

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
            <Card className={isTestnet ? "border-blue-500/40 bg-blue-500/5" : "border-warning/40 bg-warning/5"}>
              <CardContent className="py-4">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isTestnet ? "text-blue-500" : "text-warning"}`} />
                  <p className="text-foreground">
                    {isTestnet ? (
                      <>
                        <strong>Testnet Mode:</strong> This address is on Stellar Testnet.
                        Only send test XLM (no real value). Get free test XLM from Friendbot.
                      </>
                    ) : (
                      <>
                        <strong>Mainnet Warning:</strong> This is the live Stellar network.
                        Only send real XLM to this address. Transactions are irreversible.
                      </>
                    )}
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
                  <div className="bg-white p-6 rounded-lg border-2 border-border shadow-sm">
                    <QRCodeSVG 
                      id="qr-code-svg"
                      value={qrValue}
                      size={220}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button 
                    variant={qrFormat === 'address' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setQrFormat('address')}
                  >
                    Address Only
                  </Button>
                  <Button 
                    variant={qrFormat === 'uri' ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setQrFormat('uri')}
                  >
                    Stellar URI
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {qrFormat === 'address' 
                    ? 'Scan with any QR reader to get the wallet address'
                    : 'Scan with Stellar wallet app for direct payment'}
                </p>
                
                <div>
                  <code className="text-xs bg-muted px-3 py-2 rounded block break-all">{publicKey}</code>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={copyAddress}>
                    <Copy className="h-4 w-4 mr-2" /> Copy Address
                  </Button>
                  <Button variant="outline" onClick={downloadQR}>
                    <Download className="h-4 w-4 mr-2" /> Download QR
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

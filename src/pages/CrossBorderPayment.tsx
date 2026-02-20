import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Globe, ArrowRight, TrendingUp } from "lucide-react";
import { findPaymentPaths, sendPathPayment, ASSETS, createTrustline } from "@/lib/pathPayments";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CrossBorderPayment() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [sourceCurrency, setSourceCurrency] = useState("XLM");
  const [destCurrency, setDestCurrency] = useState("USDC");
  
  const [quote, setQuote] = useState<any>(null);
  const [paths, setPaths] = useState<any[]>([]);

  const currencies = [
    { code: "XLM", name: "Stellar Lumens (Native)" },
    { code: "USDC", name: "USD Coin" },
    { code: "EURC", name: "Euro Coin" },
  ];

  const getAsset = (code: string) => {
    if (code === "XLM") return StellarSdk.Asset.native();
    return ASSETS[code as keyof typeof ASSETS];
  };

  const handleGetQuote = async () => {
    if (!amount || !recipientAddress) {
      toast({
        title: "Missing information",
        description: "Please enter amount and recipient address",
        variant: "destructive",
      });
      return;
    }

    setQuoteLoading(true);
    try {
      const destAsset = getAsset(destCurrency);
      const foundPaths = await findPaymentPaths(recipientAddress, destAsset, amount);
      
      if (foundPaths.length === 0) {
        toast({
          title: "No path found",
          description: "Cannot find conversion path. Try different currencies.",
          variant: "destructive",
        });
        return;
      }

      setPaths(foundPaths);
      setQuote(foundPaths[0]); // Use best path

      toast({
        title: "Quote received",
        description: `Best rate: ${foundPaths[0].sourceAmount} ${sourceCurrency} → ${amount} ${destCurrency}`,
      });
    } catch (error: any) {
      toast({
        title: "Quote failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSendPayment = async () => {
    if (!quote) {
      toast({
        title: "Get quote first",
        description: "Please get a quote before sending",
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
      const sendAsset = getAsset(sourceCurrency);
      const destAsset = getAsset(destCurrency);

      // Add 5% slippage tolerance
      const sendMax = (parseFloat(quote.sourceAmount) * 1.05).toFixed(7);

      const result = await sendPathPayment(
        sourceKeypair,
        recipientAddress,
        sendAsset,
        sendMax,
        destAsset,
        amount,
        memo
      );

      toast({
        title: "Payment sent!",
        description: `Transaction hash: ${result.hash}`,
      });

      // Reset form
      setRecipientAddress("");
      setAmount("");
      setMemo("");
      setQuote(null);
      setPaths([]);
    } catch (error: any) {
      toast({
        title: "Payment failed",
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
          <h1 className="text-3xl font-bold">Cross-Border Payment</h1>
          <p className="text-muted-foreground mt-2">
            Send money globally with automatic currency conversion
          </p>
        </div>

        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Powered by Stellar's built-in DEX. Payments settle in 2-5 seconds with automatic currency conversion.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Payment Details
              </CardTitle>
              <CardDescription>
                Enter recipient and amount information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Stellar Address</Label>
                <Input
                  id="recipient"
                  placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sourceCurrency">You Send</Label>
                  <Select value={sourceCurrency} onValueChange={setSourceCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destCurrency">They Receive</Label>
                  <Select value={destCurrency} onValueChange={setDestCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          {curr.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Recipient Receives)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Guaranteed amount recipient will receive
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">Memo (Optional)</Label>
                <Input
                  id="memo"
                  placeholder="Payment reference"
                  maxLength={28}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              <Button
                onClick={handleGetQuote}
                disabled={quoteLoading}
                className="w-full"
                variant="outline"
              >
                {quoteLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Quote...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Get Quote
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                Quote & Conversion
              </CardTitle>
              <CardDescription>
                Exchange rate and payment preview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {quote ? (
                <>
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">You send</span>
                      <span className="font-semibold">
                        {quote.sourceAmount} {sourceCurrency}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">They receive</span>
                      <span className="font-semibold">
                        {amount} {destCurrency}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Exchange rate</span>
                        <span>
                          1 {destCurrency} = {(parseFloat(quote.sourceAmount) / parseFloat(amount)).toFixed(4)} {sourceCurrency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendPayment}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        Send Payment
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Get a quote to see exchange rate</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Path Payment:</strong> Stellar automatically finds the best conversion path through its decentralized exchange.
            </p>
            <p>
              <strong>2. Guaranteed Amount:</strong> Recipient receives exactly the amount you specify, regardless of exchange rate fluctuations.
            </p>
            <p>
              <strong>3. Fast Settlement:</strong> Cross-border payments settle in 2-5 seconds with minimal fees.
            </p>
            <p className="text-muted-foreground">
              Supported currencies: XLM (native), USDC, EURC. More assets can be added via trustlines.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

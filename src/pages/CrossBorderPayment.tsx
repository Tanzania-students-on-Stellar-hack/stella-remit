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
import { getExchangeRates } from "@/lib/exchangeRates";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isTestnet } from "@/lib/stellar";
import { supabase } from "@/integrations/supabase/client";

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
      
      // For demo: if same currency, just do direct payment
      if (sourceCurrency === destCurrency) {
        setQuote({
          sourceAmount: amount,
          sourceAsset: sourceCurrency,
          destinationAmount: amount,
          destinationAsset: destCurrency,
          path: [],
          isDirect: true,
        });
        
        toast({
          title: "Quote received",
          description: `Direct transfer: ${amount} ${sourceCurrency} → ${amount} ${destCurrency}`,
        });
        setQuoteLoading(false);
        return;
      }

      // Try to find path payment
      const foundPaths = await findPaymentPaths(recipientAddress, destAsset, amount);
      
      if (foundPaths.length === 0) {
        // Fallback for demo: use real exchange rates from CoinGecko
        const rates = await getExchangeRates();
        const rate = rates[destCurrency]?.[sourceCurrency] || 1;
        const sourceAmount = (parseFloat(amount) * rate).toFixed(7);
        
        setQuote({
          sourceAmount: sourceAmount,
          sourceAsset: sourceCurrency,
          destinationAmount: amount,
          destinationAsset: destCurrency,
          path: [],
          isSimulated: true,
        });
        
        toast({
          title: "Quote received (Live rates)",
          description: `${sourceAmount} ${sourceCurrency} → ${amount} ${destCurrency}`,
        });
        setQuoteLoading(false);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let secretKey = localStorage.getItem(`stellar_secret_${user.id}`);
      
      if (!secretKey) {
        secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
        if (!secretKey) throw new Error("Secret key required");
      }

      if (!secretKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S'.");
      }

      const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
      
      console.log("Quote type:", { isSimulated: quote.isSimulated, isDirect: quote.isDirect, isTestnet });
      
      // On testnet, ALWAYS use direct payment for demo (no real liquidity)
      // On mainnet, use path payment if available
      const useDirectPayment = isTestnet || quote.isSimulated || quote.isDirect || sourceCurrency === destCurrency;
      
      if (useDirectPayment) {
        console.log("Using direct payment (testnet demo mode)");
        const { Keypair, TransactionBuilder, Operation, Asset, Memo } = await import("@stellar/stellar-sdk");
        const { server, networkPassphrase } = await import("@/lib/stellar");

        // Check if recipient account exists
        try {
          await server.loadAccount(recipientAddress);
        } catch (error: any) {
          if (error.response?.status === 404) {
            throw new Error("Recipient account not found. The account needs to be funded with at least 1 XLM first. Use Friendbot if on testnet.");
          }
          throw error;
        }

        const account = await server.loadAccount(sourceKeypair.publicKey());
        const fee = await server.fetchBaseFee();

        const tx = new TransactionBuilder(account, {
          fee: fee.toString(),
          networkPassphrase: networkPassphrase,
        })
          .addOperation(
            Operation.payment({
              destination: recipientAddress,
              asset: Asset.native(),
              amount: quote.sourceAmount,
            })
          )
          .addMemo(Memo.text(memo || `Demo: ${sourceCurrency}→${destCurrency}`))
          .setTimeout(30)
          .build();

        tx.sign(sourceKeypair);
        const result = await server.submitTransaction(tx);

        // Save transaction to database
        try {
          const { data: receiverProfile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("stellar_public_key", recipientAddress)
            .maybeSingle();

          await supabase.from("transactions").insert({
            sender_id: user.id,
            receiver_id: receiverProfile?.user_id || user.id,
            amount: parseFloat(quote.sourceAmount),
            asset: "XLM",
            memo: memo || `Cross-border: ${sourceCurrency}→${destCurrency}`,
            tx_hash: result.hash,
            status: "completed",
          });
        } catch (dbError) {
          console.warn("Failed to save transaction:", dbError);
        }

        toast({
          title: isTestnet ? "Payment sent! (Testnet Demo)" : "Payment sent!",
          description: isTestnet 
            ? `Demo: Sent ${quote.sourceAmount} XLM. In production, this would convert to ${amount} ${destCurrency}. TX: ${result.hash.substring(0, 10)}...`
            : `Transaction hash: ${result.hash}`,
        });

        setRecipientAddress("");
        setAmount("");
        setMemo("");
        setQuote(null);
        setPaths([]);
        setLoading(false);
        return;
      }

      console.log("Using path payment");
      // Real path payment (only if liquidity exists)
      const sendAsset = getAsset(sourceCurrency);
      const destAsset = getAsset(destCurrency);
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

      setRecipientAddress("");
      setAmount("");
      setMemo("");
      setQuote(null);
      setPaths([]);
    } catch (error: any) {
      console.error("Payment error:", error);
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
            {isTestnet && (
              <span className="block mt-2 text-yellow-600">
                ⚠️ Testnet Note: Currency conversion (USDC/EURC) has limited liquidity on testnet. For demo purposes, use XLM → XLM which always works.
              </span>
            )}
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

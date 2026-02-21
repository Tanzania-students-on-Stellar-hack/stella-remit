import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, ExternalLink, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isTestnet } from "@/lib/stellar";

interface FundingGuideProps {
  publicKey?: string;
}

export const FundingGuide = ({ publicKey }: FundingGuideProps) => {
  const [funding, setFunding] = useState(false);

  const handleFriendbot = async () => {
    if (!publicKey) {
      toast.error("No wallet address found");
      return;
    }

    setFunding(true);
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
      if (!response.ok) throw new Error("Friendbot request failed");
      
      toast.success("🎉 10,000 XLM funded to your account!");
      toast.info("Refresh your balance to see the funds", { duration: 5000 });
    } catch (error) {
      toast.error("Failed to fund account. Try again or use Stellar Laboratory.");
    } finally {
      setFunding(false);
    }
  };

  if (isTestnet && publicKey) {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-sans flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Get Free Testnet XLM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            You're on Stellar Testnet. Get free test XLM instantly with Friendbot!
          </p>
          <Button 
            onClick={handleFriendbot} 
            disabled={funding}
            className="w-full"
            variant="default"
          >
            {funding ? "Funding..." : "Get 10,000 Test XLM"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Or use{" "}
            <a 
              href={`https://laboratory.stellar.org/#account-creator?network=test`}
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-500 underline inline-flex items-center gap-0.5"
            >
              Stellar Laboratory <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-sans flex items-center gap-2">
          <Coins className="h-5 w-5 text-accent" />
          How to Fund Your Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong className="text-foreground">Buy XLM</strong> on an exchange like{" "}
            <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer" className="text-accent underline inline-flex items-center gap-0.5">
              Coinbase <ExternalLink className="h-3 w-3" />
            </a>,{" "}
            <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer" className="text-accent underline inline-flex items-center gap-0.5">
              Binance <ExternalLink className="h-3 w-3" />
            </a>, or{" "}
            <a href="https://www.kraken.com" target="_blank" rel="noopener noreferrer" className="text-accent underline inline-flex items-center gap-0.5">
              Kraken <ExternalLink className="h-3 w-3" />
            </a>.
          </li>
          <li>
            <strong className="text-foreground">Copy your wallet address</strong> from the Receive page or the card below.
          </li>
          <li>
            <strong className="text-foreground">Withdraw XLM</strong> from the exchange to your wallet address.
          </li>
          <li>
            <strong className="text-foreground">Wait for confirmation</strong> — it usually takes 3–5 seconds on Stellar.
          </li>
        </ol>
        <p className="text-xs pt-1">
          <strong className="text-foreground">Note:</strong> A minimum of <strong className="text-foreground">1 XLM</strong> is required to activate a new Stellar account.
        </p>
      </CardContent>
    </Card>
  );
};

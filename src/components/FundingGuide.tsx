import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ExternalLink } from "lucide-react";

export const FundingGuide = () => {
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

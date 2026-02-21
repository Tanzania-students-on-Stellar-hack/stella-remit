import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Coins, CheckCircle } from "lucide-react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { server, networkPassphrase } from "@/lib/stellar";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TokenIssuance() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [assetCode, setAssetCode] = useState("");
  const [assetLimit, setAssetLimit] = useState("");
  const [issuedAsset, setIssuedAsset] = useState<any>(null);

  const handleIssueToken = async () => {
    if (!assetCode || assetCode.length > 12) {
      toast({
        title: "Invalid asset code",
        description: "Asset code must be 1-12 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const secretKey = prompt("Enter your Stellar secret key (starts with 'S'):");
      if (!secretKey) throw new Error("Secret key required");

      const trimmedKey = secretKey.trim();
      
      if (!trimmedKey.startsWith('S')) {
        throw new Error("Invalid secret key. Secret keys start with 'S', not 'G'. You entered a public key.");
      }
      
      if (trimmedKey.length !== 56) {
        throw new Error(`Invalid secret key length. Expected 56 characters, got ${trimmedKey.length}.`);
      }

      let issuerKeypair;
      try {
        issuerKeypair = StellarSdk.Keypair.fromSecret(trimmedKey);
      } catch (err: any) {
        throw new Error(`Invalid secret key format: ${err.message}`);
      }
      const distributorKeypair = StellarSdk.Keypair.random();

      // Fund distributor account
      const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
      const fee = await server.fetchBaseFee();

      // Create distributor account
      const createAccountTx = new StellarSdk.TransactionBuilder(issuerAccount, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.createAccount({
            destination: distributorKeypair.publicKey(),
            startingBalance: "2",
          })
        )
        .setTimeout(30)
        .build();

      createAccountTx.sign(issuerKeypair);
      await server.submitTransaction(createAccountTx);

      // Create asset
      const asset = new StellarSdk.Asset(assetCode, issuerKeypair.publicKey());

      // Distributor creates trustline
      const distributorAccount = await server.loadAccount(distributorKeypair.publicKey());
      const trustTx = new StellarSdk.TransactionBuilder(distributorAccount, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.changeTrust({
            asset: asset,
            limit: assetLimit || undefined,
          })
        )
        .setTimeout(30)
        .build();

      trustTx.sign(distributorKeypair);
      await server.submitTransaction(trustTx);

      // Issue tokens
      const issueAmount = assetLimit || "1000000";
      const issuerAccount2 = await server.loadAccount(issuerKeypair.publicKey());
      const issueTx = new StellarSdk.TransactionBuilder(issuerAccount2, {
        fee: fee.toString(),
        networkPassphrase,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination: distributorKeypair.publicKey(),
            asset: asset,
            amount: issueAmount,
          })
        )
        .setTimeout(30)
        .build();

      issueTx.sign(issuerKeypair);
      const result = await server.submitTransaction(issueTx);

      setIssuedAsset({
        code: assetCode,
        issuer: issuerKeypair.publicKey(),
        distributor: distributorKeypair.publicKey(),
        distributorSecret: distributorKeypair.secret(),
        amount: issueAmount,
        hash: result.hash,
      });

      toast({
        title: "Token issued successfully!",
        description: `${issueAmount} ${assetCode} tokens created`,
      });
    } catch (error: any) {
      toast({
        title: "Token issuance failed",
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
          <h1 className="text-3xl font-bold">Token Issuance</h1>
          <p className="text-muted-foreground mt-2">
            Create custom tokens on Stellar blockchain
          </p>
        </div>

        <Alert>
          <Coins className="h-4 w-4" />
          <AlertDescription>
            Issue stablecoins, loyalty points, or any custom asset. No smart contract needed!
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Create New Token
              </CardTitle>
              <CardDescription>
                Define your custom asset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assetCode">Asset Code</Label>
                <Input
                  id="assetCode"
                  placeholder="USDT, GOLD, POINTS..."
                  maxLength={12}
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value.toUpperCase())}
                />
                <p className="text-xs text-muted-foreground">
                  1-12 characters (e.g., USDT, GOLD, POINTS)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Supply Limit (Optional)</Label>
                <Input
                  id="limit"
                  type="number"
                  placeholder="1000000"
                  value={assetLimit}
                  onChange={(e) => setAssetLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for unlimited supply
                </p>
              </div>

              <Button
                onClick={handleIssueToken}
                disabled={loading || !assetCode}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Issuing Token...
                  </>
                ) : (
                  <>
                    <Coins className="mr-2 h-4 w-4" />
                    Issue Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Details</CardTitle>
              <CardDescription>
                Your issued token information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {issuedAsset ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Token Issued Successfully!</span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Asset Code:</span>
                      <p className="font-mono font-semibold">{issuedAsset.code}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issuer Address:</span>
                      <p className="font-mono text-xs break-all">{issuedAsset.issuer}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distributor Address:</span>
                      <p className="font-mono text-xs break-all">{issuedAsset.distributor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Distributor Secret:</span>
                      <p className="font-mono text-xs break-all text-red-600">{issuedAsset.distributorSecret}</p>
                      <p className="text-xs text-red-600 mt-1">⚠️ Save this! You'll need it to distribute tokens</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount Issued:</span>
                      <p className="font-semibold">{issuedAsset.amount} {issuedAsset.code}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Issue a token to see details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Token Issuance Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Issuer Account:</strong> Your account that creates and controls the asset.
            </p>
            <p>
              <strong>2. Distributor Account:</strong> Automatically created to hold and distribute tokens.
            </p>
            <p>
              <strong>3. Trustline:</strong> Recipients must create a trustline before receiving your token.
            </p>
            <p>
              <strong>4. Use Cases:</strong> Stablecoins, loyalty points, tokenized assets, community currencies.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

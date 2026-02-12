import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

const Convert = () => {
  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold font-serif mb-6">Convert Assets</h1>
        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-accent" /> Asset Conversion
            </CardTitle>
            <CardDescription>Convert between XLM and test stablecoins</CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium mb-1">Coming Soon</p>
            <p className="text-sm">
              Asset conversion between XLM and test USDC will be available in a future update.
              This feature requires setting up a trustline to a test asset issuer on the Stellar testnet.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Convert;

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Import, AlertTriangle, Eye, EyeOff } from "lucide-react";

export const ImportWalletDialog = () => {
  const { refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [importing, setImporting] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleImport = async () => {
    if (!secretKey.trim()) {
      toast.error("Please enter your Stellar secret key");
      return;
    }

    if (!secretKey.trim().startsWith("S") || secretKey.trim().length !== 56) {
      toast.error("Invalid format. Secret keys start with 'S' and are 56 characters.");
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-wallet", {
        body: { secret_key: secretKey.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Wallet imported successfully!");
      await refreshProfile();
      setOpen(false);
      setSecretKey("");
    } catch (err: any) {
      toast.error(err.message || "Failed to import wallet");
    }
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Import className="h-4 w-4 mr-2" /> Import Existing Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Import Stellar Wallet</DialogTitle>
          <DialogDescription>
            Import a wallet you already own from another app or exchange.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 mt-2">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-foreground">
              <strong>Security Warning:</strong> Your secret key gives full control of your funds. Only enter it if you trust this platform. Never share it with anyone.
            </p>
          </div>
        </div>

        <div className="space-y-3 mt-2">
          <div className="space-y-2">
            <Label>Stellar Secret Key</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="S..."
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Starts with "S" and is 56 characters long.
            </p>
          </div>

          <Button onClick={handleImport} disabled={importing} className="w-full">
            {importing ? "Importing..." : "Import Wallet"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

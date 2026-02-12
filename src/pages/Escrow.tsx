import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";

const escrowSchema = z.object({
  recipientKey: z.string().trim().min(1, "Recipient address required").max(256),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be > 0"),
  deadline: z.string().min(1, "Deadline required"),
});

interface EscrowRecord {
  id: string;
  creator_id: string;
  recipient_id: string;
  amount: number;
  asset: string;
  status: string;
  deadline: string;
  created_at: string;
}

const Escrow = () => {
  const { user } = useAuth();
  const [escrows, setEscrows] = useState<EscrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [recipientKey, setRecipientKey] = useState("");
  const [amount, setAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchEscrows = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("escrows")
      .select("*")
      .order("created_at", { ascending: false });
    setEscrows((data as EscrowRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchEscrows();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      escrowSchema.parse({ recipientKey, amount, deadline });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-escrow", {
        body: {
          recipient_address: recipientKey.trim(),
          amount: amount.trim(),
          deadline,
          asset: "XLM",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Escrow created!");
      setRecipientKey("");
      setAmount("");
      setDeadline("");
      await fetchEscrows();
    } catch (err: any) {
      toast.error(err.message || "Failed to create escrow");
    }
    setCreating(false);
  };

  const handleRelease = async (escrowId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("release-escrow", {
        body: { escrow_id: escrowId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Escrow released!");
      await fetchEscrows();
    } catch (err: any) {
      toast.error(err.message || "Failed to release escrow");
    }
  };

  const statusIcon = (status: string) => {
    if (status === "released") return <CheckCircle className="h-4 w-4 text-success" />;
    if (status === "expired") return <XCircle className="h-4 w-4 text-destructive" />;
    return <Clock className="h-4 w-4 text-warning" />;
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold font-serif">Escrow</h1>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" /> Create Escrow
            </CardTitle>
            <CardDescription>Hold funds until the recipient confirms</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Stellar Address</Label>
                <Input
                  value={recipientKey}
                  onChange={(e) => setRecipientKey(e.target.value)}
                  placeholder="G..."
                  required
                  maxLength={256}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (XLM)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Escrow"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-sm">Your Escrows</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : escrows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No escrows yet</div>
            ) : (
              <div className="divide-y divide-border">
                {escrows.map((esc) => (
                  <div key={esc.id} className="px-6 py-4 flex items-center gap-4">
                    {statusIcon(esc.status)}
                    <div className="flex-1">
                      <div className="text-sm font-medium font-sans">{esc.amount} {esc.asset}</div>
                      <div className="text-xs text-muted-foreground">
                        Deadline: {format(new Date(esc.deadline), "MMM d, yyyy h:mm a")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        esc.status === "released" ? "bg-success/10 text-success" :
                        esc.status === "expired" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {esc.status}
                      </span>
                      {esc.status === "pending" && esc.recipient_id === user?.id && (
                        <Button size="sm" variant="outline" onClick={() => handleRelease(esc.id)}>
                          Release
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Escrow;

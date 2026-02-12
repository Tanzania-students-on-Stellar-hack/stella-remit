import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { txExplorerUrl } from "@/lib/stellar";
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  asset: string;
  memo: string | null;
  tx_hash: string | null;
  status: string;
  created_at: string;
}

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setTransactions((data as Transaction[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold font-serif">Transactions</h1>
          <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => {
                  const isSender = tx.sender_id === user?.id;
                  return (
                    <div key={tx.id} className="flex items-center gap-4 px-6 py-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isSender ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
                      }`}>
                        {isSender ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm font-sans">
                          {isSender ? "Sent" : "Received"} {tx.asset}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), "MMM d, yyyy h:mm a")}
                          {tx.memo && <span className="ml-2">• {tx.memo}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold text-sm font-sans ${
                          isSender ? "text-destructive" : "text-success"
                        }`}>
                          {isSender ? "-" : "+"}{tx.amount} {tx.asset}
                        </div>
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            tx.status === "completed" ? "bg-success/10 text-success" :
                            tx.status === "failed" ? "bg-destructive/10 text-destructive" :
                            "bg-warning/10 text-warning"
                          }`}>
                            {tx.status}
                          </span>
                          {tx.tx_hash && (
                            <a
                              href={txExplorerUrl(tx.tx_hash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TransactionHistory;

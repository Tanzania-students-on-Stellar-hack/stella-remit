import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUpRight, ArrowDownLeft, History, ExternalLink } from "lucide-react";
import { txExplorerUrl } from "@/lib/stellar";
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

export const RecentTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setTransactions((data as Transaction[]) || []);
      setLoading(false);
    };
    fetchRecent();

    // Listen for new transactions in realtime
    const channel = supabase
      .channel("recent-transactions")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "transactions" },
        () => {
          fetchRecent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-sans">Recent Transactions</CardTitle>
        <Link to="/history">
          <Button variant="ghost" size="sm" className="text-xs">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isSender = tx.sender_id === user?.id;
              return (
                <div key={tx.id} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isSender
                        ? "bg-destructive/10 text-destructive"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {isSender ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-sans truncate">
                      {isSender ? "Sent" : "Received"} {tx.asset}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tx.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-1.5">
                    <span
                      className={`text-sm font-semibold font-sans ${
                        isSender ? "text-destructive" : "text-success"
                      }`}
                    >
                      {isSender ? "-" : "+"}
                      {tx.amount}
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as StellarSdk from "https://esm.sh/@stellar/stellar-sdk@13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    // Use anon key to validate user JWT
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    // Use service role key for privileged operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { destination, amount, memo, asset } = await req.json();

    if (!destination || !amount) throw new Error("Missing destination or amount");
    if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");
    if (memo && memo.length > 28) throw new Error("Memo too long");

    const { data: secretData } = await supabase
      .from("stellar_secrets")
      .select("encrypted_secret")
      .eq("user_id", user.id)
      .single();

    if (!secretData) throw new Error("Wallet not found. Please create a wallet first.");

    const senderKeypair = StellarSdk.Keypair.fromSecret(secretData.encrypted_secret);
    const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

    const account = await server.loadAccount(senderKeypair.publicKey());

    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    });

    txBuilder.addOperation(
      StellarSdk.Operation.payment({
        destination: destination,
        asset: StellarSdk.Asset.native(),
        amount: String(amount),
      })
    );

    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    txBuilder.setTimeout(30);
    const tx = txBuilder.build();
    tx.sign(senderKeypair);

    const result = await server.submitTransaction(tx);

    const { data: receiverProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stellar_public_key", destination)
      .single();

    await supabase.from("transactions").insert({
      sender_id: user.id,
      receiver_id: receiverProfile?.user_id || user.id,
      amount: parseFloat(amount),
      asset: asset || "XLM",
      memo: memo || null,
      tx_hash: result.hash,
      status: "completed",
    });

    return new Response(
      JSON.stringify({ tx_hash: result.hash, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

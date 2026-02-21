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

    const { recipient_address, amount, deadline, asset } = await req.json();

    if (!recipient_address || !amount || !deadline) throw new Error("Missing required fields");
    if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");

    const { data: secretData } = await supabase
      .from("stellar_secrets")
      .select("encrypted_secret")
      .eq("user_id", user.id)
      .single();

    if (!secretData) throw new Error("Wallet not found");

    const creatorKeypair = StellarSdk.Keypair.fromSecret(secretData.encrypted_secret);

    // Create escrow keypair — on mainnet, the creator funds it via create_account
    const escrowKeypair = StellarSdk.Keypair.random();
    const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

    // Create and fund the escrow account with the deposit amount + minimum balance (1.5 XLM reserve)
    const creatorAccount = await server.loadAccount(creatorKeypair.publicKey());
    const escrowFundAmount = (parseFloat(amount) + 2).toFixed(7); // extra for base reserve + fees

    const createTx = new StellarSdk.TransactionBuilder(creatorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(StellarSdk.Operation.createAccount({
        destination: escrowKeypair.publicKey(),
        startingBalance: escrowFundAmount,
      }))
      .addMemo(StellarSdk.Memo.text("Escrow deposit"))
      .setTimeout(30)
      .build();

    createTx.sign(creatorKeypair);
    const payResult = await server.submitTransaction(createTx);

    // Look up recipient
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stellar_public_key", recipient_address)
      .single();

    // Store escrow record
    const { error: insertError } = await supabase.from("escrows").insert({
      creator_id: user.id,
      recipient_id: recipientProfile?.user_id || user.id,
      amount: parseFloat(amount),
      asset: asset || "XLM",
      status: "pending",
      deadline: new Date(deadline).toISOString(),
      escrow_public_key: escrowKeypair.publicKey(),
      tx_hashes: [payResult.hash],
    });

    if (insertError) throw insertError;

    // Store escrow secret for later release
    await supabase.from("stellar_secrets").upsert({
      user_id: escrowKeypair.publicKey(),
      encrypted_secret: escrowKeypair.secret(),
    });

    return new Response(
      JSON.stringify({ success: true, escrow_key: escrowKeypair.publicKey(), tx_hash: payResult.hash }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

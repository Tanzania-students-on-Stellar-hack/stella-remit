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
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { recipient_address, amount, deadline, asset } = await req.json();

    if (!recipient_address || !amount || !deadline) throw new Error("Missing required fields");
    if (parseFloat(amount) <= 0) throw new Error("Amount must be positive");

    // Get creator's secret key
    const { data: secretData } = await supabase
      .from("stellar_secrets")
      .select("encrypted_secret")
      .eq("user_id", user.id)
      .single();

    if (!secretData) throw new Error("Wallet not found");

    const creatorKeypair = StellarSdk.Keypair.fromSecret(secretData.encrypted_secret);

    // Create escrow account (a new keypair that will hold the funds)
    const escrowKeypair = StellarSdk.Keypair.random();
    const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

    // Fund escrow account
    const fundRes = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(escrowKeypair.publicKey())}`);
    if (!fundRes.ok) throw new Error("Failed to create escrow account");

    // Transfer funds to escrow
    const creatorAccount = await server.loadAccount(creatorKeypair.publicKey());
    const payTx = new StellarSdk.TransactionBuilder(creatorAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: escrowKeypair.publicKey(),
        asset: StellarSdk.Asset.native(),
        amount: String(amount),
      }))
      .addMemo(StellarSdk.Memo.text("Escrow deposit"))
      .setTimeout(30)
      .build();

    payTx.sign(creatorKeypair);
    const payResult = await server.submitTransaction(payTx);

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

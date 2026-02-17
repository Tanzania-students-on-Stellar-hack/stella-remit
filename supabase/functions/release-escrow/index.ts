import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as StellarSdk from "npm:@stellar/stellar-sdk@13";

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

    const { escrow_id } = await req.json();
    if (!escrow_id) throw new Error("Missing escrow_id");

    const { data: escrow, error: escrowError } = await supabase
      .from("escrows")
      .select("*")
      .eq("id", escrow_id)
      .single();

    if (escrowError || !escrow) throw new Error("Escrow not found");
    if (escrow.status !== "pending") throw new Error("Escrow is not pending");
    if (escrow.recipient_id !== user.id) throw new Error("Only recipient can release");

    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("stellar_public_key")
      .eq("user_id", user.id)
      .single();

    if (!recipientProfile?.stellar_public_key) throw new Error("Recipient has no wallet");

    const { data: escrowSecret } = await supabase
      .from("stellar_secrets")
      .select("encrypted_secret")
      .eq("user_id", escrow.escrow_public_key)
      .single();

    if (!escrowSecret) throw new Error("Escrow secret not found");

    const escrowKeypair = StellarSdk.Keypair.fromSecret(escrowSecret.encrypted_secret);
    const server = new StellarSdk.Horizon.Server("https://horizon.stellar.org");

    const escrowAccount = await server.loadAccount(escrowKeypair.publicKey());

    const releaseTx = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: recipientProfile.stellar_public_key,
        asset: StellarSdk.Asset.native(),
        amount: String(escrow.amount),
      }))
      .addMemo(StellarSdk.Memo.text("Escrow release"))
      .setTimeout(30)
      .build();

    releaseTx.sign(escrowKeypair);
    const result = await server.submitTransaction(releaseTx);

    const txHashes = [...(escrow.tx_hashes || []), result.hash];
    await supabase
      .from("escrows")
      .update({ status: "released", tx_hashes: txHashes })
      .eq("id", escrow_id);

    await supabase.from("transactions").insert({
      sender_id: escrow.creator_id,
      receiver_id: escrow.recipient_id,
      amount: escrow.amount,
      asset: escrow.asset,
      memo: "Escrow release",
      tx_hash: result.hash,
      status: "completed",
    });

    return new Response(
      JSON.stringify({ success: true, tx_hash: result.hash }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

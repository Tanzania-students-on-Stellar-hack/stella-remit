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

    const { secret_key } = await req.json();
    if (!secret_key || typeof secret_key !== "string") {
      throw new Error("Secret key is required");
    }

    // Validate the secret key by deriving the keypair
    let keypair: StellarSdk.Keypair;
    try {
      keypair = StellarSdk.Keypair.fromSecret(secret_key.trim());
    } catch {
      throw new Error("Invalid Stellar secret key. It should start with 'S' and be 56 characters.");
    }

    const publicKey = keypair.publicKey();

    // Check if this public key is already used by another user
    const { data: existing } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("stellar_public_key", publicKey)
      .single();

    if (existing && existing.user_id !== user.id) {
      throw new Error("This wallet is already linked to another account.");
    }

    // Check if user already has a wallet
    const { data: profile } = await supabase
      .from("profiles")
      .select("stellar_public_key")
      .eq("user_id", user.id)
      .single();

    if (profile?.stellar_public_key && profile.stellar_public_key !== publicKey) {
      throw new Error("You already have a wallet linked. Contact support to change it.");
    }

    // Store public key in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stellar_public_key: publicKey })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // Store secret key
    const { error: vaultError } = await supabase.rpc("store_stellar_secret", {
      p_user_id: user.id,
      p_secret_key: secret_key.trim(),
    });

    if (vaultError) {
      await supabase.from("stellar_secrets").upsert({
        user_id: user.id,
        encrypted_secret: secret_key.trim(),
      });
    }

    return new Response(
      JSON.stringify({ public_key: publicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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

    // Check if wallet already exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("stellar_public_key")
      .eq("user_id", user.id)
      .single();

    if (profile?.stellar_public_key) {
      return new Response(
        JSON.stringify({ public_key: profile.stellar_public_key }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate keypair (mainnet — account must be funded externally with real XLM)
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    // Store public key in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ stellar_public_key: publicKey })
      .eq("user_id", user.id);

    if (updateError) throw updateError;

    // Store secret key
    const { error: vaultError } = await supabase.rpc("store_stellar_secret", {
      p_user_id: user.id,
      p_secret_key: secretKey,
    });

    if (vaultError) {
      await supabase.from("stellar_secrets").upsert({
        user_id: user.id,
        encrypted_secret: secretKey,
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

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
    console.log("=== create-wallet started ===");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token received, length:", token.length);

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify JWT and get user using service role
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.error("Auth error:", userError);
      throw new Error(`Authentication failed: ${userError.message}`);
    }
    
    if (!user) {
      throw new Error("User not found");
    }

    console.log("User authenticated:", user.id);

    // Check if wallet already exists
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stellar_public_key")
      .eq("user_id", user.id)
      .single();

    if (profile?.stellar_public_key) {
      console.log("Wallet exists:", profile.stellar_public_key);
      return new Response(
        JSON.stringify({ public_key: profile.stellar_public_key }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating new wallet...");

    // Generate new Stellar keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();

    console.log("Generated public key:", publicKey);

    // Store public key in profile
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ stellar_public_key: publicKey })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Profile update error:", updateError);
      throw updateError;
    }

    // Store secret key
    const { error: secretError } = await supabaseAdmin
      .from("stellar_secrets")
      .upsert({
        user_id: user.id,
        encrypted_secret: secretKey,
      });

    if (secretError) {
      console.error("Secret storage error:", secretError);
      throw secretError;
    }

    console.log("Wallet created successfully!");

    return new Response(
      JSON.stringify({ public_key: publicKey }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

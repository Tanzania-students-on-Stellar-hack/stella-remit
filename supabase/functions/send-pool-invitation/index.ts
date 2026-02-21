import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Note: Deno doesn't support npm packages directly in edge functions
// We'll use fetch API directly with proper Africa's Talking format

const AFRICASTALKING_API_KEY = Deno.env.get("AFRICASTALKING_API_KEY");
const AFRICASTALKING_USERNAME = Deno.env.get("AFRICASTALKING_USERNAME");

interface InvitationRequest {
  phoneNumbers: string[];
  poolName: string;
  poolAddress: string;
  targetAmount: string;
  contributionAmount: string;
  memberCount: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    if (!AFRICASTALKING_API_KEY || !AFRICASTALKING_USERNAME) {
      throw new Error("Africa's Talking credentials not configured");
    }

    const body: InvitationRequest = await req.json();
    const { phoneNumbers, poolName, poolAddress, targetAmount, contributionAmount, memberCount } = body;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error("Phone numbers are required");
    }

    // Prepare SMS message
    const message = `You've been added to "${poolName}" savings pool.\n\nPool Details:\n- Target: ${targetAmount} XLM\n- Your contribution: ${contributionAmount} XLM\n- Members: ${memberCount}\n\nOpen the app to view details and contribute.\n\nPool: ${poolAddress.substring(0, 10)}...`;

    const results = [];

    // Send SMS to each member using Africa's Talking API
    for (const phoneNumber of phoneNumbers) {
      try {
        // Format data as URL-encoded (Africa's Talking requirement)
        const formData = new URLSearchParams();
        formData.append('username', AFRICASTALKING_USERNAME);
        formData.append('to', phoneNumber);
        formData.append('message', message);

        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'apiKey': AFRICASTALKING_API_KEY,
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const result = await response.json();
        
        results.push({
          phoneNumber,
          success: response.ok,
          result,
        });
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitations sent",
        results,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});

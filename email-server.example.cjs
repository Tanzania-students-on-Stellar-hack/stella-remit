// Simple email server using Resend API
// Run with: node email-server.cjs

const http = require('http');

const RESEND_API_KEY = 'YOUR_RESEND_API_KEY_HERE'; // Get from https://resend.com/api-keys
const PORT = 3001;

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/send-email') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Sending email to:', data.emails);

        const results = [];

        for (const email of data.emails) {
          const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Savings Pool Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🏦 Savings Pool Invitation</h1>
              <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">You've been invited to join a savings group!</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">Hello! 👋</p>
              <p style="margin: 0 0 30px 0; color: #374151; font-size: 16px;">You've been invited to join the <strong style="color: #667eea;">${data.poolName}</strong> savings pool.</p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Pool Details</h2>
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Pool Name:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.poolName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Target Amount:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.targetAmount} XLM</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Contribution:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.contributionAmount} XLM per member</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; font-size: 14px;">Members:</td>
                        <td style="color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${data.memberCount} people</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 13px; font-weight: 600;">POOL ADDRESS (SAVE THIS!)</p>
                <p style="margin: 0; color: #78350f; font-size: 12px; font-family: monospace; word-break: break-all;">${data.poolAddress}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:8080/savings-group?pool=${data.poolAddress}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Join Savings Pool →
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px;">
                <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">How to Join:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #1e3a8a; font-size: 14px; line-height: 1.8;">
                  <li>Click the button above</li>
                  <li>Create an account or sign in</li>
                  <li>Create your Stellar wallet</li>
                  <li>Use the pool address to contribute</li>
                </ol>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">Powered by Stellar Blockchain</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Transparent • Secure • Community-Driven</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
          `;

          try {
            const https = require('https');
            const postData = JSON.stringify({
              from: 'Mpange Savings Pool <onboarding@resend.dev>',
              to: [email],
              subject: `You're invited to join ${data.poolName}!`,
              html: emailHTML,
            });

            const options = {
              hostname: 'api.resend.com',
              port: 443,
              path: '/emails',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
              }
            };

            const result = await new Promise((resolve, reject) => {
              const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                  responseData += chunk;
                });
                res.on('end', () => {
                  if (res.statusCode === 200) {
                    resolve({ success: true, email, data: JSON.parse(responseData) });
                  } else {
                    reject({ success: false, email, error: responseData });
                  }
                });
              });

              req.on('error', (error) => {
                reject({ success: false, email, error: error.message });
              });

              req.write(postData);
              req.end();
            });

            results.push(result);
            console.log(`✅ Email sent to ${email}`);
          } catch (error) {
            results.push({ success: false, email, error: error.message || error });
            console.error(`❌ Failed to send to ${email}:`, error);
          }
        }

        const successCount = results.filter(r => r.success).length;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: `Sent ${successCount}/${data.emails.length} emails`,
          results
        }));

      } catch (error) {
        console.error('Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  📧 Email Server Running!                              ║
╠════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                            ║
║  Endpoint: http://localhost:${PORT}/send-email            ║
║  From: onboarding@resend.dev                           ║
╠════════════════════════════════════════════════════════╣
║  ✅ Ready to send emails!                              ║
║  Press Ctrl+C to stop                                  ║
╚════════════════════════════════════════════════════════╝
  `);
});

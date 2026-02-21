// Test multiple Briq API endpoints to find the correct one
// Run with: node test-sms-endpoints.cjs

const https = require('https');

const BRIQ_API_KEY = '3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI';
const PHONE_NUMBER = '+255683859574';

// Try different possible endpoints
const endpoints = [
  { path: '/v1/messages', desc: 'Messages API v1' },
  { path: '/api/v1/messages', desc: 'API Messages v1' },
  { path: '/v1/sms/send', desc: 'SMS Send v1' },
  { path: '/messages', desc: 'Messages direct' },
  { path: '/sms', desc: 'SMS direct' },
];

const message = `Test SMS from Stellar Savings App

You've been added to a savings pool.
Pool: Test Group
Target: 500 XLM

This is a test message.`;

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      to: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    });

    const options = {
      hostname: 'karibu.briq.tz',
      port: 443,
      path: endpoint.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIQ_API_KEY}`,
        'Content-Length': data.length
      }
    };

    console.log(`\n🔍 Testing: ${endpoint.desc}`);
    console.log(`   URL: https://karibu.briq.tz${endpoint.path}`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`   ✅ SUCCESS!`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Response:`, JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(`   Response:`, responseData);
          }
          resolve({ success: true, endpoint: endpoint.path, status: res.statusCode });
        } else {
          console.log(`   ❌ Failed: ${responseData.substring(0, 100)}`);
          resolve({ success: false, endpoint: endpoint.path, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ success: false, endpoint: endpoint.path, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🚀 Testing Briq SMS API Endpoints...\n');
  console.log('📱 Phone: +255683859574');
  console.log('🔑 API Key: ' + BRIQ_API_KEY.substring(0, 20) + '...\n');
  console.log('='.repeat(60));

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between requests
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Summary: Check which endpoint returned 200/201 status');
  console.log('\n💡 If all failed, contact Briq support:');
  console.log('   Email: [email protected]');
  console.log('   Phone: +255 788 344 348');
}

testAllEndpoints();

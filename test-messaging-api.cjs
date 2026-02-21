// Test Briq Messaging API
// Based on Briq documentation structure
// Run with: node test-messaging-api.cjs

const https = require('https');

const BRIQ_API_KEY = '3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI';
const BRIQ_APP_KEY = 'briq_0cf9d6ca3mr9qyzw';
const PHONE_NUMBER = '+255683859574';

const message = `You've been added to "Test Savings Pool" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.`;

// Test different messaging API structures
const tests = [
  {
    desc: 'Instant message with X-API-Key header',
    path: '/v1/messages/instant',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      recipient: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Send message with X-API-Key',
    path: '/v1/messages/send',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      recipient: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Messages create endpoint',
    path: '/v1/messages/create',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      recipient: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Workspace instant message',
    path: '/v1/workspaces/messages/instant',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      recipient: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Messages with to field',
    path: '/v1/messages/instant',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      to: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Messages with phone_number field',
    path: '/v1/messages/instant',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': BRIQ_API_KEY
    },
    body: {
      phone_number: PHONE_NUMBER,
      message: message,
      sender_id: 'BRIQ'
    }
  }
];

function testEndpoint(test) {
  return new Promise((resolve) => {
    const data = JSON.stringify(test.body);

    const options = {
      hostname: 'karibu.briq.tz',
      port: 443,
      path: test.path,
      method: 'POST',
      headers: {
        ...test.headers,
        'Content-Length': data.length
      }
    };

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Test: ${test.desc}`);
    console.log(`   URL: https://karibu.briq.tz${test.path}`);
    console.log(`   Headers: ${JSON.stringify(test.headers, null, 2)}`);
    console.log(`   Body: ${JSON.stringify(test.body, null, 2).substring(0, 150)}...`);

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`\n   📊 Status: ${res.statusCode}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`   ✅ SUCCESS! SMS SENT!`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   📦 Response:`, JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log(`   📦 Response:`, responseData);
          }
          console.log(`\n   🎉🎉🎉 CHECK YOUR PHONE: ${PHONE_NUMBER} 🎉🎉🎉`);
          resolve({ success: true, test: test.desc, status: res.statusCode, endpoint: test.path });
        } else {
          console.log(`   ❌ Failed`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
          } catch (e) {
            console.log(`   Response: ${responseData}`);
          }
          resolve({ success: false, test: test.desc, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      resolve({ success: false, test: test.desc, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Briq Messaging API\n');
  console.log('📱 Phone: +255683859574');
  console.log('🔑 API Key: ' + BRIQ_API_KEY.substring(0, 20) + '...');
  console.log('🔐 App Key: ' + BRIQ_APP_KEY);
  console.log('\n' + '='.repeat(70));

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
    
    if (result.success) {
      console.log('\n\n🎊🎊🎊 FOUND THE WORKING ENDPOINT! 🎊🎊🎊');
      console.log(`Endpoint: ${result.endpoint}`);
      console.log('Stopping tests - we found it!\n');
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 SUMMARY\n');
  
  const successful = results.filter(r => r.success);
  
  if (successful.length > 0) {
    console.log('✅ WORKING ENDPOINT FOUND:');
    successful.forEach(r => {
      console.log(`\n   Endpoint: ${r.endpoint}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Test: ${r.test}`);
    });
    console.log('\n🎉 SMS integration is ready to deploy!');
  } else {
    console.log('❌ No working endpoint found yet.');
    console.log('\n💡 Next: Check Briq dashboard for Messages API documentation');
    console.log('   Or contact: [email protected]');
  }
}

runTests();

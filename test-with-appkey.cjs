// Test Briq API with App Key
// Run with: node test-with-appkey.cjs

const https = require('https');

const BRIQ_API_KEY = '3Orys0634DQ3gfToRVWGAonxcfXO3ovilUZQEfNtrrI';
const BRIQ_APP_KEY = 'briq_0cf9d6ca3mr9qyzw';
const PHONE_NUMBER = '+255683859574';

// Try different endpoint structures with app key
const tests = [
  {
    desc: 'Messages API with app_key in body',
    path: '/v1/messages',
    body: {
      app_key: BRIQ_APP_KEY,
      to: PHONE_NUMBER,
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Messages API with appKey in body',
    path: '/v1/messages',
    body: {
      appKey: BRIQ_APP_KEY,
      to: PHONE_NUMBER,
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Workspace messages endpoint',
    path: `/v1/workspaces/${BRIQ_APP_KEY}/messages`,
    body: {
      to: PHONE_NUMBER,
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'App messages endpoint',
    path: `/v1/apps/${BRIQ_APP_KEY}/messages`,
    body: {
      to: PHONE_NUMBER,
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Direct SMS send with app_key',
    path: '/v1/sms/send',
    body: {
      app_key: BRIQ_APP_KEY,
      to: PHONE_NUMBER,
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
      sender_id: 'BRIQ'
    }
  },
  {
    desc: 'Messages with recipient array',
    path: '/v1/messages',
    body: {
      app_key: BRIQ_APP_KEY,
      recipients: [PHONE_NUMBER],
      message: 'Test SMS from Stellar Savings App. You have been added to a savings pool.',
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
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRIQ_API_KEY}`,
        'Content-Length': data.length
      }
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Test: ${test.desc}`);
    console.log(`   URL: https://karibu.briq.tz${test.path}`);
    console.log(`   Body: ${JSON.stringify(test.body, null, 2).substring(0, 200)}...`);

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
          console.log(`\n   🎉 CHECK YOUR PHONE: ${PHONE_NUMBER}`);
          resolve({ success: true, test: test.desc, status: res.statusCode });
        } else if (res.statusCode === 401) {
          console.log(`   ❌ Authentication failed`);
          console.log(`   Response: ${responseData}`);
          resolve({ success: false, test: test.desc, status: res.statusCode });
        } else if (res.statusCode === 400) {
          console.log(`   ❌ Bad request`);
          try {
            const parsed = JSON.parse(responseData);
            console.log(`   Error: ${JSON.stringify(parsed, null, 2)}`);
          } catch (e) {
            console.log(`   Response: ${responseData}`);
          }
          resolve({ success: false, test: test.desc, status: res.statusCode });
        } else {
          console.log(`   ❌ Failed`);
          console.log(`   Response: ${responseData.substring(0, 200)}`);
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
  console.log('🚀 Testing Briq SMS API with App Key\n');
  console.log('📱 Phone: +255683859574');
  console.log('🔑 API Key: ' + BRIQ_API_KEY.substring(0, 20) + '...');
  console.log('🔐 App Key: ' + BRIQ_APP_KEY);
  console.log('\n' + '='.repeat(60));

  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s between requests
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 SUMMARY\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log('✅ Successful tests:');
    successful.forEach(r => console.log(`   - ${r.test} (${r.status})`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed tests:');
    failed.forEach(r => console.log(`   - ${r.test} (${r.status || 'error'})`));
  }
  
  if (successful.length === 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Check Briq dashboard for API documentation');
    console.log('   2. Verify app key has SMS permissions');
    console.log('   3. Contact Briq support: [email protected]');
  }
}

runTests();

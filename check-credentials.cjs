// Comprehensive Africa's Talking Credentials Validator
// Run with: node check-credentials.cjs

const https = require('https');
const querystring = require('querystring');

const USERNAME = 'saidi';
const API_KEY = 'atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df';

console.log('🔍 Africa\'s Talking Credentials Validator\n');
console.log('=' .repeat(70));
console.log('👤 Username: ' + USERNAME);
console.log('🔑 API Key: ' + API_KEY.substring(0, 30) + '...');
console.log('📏 Key Length: ' + API_KEY.length + ' characters');
console.log('✓ Format Check: ' + (API_KEY.startsWith('atsk_') ? 'VALID' : 'INVALID'));
console.log('=' .repeat(70));

// Test configurations
const tests = [
  {
    name: 'Test 1: Header "apiKey" (lowercase)',
    headers: {
      'apiKey': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 2: Header "Apikey" (capital A)',
    headers: {
      'Apikey': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 3: Header "ApiKey" (camelCase)',
    headers: {
      'ApiKey': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 4: Header "APIKEY" (uppercase)',
    headers: {
      'APIKEY': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 5: Header "api-key" (with dash)',
    headers: {
      'api-key': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 6: Authorization Bearer',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  },
  {
    name: 'Test 7: X-API-Key header',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
];

function testAuth(test) {
  return new Promise((resolve) => {
    const postData = querystring.stringify({
      'username': USERNAME,
      'to': '+255683859574',
      'message': 'Test'
    });

    const options = {
      hostname: 'api.africastalking.com',
      port: 443,
      path: '/version1/messaging',
      method: 'POST',
      headers: {
        ...test.headers,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n${test.name}`);
    console.log('   Headers: ' + JSON.stringify(test.headers, null, 2).replace(/\n/g, '\n   '));

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 401) {
          console.log('   Result: ❌ AUTHENTICATION FAILED');
          resolve({ success: false, status: res.statusCode });
        } else if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('   Result: ✅ SUCCESS! CREDENTIALS ARE VALID!');
          console.log('   Response: ' + responseData.substring(0, 200));
          resolve({ success: true, status: res.statusCode, test: test.name });
        } else {
          console.log(`   Result: ⚠️  Status ${res.statusCode}`);
          console.log('   Response: ' + responseData.substring(0, 200));
          resolve({ success: false, status: res.statusCode, response: responseData });
        }
      });
    });

    req.on('error', (error) => {
      console.log('   Result: ❌ ERROR - ' + error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('\n🧪 Running Authentication Tests...\n');
  
  const results = [];
  
  for (const test of tests) {
    const result = await testAuth(test);
    results.push(result);
    
    if (result.success) {
      console.log('\n🎉🎉🎉 FOUND WORKING CONFIGURATION! 🎉🎉🎉');
      console.log(`Working test: ${result.test}`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 FINAL RESULTS\n');
  
  const successful = results.find(r => r.success);
  
  if (successful) {
    console.log('✅ CREDENTIALS ARE VALID!');
    console.log(`   Working configuration found: ${successful.test}`);
  } else {
    console.log('❌ ALL TESTS FAILED - CREDENTIALS ARE INVALID\n');
    console.log('🔧 Possible Issues:');
    console.log('   1. Username "SOKOCONNECT" is incorrect');
    console.log('   2. API key is expired or revoked');
    console.log('   3. API key belongs to different username');
    console.log('   4. Account is not activated/verified');
    console.log('   5. Account has insufficient balance (for live)');
    console.log('\n💡 Solutions:');
    console.log('   1. Log into https://account.africastalking.com/');
    console.log('   2. Verify your exact username (Settings → Account)');
    console.log('   3. Generate a NEW API key (Settings → API Key)');
    console.log('   4. Check account status and balance');
    console.log('   5. Make sure account is verified');
    console.log('\n📧 If still failing, contact Africa\'s Talking support:');
    console.log('   Email: support@africastalking.com');
    console.log('   Tell them: "Getting 401 authentication error with valid credentials"');
  }
  
  console.log('\n' + '='.repeat(70));
}

runAllTests();

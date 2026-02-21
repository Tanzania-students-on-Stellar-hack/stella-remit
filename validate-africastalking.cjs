// Validate Africa's Talking credentials
// Run with: node validate-africastalking.cjs

const https = require('https');

const AFRICASTALKING_USERNAME = 'SOKOCONNECT';
const AFRICASTALKING_API_KEY = 'atsk_b57e9133b7429e8537fb8a5b9864f8cfd231ce9a788c38cd10307207c0d31830ad1150a0';

console.log('🔍 Validating Africa\'s Talking Credentials\n');
console.log('👤 Username: ' + AFRICASTALKING_USERNAME);
console.log('🔑 API Key: ' + AFRICASTALKING_API_KEY.substring(0, 30) + '...');
console.log('📏 API Key Length: ' + AFRICASTALKING_API_KEY.length);
console.log('✓ Starts with atsk_: ' + AFRICASTALKING_API_KEY.startsWith('atsk_'));
console.log('\n' + '='.repeat(60));

// Test 1: Check application data (doesn't require auth)
console.log('\n📋 Test 1: Checking API endpoint accessibility...');

const options = {
  hostname: 'api.africastalking.com',
  port: 443,
  path: '/version1/messaging',
  method: 'POST',
  headers: {
    'apiKey': AFRICASTALKING_API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('   Status Code: ' + res.statusCode);
    console.log('   Response: ' + responseData);
    
    if (res.statusCode === 401) {
      console.log('\n❌ AUTHENTICATION FAILED');
      console.log('\n🔧 Possible Issues:');
      console.log('   1. API key is expired or invalid');
      console.log('   2. Username doesn\'t match the API key');
      console.log('   3. API key was revoked');
      console.log('\n💡 Solutions:');
      console.log('   1. Log into https://account.africastalking.com/');
      console.log('   2. Go to Settings → API Key');
      console.log('   3. Generate a NEW API key');
      console.log('   4. Verify your username in the dashboard');
      console.log('   5. Update the .env file with new credentials');
    } else if (res.statusCode === 400) {
      console.log('\n⚠️  Bad request (but auth might be OK)');
      console.log('   This is expected without proper request body');
    } else if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅ CREDENTIALS ARE VALID!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network Error:', error.message);
});

req.end();

console.log('\n' + '='.repeat(60));
console.log('\n📝 Next Steps:');
console.log('   1. If authentication failed, get new credentials from:');
console.log('      https://account.africastalking.com/');
console.log('   2. Make sure username matches your account');
console.log('   3. Generate fresh API key');
console.log('   4. Update .env file');
console.log('   5. Run this test again');

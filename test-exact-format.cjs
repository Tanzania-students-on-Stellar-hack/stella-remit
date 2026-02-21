// Test with EXACT format from Africa's Talking docs
// Based on: curl -H "Apikey:KEY" format
// Run with: node test-exact-format.cjs

const https = require('https');
const querystring = require('querystring');

const USERNAME = 'saidi';
const API_KEY = 'atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df';
const PHONE_NUMBER = '+255683859574';

const message = 'Test SMS from Stellar Savings App';

const postData = querystring.stringify({
  'username': USERNAME,
  'to': PHONE_NUMBER,
  'message': message
});

// Try with exact header format from docs: "Apikey:VALUE" (no space after colon)
const options = {
  hostname: 'api.africastalking.com',
  port: 443,
  path: '/version1/messaging',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Apikey': API_KEY,  // Capital A, no colon in value
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing with EXACT doc format\n');
console.log('Headers being sent:');
console.log(JSON.stringify(options.headers, null, 2));
console.log('\nBody:');
console.log(postData);
console.log('\n' + '='.repeat(60));
console.log('\n⏳ Sending...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📊 Status:', res.statusCode);
    console.log('📦 Response:', responseData);
    
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('\n✅✅✅ SUCCESS! SMS SENT! ✅✅✅');
      console.log('📱 Check phone:', PHONE_NUMBER);
      
      try {
        const parsed = JSON.parse(responseData);
        console.log('\nParsed:', JSON.stringify(parsed, null, 2));
      } catch (e) {}
    } else if (res.statusCode === 401) {
      console.log('\n❌ Still 401 - Credentials are definitely wrong');
      console.log('The username or API key does not match Africa\'s Talking records');
    } else {
      console.log('\n⚠️  Different error - Status:', res.statusCode);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(postData);
req.end();

// Fixed Africa's Talking SMS Test
// Based on official documentation format
// Run with: node test-at-fixed.cjs

const https = require('https');
const querystring = require('querystring');

const USERNAME = 'saidi';
const API_KEY = 'atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df';
const PHONE_NUMBER = '+255683859574';

const message = `You've been added to "Test Savings Pool" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.`;

// Format exactly as per official docs
const postData = querystring.stringify({
  'username': USERNAME,
  'to': PHONE_NUMBER,
  'message': message
});

const options = {
  hostname: 'api.africastalking.com',
  port: 443,
  path: '/version1/messaging',
  method: 'POST',
  headers: {
    'Accept': 'application/xml',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Apikey': API_KEY,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing Africa\'s Talking SMS API (Fixed)\n');
console.log('📱 Phone: ' + PHONE_NUMBER);
console.log('👤 Username: ' + USERNAME);
console.log('🔑 API Key: ' + API_KEY.substring(0, 20) + '...');
console.log('\n📝 Message:');
console.log(message);
console.log('\n⏳ Sending SMS...\n');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📊 Response Status:', res.statusCode);
    console.log('\n📦 Response Body:');
    console.log(responseData);
    
    try {
      const parsed = JSON.parse(responseData);
      console.log('\n📋 Parsed Response:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 200 || res.statusCode === 201) {
        console.log('\n✅ SUCCESS! SMS sent successfully!');
        console.log('📱 Check your phone: ' + PHONE_NUMBER);
        
        if (parsed.SMSMessageData && parsed.SMSMessageData.Recipients) {
          console.log('\n📋 Details:');
          parsed.SMSMessageData.Recipients.forEach(recipient => {
            console.log(`   Number: ${recipient.number}`);
            console.log(`   Status: ${recipient.status}`);
            console.log(`   Status Code: ${recipient.statusCode}`);
            console.log(`   Cost: ${recipient.cost}`);
            if (recipient.messageId) {
              console.log(`   Message ID: ${recipient.messageId}`);
            }
          });
        }
      } else {
        console.log('\n❌ ERROR! SMS sending failed.');
      }
    } catch (e) {
      console.log('\n⚠️  Response is not JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(postData);
req.end();

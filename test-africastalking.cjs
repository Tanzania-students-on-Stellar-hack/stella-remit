// Test Africa's Talking SMS API
// Run with: node test-africastalking.cjs

const https = require('https');
const querystring = require('querystring');

const AFRICASTALKING_USERNAME = 'SOKOCONNECT';
const AFRICASTALKING_API_KEY = 'atsk_e17775a6e9b51d27fbacc0442e298f1fff8e301bcfcada560afa709b135ff98c2ac9f781';
const PHONE_NUMBER = '+255683859574';

const message = `You've been added to "Test Savings Pool" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.`;

const postData = querystring.stringify({
  'username': AFRICASTALKING_USERNAME,
  'to': PHONE_NUMBER,
  'message': message
});

const options = {
  hostname: 'api.africastalking.com',
  port: 443,
  path: '/version1/messaging',
  method: 'POST',
  headers: {
    'Apikey': AFRICASTALKING_API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing Africa\'s Talking SMS API\n');
console.log('📱 Phone: ' + PHONE_NUMBER);
console.log('👤 Username: ' + AFRICASTALKING_USERNAME);
console.log('🔑 API Key: ' + AFRICASTALKING_API_KEY.substring(0, 20) + '...');
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
    
    try {
      const parsed = JSON.parse(responseData);
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
            console.log(`   Message ID: ${recipient.messageId}`);
          });
        }
      } else {
        console.log('\n❌ ERROR! SMS sending failed.');
        console.log('Check the response above for details.');
      }
    } catch (e) {
      console.log(responseData);
      console.log('\n⚠️  Could not parse response as JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.write(postData);
req.end();

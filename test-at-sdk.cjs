// Test using official Africa's Talking SDK
// Run with: node test-at-sdk.cjs

const AfricasTalking = require('africastalking');

const USERNAME = 'saidi';
const API_KEY = 'atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df';
const PHONE_NUMBER = '+255683859574';

console.log('🚀 Testing with Official Africa\'s Talking SDK\n');
console.log('👤 Username:', USERNAME);
console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...');
console.log('📱 Phone:', PHONE_NUMBER);
console.log('\n' + '='.repeat(60));

// Initialize SDK
const africastalking = AfricasTalking({
    apiKey: API_KEY,
    username: USERNAME
});

// Get SMS service
const sms = africastalking.SMS;

const message = `You've been added to "Test Savings Pool" savings pool.

Pool Details:
- Target: 500 XLM
- Your contribution: 10 XLM
- Members: 5

Open the app to view details and contribute.`;

console.log('\n📝 Message:');
console.log(message);
console.log('\n⏳ Sending SMS via SDK...\n');

// Send SMS
sms.send({
    to: [PHONE_NUMBER],
    message: message
})
.then(response => {
    console.log('✅ SUCCESS!');
    console.log('\n📦 Response:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.SMSMessageData && response.SMSMessageData.Recipients) {
        console.log('\n📋 Recipients:');
        response.SMSMessageData.Recipients.forEach(recipient => {
            console.log(`\n   Number: ${recipient.number}`);
            console.log(`   Status: ${recipient.status}`);
            console.log(`   Status Code: ${recipient.statusCode}`);
            console.log(`   Cost: ${recipient.cost}`);
            if (recipient.messageId) {
                console.log(`   Message ID: ${recipient.messageId}`);
            }
        });
        
        console.log('\n🎉🎉🎉 SMS SENT! CHECK YOUR PHONE! 🎉🎉🎉');
    }
})
.catch(error => {
    console.log('❌ ERROR!');
    console.log('\nError details:');
    console.log(error);
    
    if (error.message) {
        console.log('\nMessage:', error.message);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify username is correct in dashboard');
    console.log('   2. Generate fresh API key');
    console.log('   3. Check account is verified');
    console.log('   4. Ensure sufficient balance (for live)');
});

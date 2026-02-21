// Simple SDK test - exactly like the Express example
// Run with: node test-sdk-simple.cjs

const AfricasTalking = require('africastalking');

const credentials = {
    apiKey: 'atsk_03744e74016009cd6e993cf55b89f66a2111e36019076753930fca2fd051dc0db3e164df',
    username: 'saidi'
};

console.log('🔧 Initializing Africa\'s Talking SDK...');
console.log('Username:', credentials.username);
console.log('API Key:', credentials.apiKey.substring(0, 20) + '...\n');

const africastalking = AfricasTalking(credentials);
const sms = africastalking.SMS;

console.log('📱 Sending test SMS...\n');

const options = {
    to: ['+255683859574'],
    message: 'Test from Stellar Savings App'
};

sms.send(options)
    .then(response => {
        console.log('✅ SUCCESS!');
        console.log('\nFull Response:');
        console.log(JSON.stringify(response, null, 2));
        
        if (response.SMSMessageData && response.SMSMessageData.Recipients) {
            console.log('\n📋 Recipients:');
            response.SMSMessageData.Recipients.forEach(r => {
                console.log(`  Number: ${r.number}`);
                console.log(`  Status: ${r.status}`);
                console.log(`  StatusCode: ${r.statusCode}`);
                console.log(`  Cost: ${r.cost}`);
                if (r.messageId) console.log(`  MessageId: ${r.messageId}`);
            });
        }
        
        console.log('\n🎉 CHECK YOUR PHONE!');
    })
    .catch(error => {
        console.log('❌ FAILED');
        console.log('\nError:', error.message);
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
        
        console.log('\n💡 This means:');
        if (error.message.includes('401')) {
            console.log('   - Username "saidi" is WRONG, or');
            console.log('   - API key is WRONG or EXPIRED');
            console.log('\n   Go to https://account.africastalking.com/');
            console.log('   1. Check your EXACT username');
            console.log('   2. Generate a NEW API key');
            console.log('   3. Update the credentials above');
        }
    });

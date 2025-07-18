#!/usr/bin/env node

const os = require('os');

console.log('\n🌐 Finding your local IP addresses...\n');

const interfaces = os.networkInterfaces();
const addresses = [];

// Get all IPv4 addresses
for (const name of Object.keys(interfaces)) {
  for (const interface of interfaces[name]) {
    // Skip internal (loopback) addresses
    if (interface.family === 'IPv4' && !interface.internal) {
      addresses.push({
        name: name,
        address: interface.address
      });
    }
  }
}

if (addresses.length === 0) {
  console.log('❌ No network interfaces found. Make sure you\'re connected to a network.');
} else {
  console.log('Your local IP address(es):');
  console.log('─'.repeat(50));
  
  addresses.forEach(({ name, address }) => {
    console.log(`📍 ${name}: ${address}`);
  });
  
  console.log('\n📝 To use for mobile development:');
  console.log('─'.repeat(50));
  console.log('1. Update your .env file:');
  console.log(`   EXPO_PUBLIC_BACKEND_URL=http://${addresses[0].address}:3000\n`);
  console.log('2. Make sure your backend server is running:');
  console.log('   cd backend && npm start\n');
  console.log('3. Restart your Expo development server:');
  console.log('   bunx rork start -p z54qzr5766157j0974fjw --tunnel\n');
  console.log('⚠️  Important: Both your computer and mobile device must be on the same network!\n');
}
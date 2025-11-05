import { setDefaultResultOrder } from 'dns';

// Try IPv4 first
setDefaultResultOrder('ipv4first');

async function testDNS() {
  console.log('Testing with IPv4 priority...\n');
  
  try {
    const response = await fetch('https://www.google.com', {
      method: 'HEAD'
    });
    console.log('✓ Google reachable:', response.status);
  } catch (error) {
    console.error('❌ Still failing:', error.cause?.code || error.message);
  }
}

testDNS();

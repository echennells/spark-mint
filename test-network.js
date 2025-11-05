async function testNetworkConnectivity() {
  console.log('🔍 Testing network connectivity...\n');

  const endpoints = [
    'https://api.lightspark.com',
    'https://0.spark.lightspark.com',
    'https://1.spark.lightspark.com',
    'https://www.google.com'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'spark-mint-debug/1.0'
        }
      });
      console.log(`  ✓ Status: ${response.status} ${response.statusText}\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      console.error(`     Cause: ${error.cause ? error.cause.message : 'none'}\n`);
    }
  }
}

testNetworkConnectivity();

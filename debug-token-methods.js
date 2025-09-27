import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

async function debugTokenMethods() {
  console.log('🔍 Debugging available token methods in Spark SDK...\n');

  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      options: { network: 'MAINNET' }
    });

    console.log('📱 Wallet created:', wallet.sparkAddress);
    console.log('\n🔧 Available methods on wallet:');

    // List all methods on the wallet object
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(wallet))
      .filter(method => typeof wallet[method] === 'function')
      .sort();

    methods.forEach(method => {
      console.log(`  - ${method}`);
    });

    console.log('\n🧪 Testing token-related methods...');

    // Test getTokenBalance
    if (typeof wallet.getTokenBalance === 'function') {
      console.log('\n✅ getTokenBalance method exists');
      try {
        const result = await wallet.getTokenBalance('btkn1xecvlqngfwwvw2z38s67rn23r76m2vpkmwavfr9cr6ytzgqufu0ql0a4qk');
        console.log('getTokenBalance result:', result);
      } catch (error) {
        console.log('getTokenBalance error:', error.message);
      }
    } else {
      console.log('❌ getTokenBalance method does not exist');
    }

    // Test other potential token methods
    const tokenMethods = ['getTokenBalances', 'listTokens', 'getAssetBalance', 'getAssets'];
    for (const methodName of tokenMethods) {
      if (typeof wallet[methodName] === 'function') {
        console.log(`\n✅ ${methodName} method exists`);
        try {
          const result = await wallet[methodName]();
          console.log(`${methodName} result:`, result);
        } catch (error) {
          console.log(`${methodName} error:`, error.message);
        }
      }
    }

    // Check regular balance for comparison
    console.log('\n💰 Regular balance for comparison:');
    const balance = await wallet.getBalance();
    console.log('getBalance result:', balance);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugTokenMethods();
import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { ProxyAgent } from 'undici';

async function testWithProxy() {
  try {
    console.log('🔍 Testing Lightning invoice with proxy configuration...\n');

    const mnemonic = "smart estate problem april prefer judge urban daughter anchor adapt flash shaft";

    // Configure proxy agent
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    console.log('Using proxy:', proxyUrl ? proxyUrl.replace(/jwt_[^@]+@/, 'jwt_***@') : 'none');

    if (proxyUrl) {
      // Set up proxy for fetch
      global.fetch = new Proxy(global.fetch, {
        apply: (target, thisArg, args) => {
          const [url, options = {}] = args;
          return target.call(thisArg, url, {
            ...options,
            dispatcher: new ProxyAgent(proxyUrl)
          });
        }
      });
    }

    console.log('📱 Initializing wallet...');
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('✓ Wallet initialized');
    console.log('⚡ Creating Lightning invoice...');

    const invoice = await wallet.createLightningInvoice({
      amountSats: 3000,
      memo: 'Test invoice with proxy'
    });

    console.log('✓ SUCCESS! Invoice created');
    console.log('\nInvoice:', invoice.encodedInvoice || JSON.stringify(invoice, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.message || error.cause);
    }
  }
}

testWithProxy();

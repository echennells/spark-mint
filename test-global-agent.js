import { bootstrap } from 'global-agent';
import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

// Enable global proxy support before any network calls
bootstrap();

async function testWithGlobalAgent() {
  try {
    console.log('🔍 Testing Lightning invoice with global-agent proxy...\n');

    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    console.log('Proxy configured:', proxyUrl ? 'YES' : 'NO');
    console.log('GLOBAL_AGENT_HTTP_PROXY:', process.env.GLOBAL_AGENT_HTTP_PROXY ? 'SET' : 'NOT SET');

    const mnemonic = "smart estate problem april prefer judge urban daughter anchor adapt flash shaft";

    console.log('\n📱 Initializing wallet...');
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('✓ Wallet initialized');
    console.log('⚡ Spark Address:', wallet.sparkAddress);
    console.log('\n⚡ Creating Lightning invoice for 3000 sats...');

    const invoice = await wallet.createLightningInvoice({
      amountSats: 3000,
      memo: 'Test with global-agent'
    });

    console.log('\n✓ SUCCESS! Invoice created!');
    const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;
    console.log('\n⚡ Lightning Invoice:');
    console.log(invoiceString);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause.code || error.cause.message || error.cause);
    }
  }
}

testWithGlobalAgent();

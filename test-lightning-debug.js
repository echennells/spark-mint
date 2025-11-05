import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

async function testLightningInvoice() {
  try {
    console.log('🔍 Debugging Lightning invoice creation...\n');
    
    const mnemonic = "smart estate problem april prefer judge urban daughter anchor adapt flash shaft";
    
    console.log('📱 Initializing wallet from mnemonic...');
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });
    
    console.log('✓ Wallet initialized');
    console.log('⚡ Spark Address:', wallet.sparkAddress);
    
    console.log('\n🔌 Attempting to create Lightning invoice...');
    console.log('   Amount: 3000 sats');
    
    try {
      const invoice = await wallet.createLightningInvoice({
        amountSats: 3000,
        memo: 'Test invoice'
      });
      
      console.log('✓ Success! Invoice created:');
      console.log(JSON.stringify(invoice, null, 2));
      
    } catch (invoiceError) {
      console.error('\n❌ DETAILED ERROR:');
      console.error('Message:', invoiceError.message);
      console.error('Name:', invoiceError.name);
      console.error('Stack:', invoiceError.stack);
      console.error('\nFull error object:', JSON.stringify(invoiceError, Object.getOwnPropertyNames(invoiceError), 2));
      
      if (invoiceError.cause) {
        console.error('\nCause:', invoiceError.cause);
      }
    }
    
  } catch (error) {
    console.error('❌ Wallet initialization error:', error);
  }
}

testLightningInvoice();

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

async function generateWalletAndInvoice() {
  console.log('🆕 Creating a fresh wallet and Lightning invoice\n');

  try {
    // Step 1: Create a brand new wallet
    const { wallet, mnemonic } = await IssuerSparkWallet.initialize({
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 NEW WALLET CREATED!');
    console.log('════════════════════════════════════════');
    console.log('🔑 MNEMONIC:', mnemonic);
    console.log('════════════════════════════════════════');
    console.log('\n⚠️  SAVE THIS MNEMONIC!\n');

    // Step 2: Get addresses and current balance
    const l1Address = await wallet.getTokenL1Address();
    const sparkAddress = wallet.sparkAddress;
    const balance = await wallet.getBalance();

    console.log('💰 Bitcoin Address:', l1Address);
    console.log('⚡ Spark Address:', sparkAddress);
    console.log('📊 Current Balance:', balance.balance, 'sats');

    // Step 3: Create Lightning invoice for funding
    console.log('\n⚡ Creating Lightning invoice for 3000 sats...');

    try {
      const invoice = await wallet.createLightningInvoice({
        amountSats: 3000,
        memo: 'Funding new wallet for token creation'
      });

      const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;

      console.log('\n⚡ Lightning Invoice:');
      console.log(invoiceString);

      console.log('\n🚀 FUNDING OPTIONS:');
      console.log('1. Pay Lightning invoice above (3000 sats)');
      console.log('2. Send Spark sats to:', sparkAddress);
      console.log('3. Send Bitcoin to:', l1Address);

      console.log('\n📝 NEXT STEPS:');
      console.log('1. Fund the wallet using any option above');
      console.log('2. Run: node completely-fresh-token.js "' + mnemonic + '"');

    } catch (invoiceError) {
      console.error('❌ Lightning invoice creation failed:', invoiceError.message);
      console.log('\n🔄 Alternative funding options:');
      console.log('   Send Spark sats to:', sparkAddress);
      console.log('   Send Bitcoin to:', l1Address);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateWalletAndInvoice();
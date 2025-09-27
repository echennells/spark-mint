import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { generateMnemonic } from 'bip39';

async function createNewWallet4000SatInvoice() {
  console.log('🔑 Creating new wallet...\n');

  try {
    // Generate a new random mnemonic phrase
    const newMnemonic = generateMnemonic();
    console.log('🔐 Generated new mnemonic phrase:');
    console.log(newMnemonic);
    console.log('⚠️  SAVE THIS PHRASE! It controls your wallet.\n');

    // Initialize wallet with the new mnemonic
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: newMnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('✅ New wallet created!');
    console.log('📱 Wallet Address:', wallet.sparkAddress);

    // Create 4000 sat Lightning invoice
    const invoice = await wallet.createLightningInvoice({
      amountSats: 4000,
      memo: 'Fund new wallet with 4000 sats'
    });

    const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;

    console.log('⚡ Lightning Invoice (4000 sats):');
    console.log(invoiceString);

    console.log('\n💰 Payment Details:');
    console.log('Amount: 4000 sats');
    console.log('Wallet: ' + wallet.sparkAddress);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createNewWallet4000SatInvoice();
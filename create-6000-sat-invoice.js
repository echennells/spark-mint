import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = "dinosaur pistol hero option spawn wild pond rich sight scale manual glory";

async function create6000SatInvoice() {
  console.log('⚡ Creating 6000 sat Lightning invoice...\n');

  try {
    // Initialize the existing wallet
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet Address:', wallet.sparkAddress);

    // Create 6000 sat Lightning invoice
    const invoice = await wallet.createLightningInvoice({
      amountSats: 6000,
      memo: 'Funding wallet for 6000 sats token creation'
    });

    const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;

    console.log('\n⚡ Lightning Invoice (6000 sats):');
    console.log(invoiceString);

    console.log('\n💰 Payment Details:');
    console.log('Amount: 6000 sats');
    console.log('Wallet: ' + wallet.sparkAddress);

  } catch (error) {
    console.error('❌ Error creating invoice:', error.message);
  }
}

create6000SatInvoice();
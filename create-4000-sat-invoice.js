import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = "flavor company game shed outer pigeon drill adjust lend ozone nice zero";

async function create4000SatInvoice() {
  console.log('⚡ Creating 4000 sat Lightning invoice...\n');

  try {
    // Initialize the wallet
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet Address:', wallet.sparkAddress);

    // Create 4000 sat Lightning invoice
    const invoice = await wallet.createLightningInvoice({
      amountSats: 4000,
      memo: 'Funding wallet for 4000 sats'
    });

    const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;

    console.log('\n⚡ Lightning Invoice (4000 sats):');
    console.log(invoiceString);

    console.log('\n💰 Payment Details:');
    console.log('Amount: 4000 sats');
    console.log('Wallet: ' + wallet.sparkAddress);

  } catch (error) {
    console.error('❌ Error creating invoice:', error.message);
  }
}

create4000SatInvoice();
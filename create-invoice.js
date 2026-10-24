#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const amountSats = process.argv[3] || 1000;

if (!mnemonic) {
  console.log('Usage: node create-invoice.js "your mnemonic" [amount_sats]');
  console.log('');
  console.log('Example:');
  console.log('  node create-invoice.js "your mnemonic" 5000');
  console.log('');
  console.log('Default amount: 1000 sats');
  process.exit(1);
}

async function createInvoice() {
  console.log('\n⚡ Creating Lightning Invoice\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  console.log('📱 Wallet:', wallet.sparkAddress);

  const balance = await wallet.getBalance();
  console.log('💰 Current balance:', balance.balance, 'sats\n');

  try {
    const invoice = await wallet.createLightningInvoice({
      amountSats: parseInt(amountSats),
      memo: 'Spark wallet funding'
    });

    const invoiceString = invoice.invoice?.encodedInvoice || invoice.encodedInvoice || invoice.paymentRequest || invoice;

    console.log('✅ Lightning Invoice Created!\n');
    console.log('Amount:', amountSats, 'sats');
    console.log('\nInvoice:');
    console.log(invoiceString);
    console.log('');

  } catch (error) {
    console.error('❌ Error creating invoice:', error.message);
    if (error.context) {
      console.error('Context:', JSON.stringify(error.context, null, 2));
    }
  }
}

createInvoice().catch(console.error);

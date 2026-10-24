#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const invoice = process.argv[3];

if (!mnemonic || !invoice) {
  console.log('Usage: node pay-lightning-invoice.js "your mnemonic" "lightning_invoice"');
  console.log('');
  console.log('Example:');
  console.log('  node pay-lightning-invoice.js "your mnemonic" "lnbc..."');
  process.exit(1);
}

async function payLightningInvoice() {
  console.log('\nPaying Lightning Invoice\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const balance = await wallet.getBalance();
  console.log('Current balance:', balance.balance, 'sats');

  console.log('\nPaying invoice:', invoice.substring(0, 50) + '...');

  try {
    const result = await wallet.payLightningInvoice({
      invoice: invoice
    });

    console.log('\n✅ Payment successful!');
    console.log('Payment result:', result);

    // Check new balance
    const newBalance = await wallet.getBalance();
    console.log('\nNew balance:', newBalance.balance, 'sats');

  } catch (error) {
    console.error('\n❌ Payment failed:', error.message);
    if (error.context) {
      console.error('Context:', JSON.stringify(error.context, null, 2));
    }
  }
}

payLightningInvoice().catch(console.error);

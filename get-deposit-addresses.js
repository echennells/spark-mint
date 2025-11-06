#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const amountSats = parseInt(process.argv[3]) || 50000; // Default 50k sats for testing exit

if (!mnemonic) {
  console.log('Usage: node get-deposit-addresses.js "your mnemonic" [amount-in-sats]');
  console.log('');
  console.log('Generates deposit addresses for your existing wallet.');
  console.log('');
  console.log('Examples:');
  console.log('  node get-deposit-addresses.js "your mnemonic" 50000');
  console.log('  node get-deposit-addresses.js "your mnemonic" 100000');
  process.exit(1);
}

async function getDepositAddresses() {
  console.log('💰 Getting Deposit Addresses\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const sparkAddress = await wallet.getSparkAddress();
  const balance = await wallet.getBalance();
  const leaves = await wallet.getLeaves();

  console.log('📱 Your Wallet:');
  console.log('─────────────────────────────────────────────────────');
  console.log('Spark Address:', sparkAddress);
  console.log('Current Balance:', balance.balance, 'sats');
  console.log('Current Leaves:', leaves.length);
  console.log('─────────────────────────────────────────────────────\n');

  // Get Bitcoin L1 deposit address
  console.log('🔗 BITCOIN L1 DEPOSIT ADDRESS:\n');
  try {
    const staticDepositAddress = await wallet.getStaticDepositAddress();
    console.log('  ' + staticDepositAddress);
    console.log('');
    console.log('  Send Bitcoin to this address, then run:');
    console.log('  node claim-l1-deposit.js "your mnemonic" <txid>\n');
  } catch (error) {
    console.log('  ❌ Could not get L1 address:', error.message, '\n');
  }

  // Get Lightning invoice
  console.log('⚡ LIGHTNING INVOICE:\n');
  try {
    const invoice = await wallet.createLightningInvoice({
      amountSats: amountSats,
      memo: `Add ${amountSats} sats for uncooperative exit test`
    });

    const invoiceString = invoice.invoice?.encodedInvoice ||
                         invoice.encodedInvoice ||
                         invoice.paymentRequest ||
                         invoice;

    console.log('  Amount: ' + amountSats + ' sats');
    console.log('  Invoice:');
    console.log('  ' + invoiceString);
    console.log('');
    console.log('  Pay this invoice and sats will arrive automatically!\n');
  } catch (error) {
    console.log('  ❌ Could not create Lightning invoice:', error.message, '\n');
  }

  // Show Spark address for receiving from other Spark users
  console.log('✨ SPARK ADDRESS (for Spark-to-Spark transfers):\n');
  console.log('  ' + sparkAddress);
  console.log('');
  console.log('  Share this with other Spark users to receive sats.\n');

  console.log('═'.repeat(70));
  console.log('\n💡 RECOMMENDATION FOR UNCOOPERATIVE EXIT TEST:\n');

  const currentCost = leaves.length * 2900; // rough estimate
  const neededForTest = currentCost * 2; // 2x the cost to be safe

  console.log(`  Current balance: ${balance.balance} sats`);
  console.log(`  Estimated exit cost: ~${currentCost.toLocaleString()} sats (at 1 sat/vbyte)`);
  console.log(`  Recommended deposit: ${neededForTest.toLocaleString()} sats`);
  console.log('');
  console.log(`  This will give you ~${neededForTest + Number(balance.balance)} sats total,`);
  console.log('  enough to cover exit fees and have sats left over.\n');

  console.log('═'.repeat(70));
}

getDepositAddresses().catch(console.error);

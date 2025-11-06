#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node show-deposit-info.js "your mnemonic"');
  process.exit(1);
}

async function showDepositInfo() {
  console.log('💰 Deposit Information\n');
  console.log('═'.repeat(70), '\n');

  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    // Try to get addresses (these work offline mostly)
    let sparkAddress, staticDepositAddress, balance, leaves;

    try {
      sparkAddress = await wallet.getSparkAddress();
      console.log('✨ SPARK ADDRESS (for Spark-to-Spark transfers):\n');
      console.log('   ' + sparkAddress);
      console.log('\n');
    } catch (e) {
      console.log('❌ Could not get Spark address:', e.message, '\n');
    }

    try {
      staticDepositAddress = await wallet.getStaticDepositAddress();
      console.log('🔗 BITCOIN L1 DEPOSIT ADDRESS:\n');
      console.log('   ' + staticDepositAddress);
      console.log('\n   Send Bitcoin here, then claim with:');
      console.log('   node claim-l1-deposit.js "your mnemonic" <txid>\n');
    } catch (e) {
      console.log('❌ Could not get L1 address:', e.message, '\n');
    }

    try {
      balance = await wallet.getBalance();
      leaves = await wallet.getLeaves();
      console.log('📊 CURRENT STATE:\n');
      console.log('   Balance: ' + balance.balance + ' sats');
      console.log('   Leaves:  ' + leaves.length);
      console.log('\n');
    } catch (e) {
      console.log('⚠️  Could not get balance:', e.message, '\n');
    }

    // Lightning invoices require online connection
    console.log('⚡ LIGHTNING INVOICES:\n');
    console.log('   Attempting to create invoices...\n');

    const amounts = [2000, 3000];
    for (const amount of amounts) {
      try {
        const invoice = await wallet.createLightningInvoice({
          amountSats: amount,
          memo: `Deposit ${amount} sats for uncooperative exit test`
        });

        const invoiceString = invoice.invoice?.encodedInvoice ||
                             invoice.encodedInvoice ||
                             invoice.paymentRequest ||
                             invoice;

        console.log(`   ${amount} sats invoice:`);
        console.log('   ' + invoiceString);
        console.log('\n');
      } catch (e) {
        console.log(`   ❌ ${amount} sats invoice failed: ${e.message}`);
      }
    }

    console.log('═'.repeat(70));
    console.log('\n💡 FOR UNCOOPERATIVE EXIT TEST AT 0.15 SAT/VBYTE:\n');
    console.log('   Current balance: 3,000 sats');
    console.log('   Exit cost: 7,860 sats');
    console.log('   Need to deposit: ~5,000 sats minimum');
    console.log('   Recommended: 7,000-12,000 sats for buffer\n');
    console.log('═'.repeat(70));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n⚠️  Spark server may be unavailable.');
    console.log('   You can still use the L1 Bitcoin address once generated.');
  }
}

showDepositInfo().catch(console.error);

#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node diagnose-transfers.js "your mnemonic phrase"');
  process.exit(1);
}

async function diagnoseTransfers() {
  console.log('🔍 Diagnosing Transfer Status\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const address = await wallet.getSparkAddress();
  console.log('📱 Wallet Address:', address);

  const leaves = await wallet.getLeaves();
  const balance = await wallet.getBalance();
  console.log(`📋 Leaves: ${leaves.length}`);
  console.log(`💰 Balance: ${balance.balance} sats\n`);

  // Try to access the transferService directly
  console.log('🔎 Checking for pending transfers...\n');

  try {
    // Access the internal transfer service
    const transferService = wallet.transferService;

    if (transferService && transferService.queryPendingTransfers) {
      const pendingResult = await transferService.queryPendingTransfers();

      console.log('📬 Pending Transfers:');
      if (pendingResult && pendingResult.transfers) {
        console.log(`   Count: ${pendingResult.transfers.length}\n`);

        for (const transfer of pendingResult.transfers) {
          console.log(`   Transfer ID: ${transfer.id}`);
          console.log(`   Status: ${transfer.status}`);
          console.log(`   Type: ${transfer.type}`);
          console.log(`   Value: ${transfer.totalValue} sats`);
          console.log(`   Receiver: ${transfer.receiverSparkAddress?.substring(0, 20)}...`);
          console.log('');
        }
      } else {
        console.log('   No pending transfers found.\n');
      }
    } else {
      console.log('   Cannot access transfer service.\n');
    }

    // Check if there's an optimization flag
    console.log('💡 Analysis:');
    if (leaves.length === 18) {
      console.log('   Your leaves are still fragmented (18 leaves).');
      console.log('   Self-transfers may not be triggering optimization.\n');
      console.log('   Possible reasons:');
      console.log('   1. Transfers are pending and not yet claimed');
      console.log('   2. Self-transfers might not trigger optimizeLeaves()');
      console.log('   3. Need to wait longer for background processing\n');
      console.log('💡 Alternative approach:');
      console.log('   Send your sats to a DIFFERENT wallet, then send back.');
      console.log('   This definitely triggers optimization on receive.');
    }

  } catch (error) {
    console.error('❌ Error checking transfers:', error.message);
  }
}

diagnoseTransfers().catch(console.error);

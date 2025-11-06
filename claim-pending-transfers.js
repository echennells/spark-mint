#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node claim-pending-transfers.js "your mnemonic phrase"');
  process.exit(1);
}

async function claimPendingTransfers() {
  console.log('🔍 Checking for Pending Transfers\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const address = await wallet.getSparkAddress();
  console.log('📱 Wallet Address:', address);

  // Get current state before claiming
  const leavesBefore = await wallet.getLeaves();
  const balanceBefore = await wallet.getBalance();
  console.log(`📋 Current Leaves: ${leavesBefore.length}`);
  console.log(`💰 Current Balance: ${balanceBefore.balance} sats\n`);

  // Check for pending transfers
  console.log('🔎 Looking for pending transfers...');

  try {
    // Get all transfers (this should include pending ones)
    const transfers = await wallet.getTransfers();

    if (!transfers || transfers.length === 0) {
      console.log('⚠️  No transfers found.');
      return;
    }

    console.log(`📬 Found ${transfers.length} transfer(s)\n`);

    // Try to claim any pending transfers
    let claimedCount = 0;
    for (const transfer of transfers) {
      console.log(`Checking transfer: ${transfer.id}`);
      console.log(`  Status: ${transfer.status || 'unknown'}`);
      console.log(`  Amount: ${transfer.totalValue || 0} sats`);

      try {
        // Attempt to claim
        console.log('  Attempting to claim...');
        await wallet.claimTransfers();
        claimedCount++;
        console.log('  ✅ Claimed successfully\n');
      } catch (error) {
        console.log(`  ℹ️  ${error.message}\n`);
      }
    }

    if (claimedCount > 0) {
      // Wait for processing
      console.log('⏳ Waiting for claims to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Check new state
      const leavesAfter = await wallet.getLeaves();
      const balanceAfter = await wallet.getBalance();

      console.log('\n📊 RESULTS:');
      console.log('─────────────────────────────────');
      console.log(`Leaves Before: ${leavesBefore.length}`);
      console.log(`Leaves After:  ${leavesAfter.length}`);
      console.log(`Balance:       ${balanceAfter.balance} sats`);
      console.log('─────────────────────────────────');

      if (leavesAfter.length < leavesBefore.length) {
        console.log(`\n🎉 Success! Reduced from ${leavesBefore.length} to ${leavesAfter.length} leaves.`);
        console.log(`   That's ${leavesBefore.length - leavesAfter.length} fewer leaves (${Math.round((1 - leavesAfter.length/leavesBefore.length) * 100)}% reduction)`);
      } else if (leavesAfter.length > leavesBefore.length) {
        console.log(`\n⚠️  Leaves increased to ${leavesAfter.length}. Transfer was claimed but not yet optimized.`);
        console.log('   Spark may optimize automatically, or wait and try consolidation again.');
      } else {
        console.log(`\n⚠️  No change in leaf count yet.`);
      }
    } else {
      console.log('\nℹ️  No new transfers to claim.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.context) {
      console.error('   Context:', error.context);
    }
  }
}

claimPendingTransfers().catch(console.error);

#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node consolidate-leaves.js "your mnemonic phrase"');
  console.log('');
  console.log('   This will transfer all your sats to yourself,');
  console.log('   consolidating many small leaves into fewer larger ones.');
  process.exit(1);
}

async function consolidateLeaves() {
  console.log('🔄 Consolidating Wallet Leaves\n');
  console.log('This will send your entire balance to yourself to merge small leaves.\n');

  // Initialize wallet
  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const address = wallet.getWalletAddress();
  console.log('📱 Wallet Address:', address);

  // Get current state
  const leaves = await wallet.getLeaves();
  const balance = await wallet.getBalance();

  console.log(`📋 Current Leaves: ${leaves.length}`);
  console.log(`💰 Current Balance: ${balance.balance} sats\n`);

  if (leaves.length <= 1) {
    console.log('✅ Already optimized! You only have 1 leaf.');
    return;
  }

  if (balance.balance === 0n) {
    console.log('⚠️  No balance to consolidate.');
    return;
  }

  console.log('🚀 Sending entire balance to yourself...');
  console.log('   This will consolidate your leaves.\n');

  try {
    // Transfer entire balance to self
    const result = await wallet.transfer({
      receiverSparkAddress: address,
      amountSats: Number(balance.balance),
    });

    console.log('✅ Consolidation transfer initiated!');
    console.log(`   Transfer ID: ${result}\n`);

    // Wait a moment for the transfer to process
    console.log('⏳ Waiting for transfer to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check new state
    const newLeaves = await wallet.getLeaves();
    const newBalance = await wallet.getBalance();

    console.log('\n📊 RESULTS:');
    console.log('─────────────────────────────────');
    console.log(`Leaves Before: ${leaves.length}`);
    console.log(`Leaves After:  ${newLeaves.length}`);
    console.log(`Balance:       ${newBalance.balance} sats`);
    console.log('─────────────────────────────────');

    if (newLeaves.length < leaves.length) {
      console.log(`\n🎉 Success! Reduced from ${leaves.length} to ${newLeaves.length} leaves.`);
    } else {
      console.log(`\n⚠️  Leaves not reduced yet. May need to claim the transfer.`);
      console.log('   Try running this script again in a few seconds.');
    }

  } catch (error) {
    console.error('\n❌ Consolidation failed:', error.message);
    if (error.context) {
      console.error('   Context:', error.context);
    }
  }
}

consolidateLeaves().catch(console.error);

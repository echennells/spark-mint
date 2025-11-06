#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const waitSeconds = parseInt(process.argv[3]) || 10;

if (!mnemonic) {
  console.log('Usage: node claim-pending-transfers.js "your mnemonic phrase" [wait-seconds]');
  console.log('');
  console.log('The wallet auto-claims transfers when initialized.');
  console.log('This script just waits for the wallet to sync and shows the result.');
  process.exit(1);
}

async function checkWalletAfterClaim() {
  console.log('🔍 Waiting for Wallet to Sync and Auto-Claim Transfers\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const address = await wallet.getSparkAddress();
  console.log('📱 Wallet Address:', address);

  console.log(`⏳ Waiting ${waitSeconds} seconds for auto-claim to process...\n`);

  // Wait for the wallet to auto-claim (it does this automatically)
  await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));

  // Check current state
  const leaves = await wallet.getLeaves();
  const balance = await wallet.getBalance();

  console.log('📊 CURRENT STATE:');
  console.log('─────────────────────────────────');
  console.log(`Leaves:  ${leaves.length}`);
  console.log(`Balance: ${balance.balance} sats`);
  console.log('─────────────────────────────────\n');

  // Calculate optimal for comparison
  const optimalLeaves = balance.balance.toString(2).split('1').length - 1;
  console.log(`💡 Optimal for ${balance.balance} sats: ${optimalLeaves} leaves (binary representation)\n`);

  if (leaves.length === optimalLeaves) {
    console.log('🎉 OPTIMIZED! Your wallet is at the theoretical minimum!');
  } else if (leaves.length < 10) {
    console.log('✅ Good consolidation! Wallet is reasonably optimized.');
  } else if (leaves.length < 18) {
    console.log('⚠️  Partial consolidation. May need more time or another consolidation cycle.');
  } else {
    console.log('❌ No consolidation yet. The transfer may still be pending.');
    console.log('   Try running the consolidate-leaves.js script again,');
    console.log('   or wait longer and run this script again with more wait time:');
    console.log(`   node claim-pending-transfers.js "mnemonic" 30`);
  }

  console.log('\n📋 Leaf breakdown:');
  const valueGroups = {};
  for (const leaf of leaves) {
    const value = Number(leaf.value || 0n);
    valueGroups[value] = (valueGroups[value] || 0) + 1;
  }

  const sortedValues = Object.keys(valueGroups).map(Number).sort((a, b) => b - a);
  for (const value of sortedValues) {
    const count = valueGroups[value];
    console.log(`  ${value.toString().padStart(6)} sats × ${count}`);
  }
}

checkWalletAfterClaim().catch(console.error);

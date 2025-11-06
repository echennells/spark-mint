#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node show-leaf-history.js "your mnemonic phrase"');
  process.exit(1);
}

async function showLeafHistory() {
  console.log('🔍 Analyzing Leaf History\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: {
      network: "MAINNET",
    },
  });

  const address = await wallet.getSparkAddress();
  console.log('📱 Wallet Address:', address);

  const balance = await wallet.getBalance();
  console.log(`💰 Total Balance: ${balance.balance} sats\n`);

  const leaves = await wallet.getLeaves();
  console.log(`📋 Total Leaves: ${leaves.length}\n`);

  // Group leaves by value to find patterns
  const valueGroups = {};
  for (const leaf of leaves) {
    const value = Number(leaf.value || 0n);
    if (!valueGroups[value]) {
      valueGroups[value] = [];
    }
    valueGroups[value].push(leaf);
  }

  console.log('📊 LEAF DISTRIBUTION BY VALUE:\n');
  const sortedValues = Object.keys(valueGroups).map(Number).sort((a, b) => b - a);

  for (const value of sortedValues) {
    const count = valueGroups[value].length;
    const total = value * count;
    console.log(`  ${value.toString().padStart(6)} sats × ${count} leaf${count > 1 ? 's' : ' '} = ${total.toString().padStart(6)} sats`);
  }

  console.log('\n🔢 VALUE PATTERN ANALYSIS:\n');

  // Check if binary pattern
  const isBinaryPattern = sortedValues.every(v => {
    return v === 0 || (v & (v - 1)) === 0; // Check if power of 2
  });

  if (isBinaryPattern) {
    console.log('  ✅ Binary (power-of-2) pattern detected!');
    console.log('  This suggests denomination-based splitting (like making change)');
  }

  console.log('\n📝 DETAILED LEAF BREAKDOWN:\n');
  console.log('Leaf # | Value (sats) | Leaf ID (first 12 chars)');
  console.log('────────────────────────────────────────────────');

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const value = Number(leaf.value || 0n);
    const id = leaf.id?.substring(0, 12) || 'unknown';
    console.log(`  ${(i+1).toString().padStart(2)}   | ${value.toString().padStart(12)} | ${id}`);
  }

  console.log('\n💡 ANALYSIS:\n');

  const totalValue = sortedValues.reduce((sum, v) => sum + (v * valueGroups[v].length), 0);
  console.log(`  Total value: ${totalValue} sats`);
  console.log(`  Number of leaves: ${leaves.length}`);
  console.log(`  Average leaf size: ${Math.round(totalValue / leaves.length)} sats`);

  if (isBinaryPattern) {
    console.log('\n  🎯 CONCLUSION:');
    console.log('  Your leaves follow a binary denomination pattern (1, 2, 4, 8, 16, 32, etc.)');
    console.log('  This is likely how Spark splits deposits for privacy/flexibility.');
    console.log('  One deposit can be split into multiple leaves to enable efficient transfers.');
  }
}

showLeafHistory().catch(console.error);

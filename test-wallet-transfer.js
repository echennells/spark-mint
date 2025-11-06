#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { generateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

const sourceMnemonic = process.argv[2];

if (!sourceMnemonic) {
  console.log('Usage: node test-wallet-transfer.js "source mnemonic"');
  console.log('');
  console.log('This script will:');
  console.log('1. Create a new temporary wallet');
  console.log('2. Transfer your sats to it');
  console.log('3. Check how many leaves the new wallet gets');
  console.log('4. Show you the new wallet mnemonic so you can transfer back later');
  process.exit(1);
}

async function testWalletTransfer() {
  console.log('🧪 EXPERIMENT: Testing Leaf Creation on Receive\n');
  console.log('═'.repeat(70));

  // Initialize source wallet
  console.log('\n📱 STEP 1: Loading source wallet...\n');
  const { wallet: sourceWallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: sourceMnemonic,
    options: { network: "MAINNET" },
  });

  const sourceAddress = await sourceWallet.getSparkAddress();
  const sourceLeaves = await sourceWallet.getLeaves();
  const sourceBalance = await sourceWallet.getBalance();

  console.log('Source Wallet:');
  console.log(`  Address: ${sourceAddress}`);
  console.log(`  Leaves:  ${sourceLeaves.length}`);
  console.log(`  Balance: ${sourceBalance.balance} sats`);

  // Show leaf breakdown
  console.log('\n  Leaf breakdown:');
  const sourceGroups = {};
  for (const leaf of sourceLeaves) {
    const value = Number(leaf.value || 0n);
    sourceGroups[value] = (sourceGroups[value] || 0) + 1;
  }
  const sortedValues = Object.keys(sourceGroups).map(Number).sort((a, b) => b - a);
  for (const value of sortedValues) {
    console.log(`    ${value.toString().padStart(6)} sats × ${sourceGroups[value]}`);
  }

  // Generate new wallet
  console.log('\n📱 STEP 2: Creating new temporary wallet...\n');
  const newMnemonic = generateMnemonic(wordlist);

  const { wallet: newWallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: newMnemonic,
    options: { network: "MAINNET" },
  });

  const newAddress = await newWallet.getSparkAddress();
  console.log('New Wallet Created:');
  console.log(`  Address: ${newAddress}`);
  console.log(`  Mnemonic: "${newMnemonic}"`);
  console.log('');
  console.log('  ⚠️  SAVE THIS MNEMONIC! You\'ll need it to transfer back.');

  // Transfer
  console.log('\n🚀 STEP 3: Transferring sats to new wallet...\n');
  console.log(`  Sending ${sourceBalance.balance} sats...`);

  try {
    const transferId = await sourceWallet.transfer({
      receiverSparkAddress: newAddress,
      amountSats: Number(sourceBalance.balance),
    });

    console.log(`  ✅ Transfer sent!`);
    console.log(`  Transfer ID: ${transferId}`);

  } catch (error) {
    console.error('  ❌ Transfer failed:', error.message);
    return;
  }

  // Wait and check new wallet
  console.log('\n⏳ STEP 4: Waiting for transfer to arrive...\n');
  console.log('  Waiting 15 seconds for processing...');

  await new Promise(resolve => setTimeout(resolve, 15000));

  // Reinitialize new wallet to get latest state
  const { wallet: newWalletRefresh } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: newMnemonic,
    options: { network: "MAINNET" },
  });

  const newLeaves = await newWalletRefresh.getLeaves();
  const newBalance = await newWalletRefresh.getBalance();

  console.log('\n📊 STEP 5: Checking new wallet state...\n');
  console.log('New Wallet After Transfer:');
  console.log(`  Leaves:  ${newLeaves.length}`);
  console.log(`  Balance: ${newBalance.balance} sats`);

  if (newLeaves.length > 0) {
    console.log('\n  Leaf breakdown:');
    const newGroups = {};
    for (const leaf of newLeaves) {
      const value = Number(leaf.value || 0n);
      newGroups[value] = (newGroups[value] || 0) + 1;
    }
    const newSortedValues = Object.keys(newGroups).map(Number).sort((a, b) => b - a);
    for (const value of newSortedValues) {
      console.log(`    ${value.toString().padStart(6)} sats × ${newGroups[value]}`);
    }
  }

  // Analysis
  console.log('\n═'.repeat(70));
  console.log('\n📊 ANALYSIS:\n');

  const optimal = Number(sourceBalance.balance).toString(2).split('1').length - 1;

  console.log(`Original wallet:  ${sourceLeaves.length} leaves`);
  console.log(`New wallet:       ${newLeaves.length} leaves`);
  console.log(`Optimal (binary): ${optimal} leaves`);
  console.log('');

  if (newLeaves.length === 0) {
    console.log('❌ Transfer hasn\'t arrived yet or failed.');
    console.log('   Wait longer and check the new wallet manually:');
    console.log(`   node claim-pending-transfers.js "${newMnemonic}" 30`);
  } else if (newLeaves.length < sourceLeaves.length) {
    console.log('🎉 CONSOLIDATION WORKED!');
    console.log(`   Reduced from ${sourceLeaves.length} → ${newLeaves.length} leaves`);
    console.log(`   That's ${sourceLeaves.length - newLeaves.length} fewer leaves (${Math.round((1 - newLeaves.length/sourceLeaves.length) * 100)}% reduction)`);
  } else if (newLeaves.length === sourceLeaves.length) {
    console.log('⚠️  No consolidation - same number of leaves.');
    console.log('   Spark may preserve leaf structure when transferring.');
  } else {
    console.log('❓ More leaves in new wallet!');
    console.log('   Spark may have re-denominated differently.');
  }

  if (newLeaves.length === optimal) {
    console.log('');
    console.log('✨ NEW WALLET IS OPTIMALLY CONSOLIDATED!');
  }

  console.log('\n═'.repeat(70));
  console.log('\n💡 NEXT STEPS:\n');
  console.log('To transfer back to original wallet:');
  console.log(`  node test-wallet-transfer.js "${newMnemonic}"`);
  console.log('');
  console.log(`Original wallet address: ${sourceAddress}`);
  console.log(`New wallet mnemonic: "${newMnemonic}"`);
  console.log('\n═'.repeat(70));
}

testWalletTransfer().catch(console.error);

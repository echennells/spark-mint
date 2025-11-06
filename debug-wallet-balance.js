#!/usr/bin/env node

import { IssuerSparkWallet } from '@buildonspark/issuer-sdk';

const mnemonic = process.argv[2];
if (!mnemonic) {
  console.error('Usage: node debug-wallet-balance.js "your mnemonic phrase"');
  process.exit(1);
}

async function debugWalletBalance() {
  console.log('🔍 Debugging Wallet Balance...\n');

  let wallet;
  try {
    const result = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });
    wallet = result.wallet;
  } catch (error) {
    console.log('⚠️  Warning during initialization:', error.message);
    console.log('Attempting to continue anyway...\n');
    // Try to continue - wallet might still be partially initialized
  }

  if (!wallet) {
    console.log('❌ Could not initialize wallet');
    return;
  }

  console.log('📱 Wallet Address:', wallet.getWalletAddress());

  try {
    const balance = await wallet.getBalance();
    console.log('💰 Wallet.getBalance():', balance, 'sats\n');
  } catch (error) {
    console.log('⚠️  Could not get balance:', error.message, '\n');
  }

  // Get leaves
  const leaves = await wallet.getLeaves();
  console.log(`📋 Total Leaves: ${leaves.length}\n`);

  // Inspect first few leaves in detail
  console.log('🔬 DETAILED LEAF INSPECTION:\n');

  for (let i = 0; i < Math.min(3, leaves.length); i++) {
    const leaf = leaves[i];
    console.log(`Leaf #${i + 1}:`);
    console.log('  ID:', leaf.id);
    console.log('  All fields:', Object.keys(leaf));
    console.log('  leafOutput:', leaf.leafOutput);
    console.log('  leafOutput?.amount:', leaf.leafOutput?.amount);
    console.log('  balance field?:', leaf.balance);
    console.log('  value field?:', leaf.value);
    console.log('  nodeTx:', leaf.nodeTx ? 'exists' : 'missing');
    console.log('  refundTx:', leaf.refundTx ? 'exists' : 'missing');
    console.log('');
  }

  // Calculate sum of all leaf amounts
  let totalInLeaves = 0;
  for (const leaf of leaves) {
    const amount = leaf.leafOutput?.amount || 0;
    totalInLeaves += Number(amount);
  }

  console.log('➕ Sum of all leaf.leafOutput.amount:', totalInLeaves, 'sats');
  console.log('💰 Wallet.getBalance():', await wallet.getBalance(), 'sats');
  console.log('❓ Difference:', (await wallet.getBalance()) - totalInLeaves, 'sats');
}

debugWalletBalance().catch(console.error);

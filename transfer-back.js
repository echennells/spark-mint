#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const sourceMnemonic = process.argv[2];
const targetAddress = process.argv[3];

if (!sourceMnemonic || !targetAddress) {
  console.log('Usage: node transfer-back.js "source mnemonic" "target address"');
  console.log('');
  console.log('Example:');
  console.log('  node transfer-back.js "mnemonic" "spark1p..."');
  process.exit(1);
}

async function transferBack() {
  console.log('🔄 Transferring Sats Back\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: sourceMnemonic,
    options: { network: "MAINNET" },
  });

  const balance = await wallet.getBalance();
  console.log(`Source Balance: ${balance.balance} sats`);
  console.log(`Target Address: ${targetAddress}\n`);

  if (balance.balance === 0n) {
    console.log('❌ No balance to transfer!');
    return;
  }

  console.log(`Transferring ${balance.balance} sats...`);

  const transferId = await wallet.transfer({
    receiverSparkAddress: targetAddress,
    amountSats: Number(balance.balance),
  });

  console.log(`✅ Transfer complete!`);
  console.log(`Transfer ID: ${transferId}`);
}

transferBack().catch(console.error);

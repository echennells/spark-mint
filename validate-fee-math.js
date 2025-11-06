#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs } from "@buildonspark/spark-sdk";
import { bytesToHex } from "@noble/curves/utils";

const mnemonic = process.argv[2];
const feeRate = parseFloat(process.argv[3]) || 1;

if (!mnemonic) {
  console.log('Usage: node validate-fee-math.js "your mnemonic" [fee-rate]');
  process.exit(1);
}

async function validateFeeMath() {
  console.log('\nFEE CALCULATION VALIDATION');
  console.log('Fee Rate:', feeRate, 'sat/vbyte\n');

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: { network: "MAINNET" },
  });

  const leaves = await wallet.getLeaves();
  const balance = await wallet.getBalance();

  console.log('Wallet: ', leaves.length, 'leaves,', balance.balance, 'sats total\n');

  const sparkClient = await wallet.connectionManager?.createSparkClient?.(
    wallet.config?.getCoordinatorAddress?.() || "https://api.spark.info"
  );

  // Analyze FIRST leaf in detail
  console.log('---------- LEAF #1 DETAIL ----------');
  const firstLeaf = leaves[0];
  const leafValue = Number(firstLeaf.value || 0n);
  console.log('Value:', leafValue, 'sats');

  const { TreeNode } = await import('@buildonspark/spark-sdk/proto/spark');
  const nodeHex = bytesToHex(TreeNode.encode(firstLeaf).finish());

  const txChains = await constructUnilateralExitTxs(
    [nodeHex],
    sparkClient,
    wallet.config?.getNetworkProto?.()
  );

  const chain = txChains[0];
  console.log('Transactions:', chain.transactions.length);
  console.log('\nTransaction sizes:');

  let totalBytes = 0;
  for (let i = 0; i < chain.transactions.length; i++) {
    const txBytes = chain.transactions[i].length / 2;
    totalBytes += txBytes;
    const txType = i === 0 ? 'Root' :
                   i === chain.transactions.length - 1 ? 'Refund' :
                   i === chain.transactions.length - 2 ? 'Leaf' :
                   'Intermediate';
    console.log(`  TX${i + 1} (${txType}): ${txBytes} bytes`);
  }

  console.log(`  Total: ${totalBytes} bytes`);

  const cost = Math.ceil(totalBytes * feeRate);
  console.log('\nCost calculation:');
  console.log(`  ${totalBytes} bytes × ${feeRate} sat/vbyte = ${cost} sats`);
  console.log(`  Leaf value: ${leafValue} sats`);
  console.log(`  Net: ${leafValue - cost} sats`, leafValue >= cost ? '(profit)' : '(LOSS)');

  // ALL leaves summary
  console.log('\n---------- ALL LEAVES ----------');
  console.log('Leaf | Value | Txs | Bytes  | Cost   | Net');

  let grandTotalBytes = 0;
  let grandTotalValue = 0;
  let grandTotalCost = 0;

  for (let i = 0; i < leaves.length; i++) {
    const leaf = leaves[i];
    const value = Number(leaf.value || 0n);
    const nodeHex = bytesToHex(TreeNode.encode(leaf).finish());

    const chains = await constructUnilateralExitTxs(
      [nodeHex],
      sparkClient,
      wallet.config?.getNetworkProto?.()
    );

    const chain = chains[0];
    const chainBytes = chain.transactions.reduce((sum, tx) => sum + tx.length / 2, 0);
    const cost = Math.ceil(chainBytes * feeRate);

    grandTotalBytes += chainBytes;
    grandTotalValue += value;
    grandTotalCost += cost;

    console.log(
      ` ${(i + 1).toString().padStart(2)}  | ` +
      `${value.toString().padStart(5)} | ` +
      `${chain.transactions.length.toString().padStart(3)} | ` +
      `${Math.round(chainBytes).toString().padStart(6)} | ` +
      `${cost.toString().padStart(6)} | ` +
      `${(value - cost).toString().padStart(7)}`
    );
  }

  console.log('\n---------- TOTALS ----------');
  console.log('Total value:      ', grandTotalValue, 'sats');
  console.log('Total bytes:      ', grandTotalBytes, 'bytes');
  console.log('Total cost:       ', grandTotalCost, 'sats');
  console.log('Net result:       ', grandTotalValue - grandTotalCost, 'sats',
              grandTotalValue >= grandTotalCost ? '(PROFIT)' : '(LOSS)');
  console.log('\nBreak-even rate:  ', (grandTotalValue / grandTotalBytes).toFixed(4), 'sat/vbyte\n');
}

validateFeeMath().catch(console.error);

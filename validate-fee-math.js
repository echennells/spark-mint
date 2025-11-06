#!/usr/bin/env node

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs } from "@buildonspark/spark-sdk";
import { bytesToHex } from "@noble/curves/utils";

const mnemonic = process.argv[2];
const feeRate = parseFloat(process.argv[3]) || 1; // Default 1 sat/vbyte for easy math

if (!mnemonic) {
  console.log('Usage: node validate-fee-math.js "your mnemonic" [fee-rate]');
  console.log('');
  console.log('Example: node validate-fee-math.js "mnemonic" 1');
  process.exit(1);
}

async function validateFeeMath() {
  console.log('🧮 VALIDATING FEE CALCULATION MATH\n');
  console.log('Fee Rate: ' + feeRate + ' sat/vbyte\n');
  console.log('-'.repeat(70));

  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: { network: "MAINNET" },
  });

  const leaves = await wallet.getLeaves();
  const balance = await wallet.getBalance();

  console.log('\n📊 WALLET STATE:');
  console.log('─'.repeat(70));
  console.log('Total leaves:', leaves.length);
  console.log('Total balance:', balance.balance, 'sats\n');

  // Get sparkClient for fetching parent nodes
  const sparkClient = await wallet.connectionManager?.createSparkClient?.(
    wallet.config?.getCoordinatorAddress?.() || "https://api.spark.info"
  );

  // Analyze FIRST leaf in detail
  console.log('-'.repeat(70));
  console.log('📍 DETAILED ANALYSIS OF LEAF #1:');
  console.log('-'.repeat(70));

  const firstLeaf = leaves[0];
  const leafValue = Number(firstLeaf.value || 0n);

  console.log('\nLeaf value:', leafValue, 'sats');

  const { TreeNode } = await import('@buildonspark/spark-sdk/proto/spark');
  const nodeHex = bytesToHex(TreeNode.encode(firstLeaf).finish());

  const txChains = await constructUnilateralExitTxs(
    [nodeHex],
    sparkClient,
    wallet.config?.getNetworkProto?.()
  );

  const chain = txChains[0];
  console.log('Number of transactions:', chain.transactions.length);
  console.log('\nTransaction breakdown:');

  let totalBytes = 0;
  for (let i = 0; i < chain.transactions.length; i++) {
    const txHex = chain.transactions[i];
    const txBytes = txHex.length / 2; // hex string to bytes
    totalBytes += txBytes;

    const txType = i === 0 ? 'Root' :
                   i === chain.transactions.length - 1 ? 'Refund' :
                   i === chain.transactions.length - 2 ? 'Leaf' :
                   'Intermediate';

    console.log(`  TX ${i + 1} (${txType.padEnd(12)}): ${txBytes.toString().padStart(5)} bytes`);
  }

  console.log('  ' + '─'.repeat(40));
  console.log('  Total:'.padEnd(20) + totalBytes.toString().padStart(5) + ' bytes');

  console.log('\n💰 COST CALCULATION FOR THIS LEAF:');
  console.log('─'.repeat(70));
  console.log('Total bytes:     ', totalBytes);
  console.log('Fee rate:        ', feeRate, 'sat/vbyte');
  console.log('Multiplication:  ', totalBytes, '×', feeRate, '=', totalBytes * feeRate);
  console.log('Cost (rounded):  ', Math.ceil(totalBytes * feeRate), 'sats');
  console.log('');
  console.log('Leaf value:      ', leafValue, 'sats');
  console.log('Cost to exit:    ', Math.ceil(totalBytes * feeRate), 'sats');
  console.log('─'.repeat(70));
  console.log('Net profit/loss: ', leafValue - Math.ceil(totalBytes * feeRate), 'sats',
              leafValue >= Math.ceil(totalBytes * feeRate) ? '✅' : '❌');

  // Now do ALL leaves
  console.log('\n\n-'.repeat(70));
  console.log('📊 ALL LEAVES SUMMARY:');
  console.log('-'.repeat(70));

  let grandTotalBytes = 0;
  let grandTotalValue = 0;
  let grandTotalCost = 0;

  console.log('\nLeaf | Value | Txs | Bytes  | Cost   | Profit/Loss');
  console.log('─'.repeat(70));

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
    const netProfit = value - cost;

    grandTotalBytes += chainBytes;
    grandTotalValue += value;
    grandTotalCost += cost;

    console.log(
      ` ${(i + 1).toString().padStart(2)}  | ` +
      `${value.toString().padStart(5)} | ` +
      `${chain.transactions.length.toString().padStart(3)} | ` +
      `${chainBytes.toString().padStart(6)} | ` +
      `${cost.toString().padStart(6)} | ` +
      `${netProfit.toString().padStart(11)} ${netProfit >= 0 ? '✅' : '❌'}`
    );
  }

  console.log('─'.repeat(70));
  console.log(
    'Total'.padEnd(5) + '| ' +
    grandTotalValue.toString().padStart(5) + ' | ' +
    '    | ' +
    grandTotalBytes.toString().padStart(6) + ' | ' +
    grandTotalCost.toString().padStart(6) + ' | ' +
    (grandTotalValue - grandTotalCost).toString().padStart(11) + ' ' +
    (grandTotalValue >= grandTotalCost ? '✅' : '❌')
  );

  console.log('\n\n-'.repeat(70));
  console.log('🔢 FINAL CALCULATION:');
  console.log('-'.repeat(70));
  console.log('');
  console.log('Total value in wallet:       ', grandTotalValue, 'sats');
  console.log('Total bytes to broadcast:    ', grandTotalBytes, 'bytes');
  console.log('Fee rate:                    ', feeRate, 'sat/vbyte');
  console.log('Total cost:                  ', grandTotalCost, 'sats');
  console.log('─'.repeat(70));
  console.log('Net result:                  ', grandTotalValue - grandTotalCost, 'sats',
              grandTotalValue >= grandTotalCost ? '✅ Profitable' : '❌ Loss');
  console.log('');
  console.log('Break-even fee rate:         ', (grandTotalValue / grandTotalBytes).toFixed(4), 'sat/vbyte');
  console.log('  (Fees must be below this to profit)');
  console.log('');
}

validateFeeMath().catch(console.error);

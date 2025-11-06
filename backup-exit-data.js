import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs } from "@buildonspark/spark-sdk";
import { bytesToHex } from "@noble/curves/utils";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const mnemonic = process.argv[2];
const outputDir = process.argv[3] || "./spark-exit-backup";

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node backup-exit-data.js "your mnemonic" [output-dir]');
  console.log('');
  console.log('   This script downloads and saves ALL parent node data needed');
  console.log('   for uncooperative exit, so you can recover even if Spark goes down.');
  console.log('');
  console.log('   Run this:');
  console.log('   - After depositing Bitcoin');
  console.log('   - After receiving funds');
  console.log('   - Periodically (monthly recommended)');
  process.exit(1);
}

async function backupExitData() {
  console.log('🔐 Spark Uncooperative Exit Data Backup');
  console.log('═'.repeat(70));
  console.log('');
  console.log('This script saves all transaction data needed for uncooperative exit.');
  console.log('If Spark servers permanently go offline, you can use this backup');
  console.log('to recover your funds without their cooperation.');
  console.log('');
  console.log('═'.repeat(70));
  console.log('');

  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet:', wallet.sparkAddress);

    const balance = await wallet.getBalance();
    console.log('💰 Balance:', Number(balance.balance), 'sats\n');

    // Create backup directory
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Get sparkClient for fetching parent nodes
    const sparkClient = await wallet.connectionManager?.createSparkClient?.(
      wallet.config?.getCoordinatorAddress?.() || "https://api.spark.info"
    ).catch(() => undefined);

    if (!sparkClient) {
      console.log('❌ Could not connect to Spark servers');
      console.log('   Cannot backup parent node data without Spark API access');
      console.log('   Try again when online');
      return;
    }

    console.log('🔍 Querying wallet leaves...');
    const leaves = await wallet.getLeaves();

    if (!leaves || leaves.length === 0) {
      console.log('\n⚠️  No leaves found. Nothing to backup.');
      console.log('   Deposit funds first, then run this script.\n');
      return;
    }

    console.log(`✅ Found ${leaves.length} leaf/leaves\n`);
    console.log('📦 Downloading complete transaction chains from Spark...\n');

    const { TreeNode } = await import('@buildonspark/spark-sdk/proto/spark');
    const backupData = {
      wallet: wallet.sparkAddress,
      backupDate: new Date().toISOString(),
      network: "MAINNET",
      leaves: [],
    };

    let totalTransactions = 0;

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      console.log(`Leaf ${i + 1}/${leaves.length}: ${leaf.id?.substring(0, 20)}...`);

      // Encode the TreeNode to hex
      const nodeHex = bytesToHex(TreeNode.encode(leaf).finish());

      // Fetch complete transaction chain
      const txChains = await constructUnilateralExitTxs(
        [nodeHex],
        sparkClient,
        wallet.config?.getNetworkProto?.()
      );

      if (txChains.length > 0) {
        const chain = txChains[0];
        const leafBalance = leaf.leafOutput?.amount ? Number(leaf.leafOutput.amount) : 0;

        console.log(`  ✓ Downloaded ${chain.transactions.length} transactions`);
        console.log(`  ✓ Balance: ${leafBalance} sats`);
        console.log(`  ✓ Timelock: ${leaf.sequence ? (leaf.sequence & 0xFFFF) + ' blocks' : 'Unknown'}`);

        backupData.leaves.push({
          leafId: leaf.id,
          balance: leafBalance,
          sequence: leaf.sequence,
          parentNodeId: leaf.parentNodeId,
          transactions: chain.transactions, // All txs from root to refund
          transactionCount: chain.transactions.length,
        });

        totalTransactions += chain.transactions.length;
      }

      console.log('');
    }

    // Save master backup file
    const backupPath = join(outputDir, 'exit-data-backup.json');
    writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

    // Also save individual leaf backups (in case one gets corrupted)
    for (const leafData of backupData.leaves) {
      const leafPath = join(outputDir, `leaf-${leafData.leafId.substring(0, 16)}.json`);
      writeFileSync(leafPath, JSON.stringify(leafData, null, 2));
    }

    console.log('═'.repeat(70));
    console.log('✅ BACKUP COMPLETE!');
    console.log('═'.repeat(70));
    console.log('');
    console.log(`📁 Backup saved to: ${outputDir}/`);
    console.log(`   - exit-data-backup.json (master file)`);
    console.log(`   - ${backupData.leaves.length} individual leaf backup(s)`);
    console.log('');
    console.log('📊 Backup Summary:');
    console.log(`   Total leaves: ${backupData.leaves.length}`);
    console.log(`   Total transactions: ${totalTransactions}`);
    console.log(`   Total recoverable: ${backupData.leaves.reduce((sum, l) => sum + l.balance, 0)} sats`);
    console.log('');
    console.log('🔒 IMPORTANT: Keep this backup safe!');
    console.log('   - Store in multiple locations (encrypted USB, cloud, etc.)');
    console.log('   - This backup lets you recover funds if Spark goes offline');
    console.log('   - Update this backup after receiving new funds');
    console.log('   - Without this backup AND Spark servers, you cannot exit!');
    console.log('');
    console.log('📅 Recommended: Run this backup monthly or after major transactions');
    console.log('');

    // Create a recovery script template
    const recoveryScriptPath = join(outputDir, 'RECOVERY-INSTRUCTIONS.txt');
    const recoveryInstructions = `
SPARK L1 RECOVERY INSTRUCTIONS
===============================

This backup contains all transaction data needed to recover your Bitcoin
from Spark to Layer 1 if Spark servers are permanently offline.

WHAT YOU HAVE:
- ${backupData.leaves.length} leaf node(s) with complete transaction chains
- ${totalTransactions} pre-signed transactions (root → leaf → refund)
- ${backupData.leaves.reduce((sum, l) => sum + l.balance, 0)} sats recoverable

HOW TO RECOVER (if Spark is permanently down):

STEP 1: Wait for timelock expiry
  - You must wait ~2000 blocks (~2 weeks) after broadcasting parent transactions
  - This is a safety mechanism to prevent conflicts

STEP 2: Broadcast transactions in order
  For each leaf in exit-data-backup.json:

  a) Broadcast all parent transactions (in order):
     transactions[0] = root transaction (spends from deposit)
     transactions[1..n-1] = intermediate transactions

  b) Wait for confirmations (at least 1 confirmation per tx)

  c) Wait for timelock period (2000 blocks)

  d) Broadcast refund transaction:
     transactions[last] = refund transaction (sends to your L1 address)

STEP 3: Tools you can use
  - Bitcoin Core: bitcoin-cli sendrawtransaction <hex>
  - Blockchain.com API: POST to /pushtx
  - Mempool.space: Use the broadcast tool
  - Any Bitcoin node that accepts raw transactions

SECURITY NOTES:
- These transactions are ALREADY SIGNED - no private keys needed
- The timelock prevents broadcasting refund too early
- Parent transactions must be broadcast and confirmed before refund
- Keep this backup secure - it's as valuable as your private keys!

Wallet: ${backupData.wallet}
Network: ${backupData.network}
Backup Date: ${backupData.backupDate}

For questions: See L1-RECOVERY-EXPLAINED.md in your spark-mint directory
`;

    writeFileSync(recoveryScriptPath, recoveryInstructions);

    console.log(`📖 Recovery instructions: ${recoveryScriptPath}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

backupExitData();

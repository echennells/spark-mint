import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs, constructUnilateralExitFeeBumpPackages } from "@buildonspark/spark-sdk";

const mnemonic = process.argv[2];
const mode = process.argv[3] || "info"; // "info", "prepare", or "broadcast"

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node uncooperative-l1-exit.js "your mnemonic" [mode]');
  console.log('');
  console.log('   Modes:');
  console.log('     info     - Show information about uncooperative exit capability (default)');
  console.log('     prepare  - Generate uncooperative exit transactions');
  console.log('     simulate - Simulate what happens if Spark goes down');
  process.exit(1);
}

async function demonstrateUncooperativeExit() {
  console.log('🔐 Spark Bitcoin L1 Uncooperative Exit Demo');
  console.log('━'.repeat(60));
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
    console.log('💰 Balance:', Number(balance.balance), 'sats');
    console.log('');

    // Query all leaves (funds) in the wallet
    console.log('🌿 Querying wallet leaves (UTXOs in Spark tree)...');
    const leaves = await wallet.queryLeaves();

    if (!leaves || leaves.length === 0) {
      console.log('');
      console.log('⚠️  No leaves found in wallet.');
      console.log('   This wallet has no funds in the Spark tree structure.');
      console.log('   You need to have deposited and claimed Bitcoin to have leaves.');
      console.log('');
      console.log('💡 How to get leaves:');
      console.log('   1. Run: node generate-wallet-and-invoice.js');
      console.log('   2. Send Bitcoin to the deposit address');
      console.log('   3. Run: node claim-l1-deposit.js "mnemonic"');
      console.log('   4. Then run this script again');
      return;
    }

    console.log(`✅ Found ${leaves.length} leaf/leaves in your wallet`);
    console.log('');

    // Display information about the uncooperative exit mechanism
    if (mode === "info") {
      console.log('📖 UNCOOPERATIVE EXIT MECHANISM EXPLANATION');
      console.log('━'.repeat(60));
      console.log('');
      console.log('Spark uses a Bitcoin tree structure with pre-signed refund transactions');
      console.log('that allow you to recover your funds even if Spark servers go down.');
      console.log('');
      console.log('🔑 Key Components:');
      console.log('');
      console.log('  1. TREE STRUCTURE:');
      console.log('     Deposit → Root Node → ... → Leaf Node');
      console.log('     Each node has a "node transaction" that moves funds down the tree');
      console.log('');
      console.log('  2. REFUND TRANSACTIONS:');
      console.log('     Each leaf has a pre-signed refund transaction with a TIMELOCK');
      console.log('     • Mainnet: 2000 blocks (~2 weeks) relative timelock');
      console.log('     • Testnet: 100 blocks (~16 hours) relative timelock');
      console.log('');
      console.log('  3. FROST SIGNATURES:');
      console.log('     Uses FROST (threshold signatures) between you and Spark operators');
      console.log('     Refund txs are pre-signed during deposit - no cooperation needed later!');
      console.log('');
      console.log('  4. RECOVERY PROCESS:');
      console.log('     If Spark disappears:');
      console.log('       a) Broadcast all node transactions from root to your leaf');
      console.log('       b) Wait for the timelock to expire (2000 blocks)');
      console.log('       c) Broadcast your refund transaction');
      console.log('       d) Funds return to your control on Bitcoin L1!');
      console.log('');
      console.log('━'.repeat(60));
      console.log('');
      console.log('📊 YOUR WALLET STATUS:');
      console.log('');

      let totalRefundable = 0n;
      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        console.log(`  Leaf #${i + 1}:`);
        console.log(`    ID: ${leaf.leafId}`);
        console.log(`    Amount: ${Number(leaf.balance)} sats`);
        console.log(`    Has refund tx: ${leaf.node?.refundTx ? '✅ Yes' : '❌ No'}`);
        console.log(`    Timelock status: ${leaf.node?.sequence ? `Block ${leaf.node.sequence & 0xFFFF} (relative)` : 'Unknown'}`);
        console.log('');
        totalRefundable += BigInt(leaf.balance || 0);
      }

      console.log(`  💰 Total recoverable via uncooperative exit: ${Number(totalRefundable)} sats`);
      console.log('');
      console.log('━'.repeat(60));
      console.log('');
      console.log('🎓 EDUCATIONAL DEMO MODES:');
      console.log('');
      console.log('  Run with mode="prepare" to see the actual refund transactions:');
      console.log(`    node uncooperative-l1-exit.js "mnemonic" prepare`);
      console.log('');
      console.log('  This will show you the Bitcoin transactions that would be broadcast');
      console.log('  to recover your funds if Spark went offline permanently.');
      console.log('');
    }

    if (mode === "prepare" || mode === "simulate") {
      console.log('🔧 PREPARING UNCOOPERATIVE EXIT TRANSACTIONS');
      console.log('━'.repeat(60));
      console.log('');

      // Convert leaves to TreeNode hex strings
      const nodeHexStrings = [];
      for (const leaf of leaves) {
        if (leaf.node?.treeNodeHex) {
          nodeHexStrings.push(leaf.node.treeNodeHex);
        }
      }

      if (nodeHexStrings.length === 0) {
        console.log('❌ No TreeNode data available for uncooperative exit');
        console.log('   This should not happen. Please contact Spark support.');
        return;
      }

      console.log(`📦 Building exit transaction chains for ${nodeHexStrings.length} leaf/leaves...`);
      console.log('');

      // Construct the unilateral exit transactions
      const txChains = await constructUnilateralExitTxs(
        nodeHexStrings,
        undefined, // No SparkClient needed if we have all parent data
        undefined  // Network will be inferred
      );

      console.log('✅ Successfully constructed exit transaction chains!');
      console.log('');
      console.log('━'.repeat(60));
      console.log('');

      for (let i = 0; i < txChains.length; i++) {
        const chain = txChains[i];
        console.log(`🔗 CHAIN #${i + 1} (Leaf ID: ${chain.leafId.substring(0, 16)}...)`);
        console.log('');
        console.log(`   This chain contains ${chain.transactions.length} transactions:`);
        console.log('');

        for (let j = 0; j < chain.transactions.length; j++) {
          const tx = chain.transactions[j];
          const isRefundTx = j === chain.transactions.length - 1;

          console.log(`   ${j + 1}. ${isRefundTx ? '🎯 REFUND TX' : '📤 NODE TX'} (${tx.length} bytes)`);

          if (isRefundTx) {
            console.log(`      ⏰ This transaction has a TIMELOCK!`);
            console.log(`      📅 Must wait ~2000 blocks after previous tx confirms`);
            console.log(`      💰 Sends funds back to your Bitcoin address`);
          } else {
            console.log(`      🔄 Moves funds down the tree structure`);
            console.log(`      ⚡ Can broadcast immediately`);
          }

          if (mode === "simulate") {
            console.log(`      📜 Raw TX (first 100 chars): ${tx.substring(0, 100)}...`);
          }
          console.log('');
        }

        console.log('   📋 BROADCAST SEQUENCE:');
        console.log('   ----------------------');
        console.log('   Step 1: Broadcast all node transactions in order');
        console.log('   Step 2: Wait for confirmations');
        console.log('   Step 3: Wait for timelock to expire (~2000 blocks = 2 weeks)');
        console.log('   Step 4: Broadcast refund transaction');
        console.log('   Step 5: Your funds are back on Bitcoin L1! 🎉');
        console.log('');
        console.log('━'.repeat(60));
        console.log('');
      }

      if (mode === "simulate") {
        console.log('🎭 SIMULATION MODE - What happens if Spark goes down?');
        console.log('');
        console.log('Scenario: Spark servers are permanently offline');
        console.log('');
        console.log('✅ You CAN recover your funds because:');
        console.log('  1. All node transactions are already signed (FROST signatures)');
        console.log('  2. Refund transaction is pre-signed with timelock');
        console.log('  3. No cooperation from Spark needed!');
        console.log('');
        console.log('🔒 Security Model:');
        console.log('  • Cooperative path: Fast exit via Spark servers');
        console.log('  • Uncooperative path: Slow exit (2 weeks) via timelock');
        console.log('  • Your funds are ALWAYS recoverable on Bitcoin L1');
        console.log('');
        console.log('⚠️  Note: In this demo, we do NOT actually broadcast transactions.');
        console.log('   To actually recover funds, you would use a Bitcoin transaction');
        console.log('   broadcasting tool with these pre-signed transactions.');
        console.log('');
      }

      console.log('💡 KEY INSIGHT FOR YOUR CLASS:');
      console.log('');
      console.log('This is an example of a "challenge-response" mechanism without');
      console.log('optimistic rollup complexity. Instead of fraud proofs, Spark uses:');
      console.log('  • Pre-signed transactions (created during deposit)');
      console.log('  • Relative timelocks (OP_CSV / BIP 68)');
      console.log('  • FROST threshold signatures');
      console.log('');
      console.log('This ensures users can ALWAYS exit to L1, even if Spark disappears.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

demonstrateUncooperativeExit();

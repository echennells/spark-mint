import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs, getTxFromRawTxHex, getTxId } from "@buildonspark/spark-sdk";

const mnemonic = process.argv[2];
const mode = process.argv[3] || "info"; // "info", "visual", "decode", "dryrun"

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node uncooperative-l1-exit-visual.js "your mnemonic" [mode]');
  console.log('');
  console.log('   Modes:');
  console.log('     info    - Overview of uncooperative exit capability');
  console.log('     visual  - ASCII tree visualization of your funds');
  console.log('     decode  - Deep dive into transaction structure');
  console.log('     dryrun  - Simulate broadcasting (shows what would happen)');
  process.exit(1);
}

// Helper to format bytes as hex
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper to decode sequence field into human-readable timelock info
function decodeSequence(sequence) {
  if (!sequence) return { hasTimelock: false };

  const isDisabled = (sequence & 0x80000000) !== 0;
  if (isDisabled) {
    return { hasTimelock: false, reason: 'Timelock disabled (bit 31 set)' };
  }

  const isRelative = (sequence & 0x40000000) !== 0;
  const timelockValue = sequence & 0x0000FFFF;

  return {
    hasTimelock: true,
    isRelative,
    timelockValue,
    isBlockBased: !((sequence & 0x00400000) !== 0),
    rawSequence: sequence,
    hexSequence: '0x' + sequence.toString(16).padStart(8, '0'),
  };
}

// Parse transaction and show detailed structure
function analyzeTransaction(txHex, txType = 'Unknown') {
  try {
    const tx = getTxFromRawTxHex(txHex);
    const txid = getTxId(tx);

    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📋 ${txType.toUpperCase()} TRANSACTION DETAILS`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`TXID: ${txid}`);
    console.log(`Version: ${tx.version}`);
    console.log(`Size: ${txHex.length / 2} bytes`);
    console.log(`Inputs: ${tx.inputsLength} | Outputs: ${tx.outputsLength}`);

    // Analyze inputs
    console.log(`\n${'─'.repeat(70)}`);
    console.log('📥 INPUTS:');
    console.log(`${'─'.repeat(70)}`);

    for (let i = 0; i < tx.inputsLength; i++) {
      const input = tx.getInput(i);
      console.log(`\n  Input #${i}:`);
      console.log(`    Previous TXID: ${input.txid || 'N/A'}`);
      console.log(`    Output Index: ${input.index !== undefined ? input.index : 'N/A'}`);

      if (input.sequence !== undefined) {
        const seqInfo = decodeSequence(input.sequence);
        console.log(`    Sequence: ${seqInfo.hexSequence} (${input.sequence})`);

        if (seqInfo.hasTimelock) {
          console.log(`    ⏰ TIMELOCK ACTIVE:`);
          console.log(`       Type: ${seqInfo.isRelative ? 'RELATIVE' : 'ABSOLUTE'}`);
          console.log(`       Value: ${seqInfo.timelockValue} ${seqInfo.isBlockBased ? 'blocks' : '512-second intervals'}`);
          console.log(`       Human: ~${Math.round(seqInfo.timelockValue * 10 / 60 / 24)} days (at 10 min/block)`);
          console.log(`       🔒 This tx can only be mined ${seqInfo.timelockValue} blocks after parent confirms`);
        } else {
          console.log(`    ⚡ No timelock - can confirm immediately`);
        }
      }

      if (input.witnessUtxo) {
        console.log(`    Witness UTXO Value: ${input.witnessUtxo.amount} sats`);
        if (input.witnessUtxo.script) {
          const scriptHex = bytesToHex(input.witnessUtxo.script);
          console.log(`    Script Type: ${identifyScriptType(input.witnessUtxo.script)}`);
          console.log(`    Script (hex): ${scriptHex.substring(0, 60)}${scriptHex.length > 60 ? '...' : ''}`);
        }
      }
    }

    // Analyze outputs
    console.log(`\n${'─'.repeat(70)}`);
    console.log('📤 OUTPUTS:');
    console.log(`${'─'.repeat(70)}`);

    for (let i = 0; i < tx.outputsLength; i++) {
      const output = tx.getOutput(i);
      console.log(`\n  Output #${i}:`);
      console.log(`    Value: ${output.amount} sats`);

      if (output.script) {
        const scriptHex = bytesToHex(output.script);
        const scriptType = identifyScriptType(output.script);
        console.log(`    Script Type: ${scriptType}`);
        console.log(`    Script (hex): ${scriptHex.substring(0, 60)}${scriptHex.length > 60 ? '...' : ''}`);

        if (scriptType.includes('P2TR')) {
          console.log(`    🔑 TAPROOT OUTPUT:`);
          console.log(`       - Can be spent with key-path (schnorr signature)`);
          console.log(`       - OR script-path (reveal script + satisfy conditions)`);
          console.log(`       - Tweaked public key: ${scriptHex.substring(4)}`);
        }

        if (output.amount === 0n) {
          console.log(`    ⚓ EPHEMERAL ANCHOR OUTPUT (0-value, anyone-can-spend)`);
          console.log(`       Purpose: Allows CPFP fee bumping`);
        }
      }
    }

    console.log(`\n${'═'.repeat(70)}\n`);

    return { txid, tx };
  } catch (error) {
    console.error(`❌ Error analyzing transaction: ${error.message}`);
    return null;
  }
}

// Identify Bitcoin script type
function identifyScriptType(script) {
  if (!script || script.length === 0) return 'Unknown';

  // P2TR (Taproot): OP_1 (0x51) followed by 32 bytes
  if (script.length === 34 && script[0] === 0x51 && script[1] === 0x20) {
    return 'P2TR (Pay-to-Taproot)';
  }

  // P2WPKH: OP_0 (0x00) followed by 20 bytes
  if (script.length === 22 && script[0] === 0x00 && script[1] === 0x14) {
    return 'P2WPKH (Pay-to-Witness-PubKey-Hash)';
  }

  // P2WSH: OP_0 (0x00) followed by 32 bytes
  if (script.length === 34 && script[0] === 0x00 && script[1] === 0x20) {
    return 'P2WSH (Pay-to-Witness-Script-Hash)';
  }

  // Ephemeral anchor patterns
  if (script.length === 1 && script[0] === 0x51) {
    return 'Ephemeral Anchor (bare OP_TRUE)';
  }

  if (script.length === 4 && script[0] === 0x51 && script[1] === 0x02 && script[2] === 0x4e && script[3] === 0x73) {
    return 'Ephemeral Anchor (OP_1 + push)';
  }

  return `Unknown (${script.length} bytes, starts with 0x${script[0]?.toString(16).padStart(2, '0')})`;
}

// Draw ASCII tree of the transaction chain
function drawTransactionTree(chain, leafBalance) {
  const numTxs = chain.transactions.length;
  const nodeCount = numTxs - 1; // Last one is refund tx

  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│         TRANSACTION CHAIN STRUCTURE                        │');
  console.log('└────────────────────────────────────────────────────────────┘');
  console.log('');

  console.log('     Bitcoin L1 Deposit UTXO');
  console.log('              │');
  console.log('              ▼');

  for (let i = 0; i < nodeCount; i++) {
    const depth = i;
    const isRoot = i === 0;
    const isLeaf = i === nodeCount - 1;

    let label = '';
    if (isRoot) label = 'Root Node Tx';
    else if (isLeaf) label = `Leaf Node Tx (${leafBalance} sats)`;
    else label = `Intermediate Node Tx`;

    console.log(`     ┌──────────────────────┐`);
    console.log(`     │  ${label.padEnd(19)} │`);
    console.log(`     │  ⚡ No timelock      │`);
    console.log(`     │  ✅ Pre-signed       │`);
    console.log(`     └──────────────────────┘`);
    console.log('              │');
    console.log('              ▼');
  }

  console.log(`     ┌──────────────────────┐`);
  console.log(`     │  Refund Tx           │`);
  console.log(`     │  ⏰ 2000 block lock  │`);
  console.log(`     │  🔐 Pre-signed       │`);
  console.log(`     │  💰 Returns to L1    │`);
  console.log(`     └──────────────────────┘`);
  console.log('              │');
  console.log('              ▼');
  console.log('     Your Bitcoin Address (L1)');
  console.log('');
}

// Simulate dry-run broadcasting
function simulateBroadcast(txChains) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                   🎭 DRY RUN MODE                          ║');
  console.log('║   Simulating broadcast WITHOUT actually sending to network ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  for (let chainIdx = 0; chainIdx < txChains.length; chainIdx++) {
    const chain = txChains[chainIdx];
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`CHAIN #${chainIdx + 1} - Leaf: ${chain.leafId.substring(0, 20)}...`);
    console.log(`${'═'.repeat(70)}\n`);

    let currentBlockHeight = 850000; // Simulated current block

    for (let i = 0; i < chain.transactions.length; i++) {
      const txHex = chain.transactions[i];
      const isRefundTx = i === chain.transactions.length - 1;
      const txType = isRefundTx ? '🎯 Refund' : '📤 Node';

      try {
        const tx = getTxFromRawTxHex(txHex);
        const txid = getTxId(tx);

        console.log(`Step ${i + 1}: ${txType} Transaction`);
        console.log(`${'─'.repeat(70)}`);
        console.log(`TXID: ${txid}`);
        console.log(`Size: ${txHex.length / 2} bytes`);

        if (isRefundTx) {
          // Check timelock on refund tx
          const input = tx.getInput(0);
          const seqInfo = decodeSequence(input?.sequence);

          console.log(`\n🔒 TIMELOCK CHECK:`);
          if (seqInfo.hasTimelock) {
            const parentConfirmBlock = currentBlockHeight;
            const canBroadcastAt = parentConfirmBlock + seqInfo.timelockValue;
            const blocksToWait = canBroadcastAt - currentBlockHeight;

            console.log(`   Parent confirmed at block: ${parentConfirmBlock}`);
            console.log(`   Timelock period: ${seqInfo.timelockValue} blocks`);
            console.log(`   Can broadcast at block: ${canBroadcastAt}`);
            console.log(`   Current simulated block: ${currentBlockHeight}`);
            console.log(`   ⏰ Need to wait: ${blocksToWait} blocks (~${Math.round(blocksToWait / 6)} hours)`);

            // Simulate waiting
            console.log(`\n   ⏳ [Simulating wait for timelock...]`);
            currentBlockHeight = canBroadcastAt;
            console.log(`   ✅ Timelock expired! Now at block ${currentBlockHeight}`);
          }
        }

        console.log(`\n📡 BROADCAST SIMULATION:`);
        console.log(`   → sendrawtransaction ${txHex.substring(0, 40)}...`);
        console.log(`   ✅ Success (simulated) - TXID: ${txid}`);
        console.log(`   ⛏️  Transaction mined in block ${currentBlockHeight + 1} (simulated)`);

        currentBlockHeight += 1;
        console.log(`\n`);

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }

    console.log(`✅ Chain ${chainIdx + 1} complete! Funds recovered to L1.\n`);
  }

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║              DRY RUN COMPLETE - NO ACTUAL BROADCAST        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

async function demonstrateUncooperativeExit() {
  console.log('🔐 Spark Bitcoin L1 Uncooperative Exit - VISUAL DEMO');
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

    console.log('🔍 Querying wallet leaves...');
    const leaves = await wallet.queryLeaves();

    if (!leaves || leaves.length === 0) {
      console.log('\n⚠️  No leaves found. You need funds in Spark to demonstrate exit.');
      console.log('   Run: node claim-l1-deposit.js "mnemonic" first\n');
      return;
    }

    console.log(`✅ Found ${leaves.length} leaf/leaves\n`);

    // VISUAL MODE: Show tree structure
    if (mode === "visual") {
      console.log('🌳 VISUAL TREE STRUCTURE\n');

      for (let i = 0; i < leaves.length; i++) {
        const leaf = leaves[i];
        console.log(`\n${'═'.repeat(70)}`);
        console.log(`LEAF #${i + 1} - Balance: ${leaf.balance} sats`);
        console.log(`${'═'.repeat(70)}`);

        if (leaf.node?.treeNodeHex) {
          const txChains = await constructUnilateralExitTxs(
            [leaf.node.treeNodeHex],
            undefined,
            undefined
          );

          if (txChains.length > 0) {
            drawTransactionTree(txChains[0], leaf.balance);

            console.log('📊 TRANSACTION SUMMARY:');
            console.log(`   Total transactions in chain: ${txChains[0].transactions.length}`);
            console.log(`   Node transactions (no timelock): ${txChains[0].transactions.length - 1}`);
            console.log(`   Refund transaction (timelocked): 1`);
            console.log(`   Estimated total size: ${txChains[0].transactions.reduce((sum, tx) => sum + tx.length / 2, 0)} bytes`);
          }
        }
      }
    }

    // DECODE MODE: Deep transaction analysis
    if (mode === "decode") {
      console.log('🔬 DEEP TRANSACTION DECODE\n');

      for (let i = 0; i < Math.min(1, leaves.length); i++) { // Just show first leaf for clarity
        const leaf = leaves[i];

        if (leaf.node?.treeNodeHex) {
          const txChains = await constructUnilateralExitTxs(
            [leaf.node.treeNodeHex],
            undefined,
            undefined
          );

          if (txChains.length > 0) {
            const chain = txChains[0];

            console.log(`Analyzing ${chain.transactions.length} transactions in chain...\n`);

            for (let j = 0; j < chain.transactions.length; j++) {
              const isRefundTx = j === chain.transactions.length - 1;
              const txType = isRefundTx ? '🎯 Refund' : `📤 Node ${j + 1}`;
              analyzeTransaction(chain.transactions[j], txType);

              if (j < chain.transactions.length - 1) {
                console.log('\n        ↓↓↓ Spends from above ↓↓↓\n');
              }
            }
          }
        }
      }
    }

    // DRY RUN MODE: Simulate broadcasting
    if (mode === "dryrun") {
      const nodeHexStrings = leaves
        .filter(leaf => leaf.node?.treeNodeHex)
        .map(leaf => leaf.node.treeNodeHex);

      if (nodeHexStrings.length === 0) {
        console.log('❌ No TreeNode data available');
        return;
      }

      const txChains = await constructUnilateralExitTxs(
        nodeHexStrings,
        undefined,
        undefined
      );

      simulateBroadcast(txChains);
    }

    // INFO MODE: Overview
    if (mode === "info") {
      console.log('📖 UNCOOPERATIVE EXIT OVERVIEW\n');
      console.log('Available modes for deeper exploration:\n');
      console.log('  visual  - See ASCII tree structure of your funds');
      console.log('  decode  - Deep dive into transaction structure & scripts');
      console.log('  dryrun  - Simulate broadcasting (shows timing & timelocks)\n');
      console.log('Run: node uncooperative-l1-exit-visual.js "mnemonic" [mode]\n');

      let totalRefundable = 0n;
      for (const leaf of leaves) {
        totalRefundable += BigInt(leaf.balance || 0);
      }

      console.log(`💰 Total recoverable: ${Number(totalRefundable)} sats`);
      console.log(`🌿 Number of leaves: ${leaves.length}`);
      console.log(`⏰ Timelock period: ~2000 blocks (~2 weeks)\n`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

demonstrateUncooperativeExit();

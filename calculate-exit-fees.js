import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";
import { constructUnilateralExitTxs } from "@buildonspark/spark-sdk";
import { bytesToHex } from "@noble/curves/utils";

const mnemonic = process.argv[2];
const feeRate = parseInt(process.argv[3]) || 30; // sat/vbyte, default 30

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node calculate-exit-fees.js "your mnemonic" [fee-rate-sat-per-vbyte]');
  console.log('');
  console.log('   Examples:');
  console.log('     node calculate-exit-fees.js "mnemonic" 10   # Low fee');
  console.log('     node calculate-exit-fees.js "mnemonic" 30   # Medium fee (default)');
  console.log('     node calculate-exit-fees.js "mnemonic" 100  # High fee');
  process.exit(1);
}

async function calculateExitFees() {
  console.log('💰 Spark Uncooperative Exit Fee Calculator');
  console.log('═'.repeat(70));
  console.log(`Fee Rate: ${feeRate} sat/vbyte\n`);

  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet:', wallet.sparkAddress);

    const balance = await wallet.getBalance();
    console.log('💰 Current Balance:', Number(balance.balance), 'sats\n');

    const sparkClient = await wallet.connectionManager?.createSparkClient?.(
      wallet.config?.getCoordinatorAddress?.() || "https://api.spark.info"
    ).catch(() => undefined);

    const leaves = await wallet.getLeaves();

    if (!leaves || leaves.length === 0) {
      console.log('⚠️  No leaves found.\n');
      return;
    }

    console.log(`✅ Found ${leaves.length} leaf/leaves\n`);
    console.log('🔍 Analyzing exit costs...\n');
    console.log('═'.repeat(70));

    const { TreeNode } = await import('@buildonspark/spark-sdk/proto/spark');

    let totalBytes = 0;
    let totalCost = 0;
    let totalValue = 0;
    let profitableLeaves = 0;
    let unprofitableLeaves = 0;

    const leafData = [];

    for (let i = 0; i < leaves.length; i++) {
      const leaf = leaves[i];
      const leafBalance = leaf.leafOutput?.amount ? Number(leaf.leafOutput.amount) : 0;

      const nodeHex = bytesToHex(TreeNode.encode(leaf).finish());

      const txChains = await constructUnilateralExitTxs(
        [nodeHex],
        sparkClient,
        wallet.config?.getNetworkProto?.()
      );

      if (txChains.length > 0) {
        const chain = txChains[0];
        const chainBytes = chain.transactions.reduce((sum, tx) => sum + tx.length / 2, 0);
        const chainCost = Math.ceil(chainBytes * feeRate);
        const netProfit = leafBalance - chainCost;

        totalBytes += chainBytes;
        totalCost += chainCost;
        totalValue += leafBalance;

        if (netProfit > 0) {
          profitableLeaves++;
        } else {
          unprofitableLeaves++;
        }

        leafData.push({
          index: i + 1,
          id: leaf.id?.substring(0, 20),
          balance: leafBalance,
          txCount: chain.transactions.length,
          bytes: Math.round(chainBytes),
          cost: chainCost,
          netProfit: netProfit,
          profitable: netProfit > 0,
        });
      }
    }

    // Sort by profitability (most profitable first)
    leafData.sort((a, b) => b.netProfit - a.netProfit);

    console.log('\n📊 LEAF-BY-LEAF BREAKDOWN:\n');
    console.log('Leaf | Balance | Txs | Size  | Fee Cost | Net Profit | Worth It?');
    console.log('─'.repeat(70));

    for (const leaf of leafData) {
      const worthIt = leaf.profitable ? '✅ Yes' : '❌ No';
      const profitStr = leaf.netProfit > 0
        ? `+${leaf.netProfit.toLocaleString()}`
        : `${leaf.netProfit.toLocaleString()}`;

      console.log(
        `#${leaf.index.toString().padStart(2)} | ` +
        `${leaf.balance.toLocaleString().padStart(7)} | ` +
        `${leaf.txCount.toString().padStart(2)}  | ` +
        `${leaf.bytes.toLocaleString().padStart(5)} | ` +
        `${leaf.cost.toLocaleString().padStart(8)} | ` +
        `${profitStr.padStart(10)} | ` +
        `${worthIt}`
      );
    }

    console.log('═'.repeat(70));
    console.log('\n💵 TOTAL COST ANALYSIS:\n');

    console.log(`Total Value in Leaves:     ${totalValue.toLocaleString().padStart(10)} sats`);
    console.log(`Total Exit Fee Cost:       ${totalCost.toLocaleString().padStart(10)} sats`);
    console.log(`────────────────────────────────────────────`);

    const netResult = totalValue - totalCost;
    if (netResult >= 0) {
      console.log(`NET PROFIT:                ${('+'+ netResult.toLocaleString()).padStart(10)} sats ✅`);
    } else {
      console.log(`NET LOSS:                  ${netResult.toLocaleString().padStart(10)} sats ❌`);
    }

    console.log('');
    console.log(`Total Transaction Size:    ${totalBytes.toLocaleString().padStart(10)} bytes`);
    console.log(`Total Transactions:        ${leafData.reduce((sum, l) => sum + l.txCount, 0).toString().padStart(10)}`);
    console.log('');
    console.log(`Profitable Leaves:         ${profitableLeaves.toString().padStart(10)} ✅`);
    console.log(`Unprofitable Leaves:       ${unprofitableLeaves.toString().padStart(10)} ❌`);

    console.log('\n═'.repeat(70));
    console.log('📈 FEE RATE COMPARISON:\n');

    const feeRates = [10, 30, 50, 100, 200];
    console.log('Fee Rate | Total Cost | Net Result | Affordable?');
    console.log('─'.repeat(70));

    for (const rate of feeRates) {
      const cost = Math.ceil(totalBytes * rate);
      const net = totalValue - cost;
      const affordable = cost <= Number(balance.balance);
      const affordableStr = affordable ? '✅ Yes' : '❌ No';
      const netStr = net >= 0 ? `+${net.toLocaleString()}` : `${net.toLocaleString()}`;

      console.log(
        `${rate.toString().padStart(8)} | ` +
        `${cost.toLocaleString().padStart(10)} | ` +
        `${netStr.padStart(10)} | ` +
        `${affordableStr}`
      );
    }

    console.log('\n═'.repeat(70));
    console.log('💡 RECOMMENDATIONS:\n');

    if (totalCost > Number(balance.balance)) {
      console.log('⚠️  You CANNOT afford uncooperative exit at this fee rate!');
      console.log(`   You have: ${Number(balance.balance).toLocaleString()} sats`);
      console.log(`   You need: ${totalCost.toLocaleString()} sats`);
      console.log(`   Shortfall: ${(totalCost - Number(balance.balance)).toLocaleString()} sats\n`);
    }

    if (netResult < 0) {
      console.log('❌ Uncooperative exit is UNPROFITABLE at this fee rate!');
      console.log(`   You would LOSE ${Math.abs(netResult).toLocaleString()} sats\n`);
    }

    if (unprofitableLeaves > 0) {
      console.log(`⚠️  ${unprofitableLeaves} leaves are too small to recover profitably`);
      console.log('   Consider abandoning these leaves (dust)\n');
    }

    console.log('✅ BETTER OPTIONS:\n');
    console.log('   1. Use COOPERATIVE exit (Spark pays fees!)');
    console.log('      Cost: ~6,000 sats total, Spark covers it');
    console.log('      Time: Instant');
    console.log('      Net: Keep all your funds\n');

    console.log('   2. Wait for lower fee rates');
    console.log(`      At 10 sat/vbyte: ${Math.ceil(totalBytes * 10).toLocaleString()} sats cost`);
    console.log(`      Net result: ${(totalValue - Math.ceil(totalBytes * 10)).toLocaleString()} sats\n`);

    console.log('   3. Consolidate leaves (transfer to yourself)');
    console.log('      Merge small leaves into larger ones');
    console.log('      Reduces total transaction count for future exits\n');

    console.log('═'.repeat(70));
    console.log('\n🎓 KEY INSIGHT:\n');
    console.log('Uncooperative exit is EXPENSIVE by design. This creates economic');
    console.log('incentives to use the cooperative path, which is cheaper and faster.');
    console.log('The uncooperative path is a safety mechanism, not the primary exit.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

calculateExitFees();

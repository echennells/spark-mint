import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const targetAddress = process.argv[2];

if (!targetAddress) {
  console.log('Usage: node consolidate-sats.js "target_spark_address"');
  console.log('Example: node consolidate-sats.js "sp1p..."');
  process.exit(1);
}

// Add your test wallet mnemonics here
const wallets = [
  // "mnemonic 1",
  // "mnemonic 2",
  // etc...
];

async function consolidateSats() {
  console.log('🔄 Consolidating sats from test wallets...\n');
  console.log('Target address:', targetAddress);

  for (const [i, mnemonic] of wallets.entries()) {
    console.log(`\n${i + 1}. Processing wallet: ${mnemonic.split(' ').slice(0, 3).join(' ')}...`);

    try {
      const { wallet } = await IssuerSparkWallet.initialize({
        mnemonicOrSeed: mnemonic,
        options: { network: 'MAINNET' }
      });

      const balance = await wallet.getBalance();
      console.log(`   Current balance: ${balance.balance} sats`);

      if (balance.balance > 0n) {
        console.log(`   🚀 Transferring ${balance.balance} sats...`);

        try {
          const transfer = await wallet.transfer({
            receiverSparkAddress: targetAddress,
            amountSats: Number(balance.balance)
          });

          console.log(`   ✅ Transfer successful: ${transfer}`);

        } catch (transferError) {
          console.log(`   ❌ Transfer failed: ${transferError.message}`);
        }
      } else {
        console.log(`   ⚠️  No sats to transfer`);
      }

    } catch (error) {
      console.log(`   ❌ Wallet error: ${error.message}`);
    }
  }

  console.log('\n🎉 Consolidation complete!');
}

consolidateSats();
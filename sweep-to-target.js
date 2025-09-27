import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const sourceMnemonic = process.argv[2];
const targetAddress = process.argv[3];

if (!sourceMnemonic || !targetAddress) {
  console.log('❌ Please provide both source mnemonic and target address');
  console.log('   Usage: node sweep-to-target.js "source mnemonic" "target_spark_address"');
  process.exit(1);
}

async function sweepFunds() {
  console.log('🧹 Sweeping funds to target address...\n');
  console.log('Target:', targetAddress);

  try {
    // Initialize source wallet
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: sourceMnemonic,
      options: { network: 'MAINNET' }
    });

    console.log('Source wallet:', wallet.sparkAddress);

    // Check balance
    const balance = await wallet.getBalance();
    const currentBalance = Number(balance.balance);

    console.log('Current balance:', currentBalance, 'sats');

    if (currentBalance <= 0) {
      console.log('❌ No funds to sweep!');
      return;
    }

    console.log(`\n🚀 Transferring ${currentBalance} sats...`);

    const result = await wallet.transfer({
      receiverSparkAddress: targetAddress,
      amountSats: currentBalance
    });

    console.log('✅ Transfer successful!');
    console.log('Transaction:', result.id);

    // Check remaining balance
    const newBalance = await wallet.getBalance();
    console.log('Remaining balance:', Number(newBalance.balance), 'sats');

  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
  }
}

sweepFunds();
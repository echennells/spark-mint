import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const sourceMnemonic = "drift stay repair family enlist cliff october nasty hard churn believe slot";
const targetAddress = "sp1pgssx67qzgsqg0zv5vp98q82p22sx66w80udphrrxrh5cpawy9c0k2mftlnmk7";
const transferAmount = 3000; // sats

async function transferSats() {
  console.log('💸 Transferring 3000 sats...\n');
  console.log('From wallet:', sourceMnemonic.split(' ').slice(0, 3).join(' ') + '...');
  console.log('To address:', targetAddress);

  try {
    // Initialize source wallet
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: sourceMnemonic,
      options: { network: 'MAINNET' }
    });

    console.log('\n📊 Checking source wallet balance...');
    const balance = await wallet.getBalance();
    const currentBalance = Number(balance.balance);

    console.log('Current balance:', currentBalance, 'sats');

    if (currentBalance < transferAmount) {
      console.log(`❌ Insufficient balance! Need ${transferAmount} sats, have ${currentBalance} sats`);
      console.log('\n💡 Please fund the wallet first:');
      console.log('Spark Address:', wallet.sparkAddress);
      return;
    }

    console.log(`\n🚀 Transferring ${transferAmount} sats...`);

    const result = await wallet.transfer({
      receiverSparkAddress: targetAddress,
      amountSats: transferAmount
    });

    console.log('✅ Transfer successful!');
    console.log('Transaction result:', result);

    // Check remaining balance
    const newBalance = await wallet.getBalance();
    console.log('Remaining balance:', Number(newBalance.balance), 'sats');

  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
  }
}

transferSats();
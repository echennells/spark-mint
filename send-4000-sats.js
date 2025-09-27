import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = "flavor company game shed outer pigeon drill adjust lend ozone nice zero";
const targetAddress = "sp1pgssx67qzgsqg0zv5vp98q82p22sx66w80udphrrxrh5cpawy9c0k2mftlnmk7";

async function send4000Sats() {
  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 From wallet:', wallet.sparkAddress);
    console.log('📤 To address:', targetAddress);

    // Check balance first
    const balance = await wallet.getBalance();
    console.log('💰 Current balance:', balance.balance, 'sats');

    if (balance.balance < 4000n) {
      console.log('❌ Insufficient balance');
      return;
    }

    // Send the sats
    console.log('\n🚀 Sending 4000 sats...');

    const txResult = await wallet.transfer({
      receiverSparkAddress: targetAddress,
      amountSats: 4000
    });

    console.log('✅ Transaction sent!');
    console.log('📄 Transaction ID:', txResult);

    // Check new balance
    const newBalance = await wallet.getBalance();
    console.log('\n💰 New balance:', newBalance.balance, 'sats');

  } catch (error) {
    console.error('❌ Error sending sats:', error.message);
  }
}

send4000Sats();
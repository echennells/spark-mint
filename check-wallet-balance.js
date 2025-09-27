import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node check-wallet-balance.js "your mnemonic"');
  process.exit(1);
}

async function checkBalance() {
  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet:', wallet.sparkAddress);
    console.log('🔍 Checking balance (this may take a moment for pending transactions)...\n');

    const balance = await wallet.getBalance();
    console.log('💰 Balance:', Number(balance.balance), 'sats');

    if (balance.tokenBalances.size > 0) {
      console.log('🪙 Tokens:');
      for (const [tokenId, tokenData] of balance.tokenBalances) {
        console.log(`   ${tokenData.tokenMetadata.tokenName}: ${tokenData.balance} units`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkBalance();
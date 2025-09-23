import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const amount = process.argv[3];

if (!mnemonic || !amount) {
  console.log('Usage: node mint-more.js "mnemonic" amount');
  console.log('Example: node mint-more.js "your mnemonic" 5000');
  process.exit(1);
}

async function mintMore() {
  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: { network: "MAINNET" }
    });

    const balance = await wallet.getBalance();
    console.log('Current balance:', balance.balance, 'sats');

    if (balance.tokenBalances.size === 0) {
      console.log('❌ No tokens found in this wallet');
      return;
    }

    // Show existing token
    for (const [tokenId, tokenData] of balance.tokenBalances) {
      console.log(`Existing token: ${tokenData.tokenMetadata.tokenName}`);
      console.log(`Current supply: ${tokenData.balance} units`);
    }

    console.log(`\n🪙 Minting ${amount} more units...`);

    const mintTx = await wallet.mintTokens(BigInt(amount));
    console.log('✅ Minted successfully!');
    console.log('Transaction ID:', mintTx);

    // Check new balance
    const newBalance = await wallet.getBalance();
    for (const [tokenId, tokenData] of newBalance.tokenBalances) {
      console.log(`New supply: ${tokenData.balance} units`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

mintMore();
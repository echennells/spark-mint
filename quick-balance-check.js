import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node quick-balance-check.js "mnemonic"');
  process.exit(1);
}

async function checkBalance() {
  const { wallet } = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: mnemonic,
    options: { network: 'MAINNET' }
  });

  const balance = await wallet.getBalance();
  console.log('Balance:', balance.balance, 'sats');
  console.log('Tokens:', balance.tokenBalances.size);

  if (balance.tokenBalances.size > 0) {
    for (const [tokenId, tokenData] of balance.tokenBalances) {
      console.log(`  ${tokenData.tokenMetadata.tokenName}: ${tokenData.balance} units`);
    }
  }
}

checkBalance();
import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node check-token-l1.js "mnemonic"');
  console.log('Example: node check-token-l1.js "your mnemonic phrase"');
  process.exit(1);
}

async function checkTokenL1() {
  try {
    console.log('🔍 Checking token L1 information...\n');

    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: { network: "MAINNET" }
    });

    // Get basic wallet info
    const sparkAddress = await wallet.getSparkAddress();
    console.log('Spark Address:', sparkAddress);

    // Get token metadata
    try {
      const tokenMetadata = await wallet.getIssuerTokenMetadata();
      console.log('\n📊 Token Metadata:');
      console.log('  Name:', tokenMetadata.tokenName);
      console.log('  Ticker:', tokenMetadata.tokenTicker);
      console.log('  Decimals:', tokenMetadata.decimals);
      console.log('  Max Supply:', tokenMetadata.maxSupply.toString());
      console.log('  Is Freezable:', tokenMetadata.isFreezable);
      console.log('  Token Public Key:', tokenMetadata.tokenPublicKey);

      // Get token identifier
      const tokenIdentifier = await wallet.getIssuerTokenIdentifier();
      console.log('  Token Identifier (bech32m):', tokenIdentifier);

      // Get token balance
      const tokenBalance = await wallet.getIssuerTokenBalance();
      console.log('\n💰 Current Supply:', tokenBalance.balance.toString(), 'units');

    } catch (error) {
      console.log('\n⚠️  No token found for this wallet');
      console.log('   (This wallet has not created a token yet)');
      return;
    }

    // Get L1 address
    console.log('\n🔗 L1 (Bitcoin) Information:');
    try {
      const l1Address = await wallet.getTokenL1Address();
      console.log('  Token L1 Address:', l1Address);
      console.log('\n  This is the Bitcoin mainnet address associated with your token.');
      console.log('  Token data is synchronized with L1 through the BTKN protocol.');
    } catch (error) {
      console.log('  ❌ Could not retrieve L1 address:', error.message);
    }

    // Get regular balance
    const balance = await wallet.getBalance();
    console.log('\n💸 Wallet Balance:', balance.balance, 'sats');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

checkTokenL1();

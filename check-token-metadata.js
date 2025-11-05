import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('Usage: node check-token-metadata.js "your mnemonic"');
  process.exit(1);
}

async function checkTokenMetadata() {
  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('🔍 Checking token metadata...\n');

    try {
      const metadata = await wallet.getIssuerTokenMetadata();

      console.log('📄 Token Metadata:');
      console.log('==================');
      console.log('Token Name:', metadata.tokenName);
      console.log('Token Ticker:', metadata.tokenTicker);
      console.log('Decimals:', metadata.decimals);
      console.log('Max Supply:', metadata.maxSupply.toString());
      console.log('Is Freezable:', metadata.isFreezable);
      console.log('Token Public Key:', metadata.tokenPublicKey);

      // Also get token identifier
      const tokenId = await wallet.getIssuerTokenIdentifier();
      console.log('Token Identifier:', tokenId);

    } catch (error) {
      console.log('❌ No token found for this wallet');
      console.log('This wallet has not created any tokens yet');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTokenMetadata();
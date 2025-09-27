import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

// Get mnemonic from command line argument
const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('❌ Please provide a mnemonic as an argument');
  console.log('   Usage: node create-bepsi-token.js "your twelve word mnemonic phrase here"');
  process.exit(1);
}

async function createBepsiToken() {
  console.log('🚀 Creating BEPSI token with supply of 2100\n');

  try {
    // Step 1: Use provided mnemonic
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet Loaded');
    console.log('   Using mnemonic:', mnemonic);

    // Step 2: Get the funding address
    const fundingAddress = await wallet.getTokenL1Address();
    console.log('💰 Funding Address:', fundingAddress);
    console.log('   Make sure you have ~2000 sats here for token creation\n');

    // Check current balance with full details
    const initialBalance = await wallet.getBalance();
    console.log('📊 INITIAL STATE:');
    console.log('   Balance:', initialBalance.balance, 'sats');
    console.log('   Existing tokens:', initialBalance.tokenBalances.size);

    if (initialBalance.balance < 2000n) {
      console.log('\n⚠️  WARNING: You may not have enough sats for token creation');
      console.log('   Recommended: at least 2000 sats');
      console.log('   Proceeding anyway...');
    }

    // Step 3: Create BEPSI token
    const tokenName = "BEPSI";
    const tokenTicker = "BEPSI";
    const maxSupply = 2100n * 1000000n; // 2100 tokens with 6 decimals = 2,100,000,000 units
    const mintAmount = 2100n * 1000000n; // Mint the full supply

    console.log(`\n🪙 Creating token: ${tokenName} (${tokenTicker})`);
    console.log(`   Max Supply: 2100 tokens (${maxSupply} units with 6 decimals)`);

    try {
      const tokenCreation = await wallet.createToken({
        tokenName: tokenName,
        tokenTicker: tokenTicker,
        maxSupply: maxSupply,
        decimals: 6,
        isFreezeable: false,
      });

      console.log('✅ Token created');
      console.log('   Transaction ID:', tokenCreation);

      // Check if balance changed
      const balanceAfterCreate = await wallet.getBalance();
      const balanceChange = Number(balanceAfterCreate.balance - initialBalance.balance);
      console.log('   Balance change:', balanceChange, 'sats');

      // Step 4: Mint full supply of BEPSI tokens
      console.log('\n🪙 Minting full supply of 2100 BEPSI tokens...');
      console.log('   Mint amount:', mintAmount, 'units (2100 tokens)');

      try {
        const mintTx = await wallet.mintTokens(mintAmount);
        console.log('✅ Tokens minted');
        console.log('   Transaction ID:', mintTx);

        // Check final balance
        const finalBalance = await wallet.getBalance();
        console.log('\n📊 Final Balance:');
        console.log('   Sats:', finalBalance.balance);
        console.log('   Total sats spent:', Number(initialBalance.balance - finalBalance.balance));

        // Display token balances
        for (const [tokenId, tokenData] of finalBalance.tokenBalances) {
          console.log(`   Token: ${tokenData.tokenMetadata.tokenName}`);
          console.log(`   Balance: ${tokenData.balance} units (${Number(tokenData.balance) / 1000000} tokens)`);
        }

      } catch (mintError) {
        console.log('❌ Minting failed:', mintError.message);
        return;
      }

      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('════════════════════════════════════════');
      console.log(`TOKEN CREATED: ${tokenName} (${tokenTicker})`);
      console.log(`SUPPLY: 2100 tokens`);
      console.log(`WALLET: ${mnemonic}`);
      console.log('════════════════════════════════════════');

    } catch (createError) {
      console.error('❌ Token creation failed:', createError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createBepsiToken();
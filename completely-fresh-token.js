import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

// Get mnemonic from command line argument
const mnemonic = process.argv[2];

if (!mnemonic) {
  console.log('❌ Please provide a mnemonic as an argument');
  console.log('   Usage: node completely-fresh-token.js "your twelve word mnemonic phrase here"');
  process.exit(1);
}

async function createCompletelyNewToken() {
  console.log('🚀 Using provided wallet to create/mint tokens\n');

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
    // const fundingAddress = await wallet.getTokenL1Address();
    // console.log('💰 Funding Address:', fundingAddress);
    // console.log('   You need to send ~2000 sats here for token creation\n');

    // Check current balance with full details
    const initialBalance = await wallet.getBalance();
    console.log('📊 INITIAL STATE:');
    console.log('   Balance:', initialBalance.balance, 'sats');
    console.log('   Existing tokens:', initialBalance.tokenBalances.size);
    console.log('   Full balance object:', JSON.stringify(initialBalance, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value, 2));


    // Always try to create a new token with unique name
    console.log('\n🆕 Creating new token...');

    // Step 3: Create new token
    const timestamp = Date.now().toString().slice(-6);
    const tokenName = `FreshToken${timestamp}`;
    const tokenTicker = `FT${timestamp.slice(-4)}`;

    console.log(`\n🪙 Creating token: ${tokenName} (${tokenTicker})`);

    try {
      const tokenCreation = await wallet.createToken({
        tokenName: tokenName,
        tokenTicker: tokenTicker,
        maxSupply: 1_000_000_000_000n,
        decimals: 6,
        isFreezeable: false,
      });

      console.log('✅ Token created');
      console.log('   Transaction ID:', tokenCreation);

      // Check if balance changed
      const balanceAfterCreate = await wallet.getBalance();
      const balanceChange = Number(balanceAfterCreate.balance - initialBalance.balance);
      console.log('   Balance change:', balanceChange, 'sats');

      // No wait needed - proceed directly to minting

      // Step 4: Mint tokens
      console.log('\n🪙 Attempting to mint tokens...');
      const mintAmount = 1000n;  // 0.001 tokens with 6 decimals
      console.log('   Mint amount:', mintAmount, 'units');

      try {
        const mintTx = await wallet.mintTokens(mintAmount);
        console.log('✅ Tokens minted');
        console.log('   Transaction ID:', mintTx);

        // Check final balance
        const finalBalance = await wallet.getBalance();
        console.log('\n📊 Final Balance:');
        console.log('   Sats:', finalBalance.balance);
        console.log('   Total sats spent:', Number(initialBalance.balance - finalBalance.balance));
        console.log('   Token balances:', finalBalance.tokenBalances);

      } catch (mintError) {
        console.log('❌ Minting failed:', mintError.message);
        return;
      }

      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('════════════════════════════════════════');
      console.log(`NEW WALLET MNEMONIC: ${mnemonic}`);
      console.log(`TOKEN: ${tokenName} (${tokenTicker})`);
      console.log(`MINTED: ${mintAmount} units`);
      console.log('════════════════════════════════════════');

    } catch (createError) {
      console.error('❌ Token creation failed:', createError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createCompletelyNewToken();
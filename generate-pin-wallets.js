const { IssuerSparkWallet } = require("@buildonspark/issuer-sdk");

async function generateWalletsForPins() {
  console.log("🔧 Generating separate Spark wallets for each vending machine pin...\n");

  const pins = [516, 517, 518, 524, 525, 528]; // Real drink pins
  const wallets = {};
  let treasuryWallet = null;

  for (const pinNo of pins) {
    console.log(`Generating wallet for pin ${pinNo}...`);

    try {
      const { wallet, mnemonic } = await IssuerSparkWallet.initialize({
        options: {
          network: "MAINNET",
        },
      });

      wallets[pinNo] = {
        mnemonic: mnemonic,
        address: wallet.sparkAddress
      };

      console.log(`✅ Pin ${pinNo}:`);
      console.log(`   Address: ${wallet.sparkAddress}`);
      console.log(`   Mnemonic: ${mnemonic}\n`);

    } catch (error) {
      console.error(`❌ Failed to generate wallet for pin ${pinNo}:`, error.message);
    }
  }

  // Generate treasury wallet
  console.log(`Generating treasury wallet for fund consolidation...`);
  try {
    const { wallet, mnemonic } = await IssuerSparkWallet.initialize({
      options: {
        network: "MAINNET",
      },
    });

    treasuryWallet = {
      mnemonic: mnemonic,
      address: wallet.sparkAddress
    };

    console.log(`✅ Treasury:`)
    console.log(`   Address: ${wallet.sparkAddress}`);
    console.log(`   Mnemonic: ${mnemonic}\n`);

  } catch (error) {
    console.error(`❌ Failed to generate treasury wallet:`, error.message);
  }

  console.log("📋 Summary - Add these to your .env file:");
  console.log("=" .repeat(80));

  for (const pinNo of pins) {
    if (wallets[pinNo]) {
      console.log(`SPARK_PIN_${pinNo}_ADDRESS=${wallets[pinNo].address}`);
      console.log(`SPARK_PIN_${pinNo}_MNEMONIC=${wallets[pinNo].mnemonic}`);
    }
  }

  if (treasuryWallet) {
    console.log(`\n# Treasury wallet for fund consolidation`);
    console.log(`SPARK_TREASURY_ADDRESS=${treasuryWallet.address}`);
    console.log(`SPARK_TREASURY_MNEMONIC=${treasuryWallet.mnemonic}`);
  }

  console.log("=" .repeat(80));
  console.log("\n🎯 Each pin now has its own unique Spark address!");
  if (treasuryWallet) {
    console.log("💰 Treasury wallet configured for automatic fund consolidation!");
  }
}

generateWalletsForPins().catch(console.error);
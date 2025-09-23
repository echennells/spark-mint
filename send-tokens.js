import { SparkWallet } from "@buildonspark/spark-sdk";

const mnemonic = process.argv[2];
const amount = process.argv[3] || "100";
const recipient = process.argv[4];

if (!mnemonic || !recipient) {
  console.log('Usage: node send-tokens.js "mnemonic" [amount] "recipient_address"');
  console.log('Example: node send-tokens.js "your mnemonic" 100 "sp1p..."');
  process.exit(1);
}

async function sendTokens() {
  try {
    const wallet = new SparkWallet({ network: 'MAINNET' });
    const { wallet: w } = await wallet.initWallet(mnemonic);

    const balance = await w.getBalance();
    console.log('Current sats:', balance.balance);

    if (balance.tokenBalances.size === 0) {
      console.log('❌ No tokens found in this wallet');
      return;
    }

    // Get token info
    let tokenIdentifier, tokenData;
    for (const [id, data] of balance.tokenBalances) {
      tokenIdentifier = id; // This is the bech32m identifier
      tokenData = data;
      console.log(`Token: ${tokenData.tokenMetadata.tokenName}`);
      console.log(`Token ID: ${tokenIdentifier}`);
      console.log(`Current balance: ${tokenData.balance} units`);
    }

    if (tokenData.balance < BigInt(amount)) {
      console.log(`❌ Insufficient token balance. Have ${tokenData.balance}, need ${amount}`);
      return;
    }

    console.log(`\n📤 Sending ${amount} units to ${recipient}...`);

    try {
      // Try transferTokens method
      const transfer = await w.transferTokens({
        tokenIdentifier: tokenIdentifier,
        tokenAmount: BigInt(amount),
        receiverSparkAddress: recipient
      });

      console.log('✅ Tokens sent successfully!');
      console.log('Transaction:', transfer);

    } catch (transferError) {
      console.log('❌ Transfer failed:', transferError.message);

      // Try alternative method names
      console.log('\n🔄 Checking for alternative transfer methods...');
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(w));
      const tokenMethods = methods.filter(m =>
        m.toLowerCase().includes('token') &&
        (m.toLowerCase().includes('send') || m.toLowerCase().includes('transfer'))
      );
      console.log('Available token transfer methods:', tokenMethods);
    }

    // Check new balance
    const newBalance = await w.getBalance();
    for (const [id, data] of newBalance.tokenBalances) {
      console.log(`\nNew token balance: ${data.balance} units`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

sendTokens();
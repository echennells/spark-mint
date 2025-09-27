import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const mnemonic = process.argv[2];
const txid = process.argv[3];

if (!mnemonic) {
  console.log('❌ Please provide mnemonic');
  console.log('   Usage: node claim-l1-deposit.js "your mnemonic" [optional-txid]');
  process.exit(1);
}

async function claimL1Deposit() {
  console.log('🔍 Checking for L1 Bitcoin deposits to claim...\n');

  try {
    const { wallet } = await IssuerSparkWallet.initialize({
      mnemonicOrSeed: mnemonic,
      options: {
        network: "MAINNET",
      },
    });

    console.log('📱 Wallet:', wallet.sparkAddress);

    const initialBalance = await wallet.getBalance();
    console.log('📊 Current Spark Balance:', Number(initialBalance.balance), 'sats\n');

    console.log('🔍 Checking for static deposit addresses...');
    const depositAddresses = await wallet.queryStaticDepositAddresses();
    console.log(`Found ${depositAddresses.length} registered deposit address(es)`);

    if (depositAddresses.length === 0) {
      console.log('\n⚠️  No deposit addresses registered yet.');
      console.log('   Creating a new static deposit address...');
      const newAddress = await wallet.getStaticDepositAddress();
      console.log('✅ New deposit address created:', newAddress);
      depositAddresses.push(newAddress);
    }

    for (const addr of depositAddresses) {
      console.log('💰 Deposit Address:', addr);
    }

    if (txid) {
      console.log('\n🎯 Using provided transaction ID:', txid);
      await claimSpecificDeposit(wallet, txid);
    } else {
      console.log('\n🔍 Querying for UTXOs at deposit addresses...');

      let allUtxos = [];
      for (const addr of depositAddresses) {
        try {
          const utxos = await wallet.getUtxosForDepositAddress(addr, 100, 0, true);
          allUtxos.push(...utxos.map(u => ({ ...u, address: addr })));
        } catch (error) {
          console.log(`   ⚠️  Could not query ${addr}: ${error.message}`);
        }
      }

      console.log(`Found ${allUtxos.length} unclaimed UTXO(s)`);

      if (allUtxos.length === 0) {
        console.log('\n❌ No UTXOs found at your deposit addresses.');
        console.log('   Either:');
        console.log('   1. Your transaction needs more confirmations (Spark requires ~3 confirmations)');
        console.log('   2. You sent to a different address');
        console.log('   3. The deposit has already been claimed');
        console.log('\n   Your registered deposit addresses:');
        for (const addr of depositAddresses) {
          console.log('     ', addr);
        }
        console.log('\n   ⏱️  If you just sent Bitcoin, wait for 3+ confirmations (~30 minutes) and try again.');
        console.log('   Or provide the txid manually: node claim-l1-deposit.js "mnemonic" <txid>');
        return;
      }

      for (const utxo of allUtxos) {
        console.log(`\n📦 Found UTXO: ${utxo.txid}:${utxo.vout} at ${utxo.address}`);
        await claimSpecificDeposit(wallet, utxo.txid, utxo.vout);
      }
    }

    const finalBalance = await wallet.getBalance();
    console.log('\n✅ Final Spark Balance:', Number(finalBalance.balance), 'sats');
    console.log('💰 Gained:', Number(finalBalance.balance - initialBalance.balance), 'sats');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

async function claimSpecificDeposit(wallet, txid, vout = 0) {
  try {
    console.log(`\n📋 Getting claim quote for ${txid}:${vout}...`);

    const quote = await wallet.getClaimStaticDepositQuote(txid, vout);

    console.log('💰 Net Credit:', quote.creditAmountSats, 'sats');

    console.log('\n🚀 Claiming deposit...');

    const claimResult = await wallet.claimStaticDeposit({
      transactionId: txid,
      creditAmountSats: quote.creditAmountSats,
      sspSignature: quote.signature,
      outputIndex: vout,
    });

    if (claimResult) {
      console.log('✅ Deposit claimed successfully!');
      console.log('   Claimed Amount:', claimResult.creditAmountSats, 'sats');
    } else {
      console.log('⚠️  Claim returned null (may already be claimed)');
    }

  } catch (error) {
    console.error('❌ Failed to claim deposit:', error.message);

    if (error.message.includes('not found') || error.message.includes('Static deposit address')) {
      console.log('\n⏱️  This usually means the deposit needs more confirmations.');
      console.log('   Spark requires ~3 Bitcoin confirmations (~30 minutes).');
      console.log('   Please wait and try again in a few minutes.');
    }
  }
}

claimL1Deposit();
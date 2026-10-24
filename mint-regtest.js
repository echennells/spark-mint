// One-off regtest mint runner. Mirrors completely-fresh-token.js but:
// - targets REGTEST instead of MAINNET
// - generates a fresh mnemonic if SPARK_TEST_MNEMONIC is unset
// - prints every step so we can see what the SDK actually does
//
// Run from /workspace/temp/spark-mint:  node mint-regtest.js

import { IssuerSparkWallet } from "@buildonspark/issuer-sdk";

const NETWORK = "REGTEST";
const TOKEN_NAME = process.argv[2] || "RegtestTest";
const TOKEN_TICKER = (process.argv[3] || TOKEN_NAME).slice(0, 6).toUpperCase();
const MINT_AMOUNT = 1_000n;

function pretty(obj) {
  return JSON.stringify(
    obj,
    (_k, v) => (typeof v === "bigint" ? v.toString() + "n" : v),
    2,
  );
}

async function run() {
  const startedAt = Date.now();
  const seed = process.env.SPARK_TEST_MNEMONIC || undefined;

  console.log(`network: ${NETWORK}`);
  console.log(`token:   ${TOKEN_NAME} (${TOKEN_TICKER})`);
  console.log(`seed:    ${seed ? "from SPARK_TEST_MNEMONIC env" : "generating fresh"}\n`);

  const init = await IssuerSparkWallet.initialize({
    mnemonicOrSeed: seed,
    options: { network: NETWORK },
  });
  const wallet = init.wallet;
  const generatedMnemonic = init.mnemonic;

  if (generatedMnemonic) {
    console.log("=== generated mnemonic (regtest only — fine to log) ===");
    console.log(generatedMnemonic);
    console.log();
  }

  const sparkAddress = await wallet.getSparkAddress();
  const identityKey = await wallet.getIdentityPublicKey();
  console.log(`spark address: ${sparkAddress}`);
  console.log(`identity key:  ${identityKey}\n`);

  const initialBalance = await wallet.getBalance();
  console.log("initial balance:");
  console.log(pretty(initialBalance));
  console.log();

  console.log(`step 1: createToken ${TOKEN_NAME} (${TOKEN_TICKER})`);
  let createTx;
  try {
    createTx = await wallet.createToken({
      tokenName: TOKEN_NAME,
      tokenTicker: TOKEN_TICKER,
      maxSupply: 1_000_000_000_000n,
      decimals: 6,
      isFreezeable: false,
    });
    console.log(`  createToken tx: ${createTx}\n`);
  } catch (err) {
    console.log(`  createToken FAILED: ${err.message}`);
    if (err.context) console.log(`  context: ${pretty(err.context)}`);
    process.exit(1);
  }

  const balanceAfterCreate = await wallet.getBalance();
  console.log("balance after createToken:");
  console.log(pretty(balanceAfterCreate));
  console.log();

  console.log(`step 2: mintTokens ${MINT_AMOUNT}`);
  let mintTx;
  try {
    mintTx = await wallet.mintTokens(MINT_AMOUNT);
    console.log(`  mintTokens tx: ${mintTx}\n`);
  } catch (err) {
    console.log(`  mintTokens FAILED: ${err.message}`);
    if (err.context) console.log(`  context: ${pretty(err.context)}`);
    process.exit(2);
  }

  const finalBalance = await wallet.getBalance();
  console.log("final balance:");
  console.log(pretty(finalBalance));

  let tokenId;
  try {
    tokenId = await wallet.getIssuerTokenIdentifier();
    console.log(`\nissuer token identifier: ${tokenId}`);
  } catch (err) {
    console.log(`\ngetIssuerTokenIdentifier failed: ${err.message}`);
  }

  console.log(`\ndone in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);

  await wallet.cleanupConnections();
}

run().catch((err) => {
  console.error("\nfatal:", err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});

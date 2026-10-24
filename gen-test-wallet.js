// Generates a fresh REGTEST wallet for the skill's test suite.
// Prints: mnemonic, Spark address, L1 deposit address.

import { SparkWallet } from "@buildonspark/spark-sdk";

const { wallet, mnemonic } = await SparkWallet.initialize({
  options: { network: "REGTEST" },
});

const sparkAddress = await wallet.getSparkAddress();
const l1StaticDeposit = await wallet.getStaticDepositAddress();
const identityKey = await wallet.getIdentityPublicKey();

console.log("=== regtest test wallet ===");
console.log("mnemonic:        ", mnemonic);
console.log("identity key:    ", identityKey);
console.log("spark address:   ", sparkAddress);
console.log("L1 deposit (paste into faucet):", l1StaticDeposit);

await wallet.cleanupConnections();

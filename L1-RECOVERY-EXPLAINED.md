# Spark Bitcoin L1 Uncooperative Exit Mechanism

## Overview

Spark implements a trustless Bitcoin Layer 2 system where users can **always** recover their funds to Layer 1, even if Spark servers permanently disappear. This document explains how this works.

## The Problem

In any Layer 2 system, there's a fundamental challenge:
- Funds are locked on Layer 1 (Bitcoin mainchain)
- Transactions happen on Layer 2 (off-chain or in a separate structure)
- **What if the L2 operator disappears?**

Traditional solutions:
- **Optimistic Rollups**: Use fraud proofs and challenge periods
- **ZK Rollups**: Use zero-knowledge proofs of state transitions
- **State Channels**: Use pre-signed transaction trees

Spark uses a **hybrid approach** combining transaction trees with threshold signatures.

## Spark's Solution: Pre-Signed Refund Transactions with Timelocks

### 1. The Tree Structure

When you deposit Bitcoin into Spark, your funds become part of a **Merkle-like tree structure** on Bitcoin L1:

```
Bitcoin Deposit UTXO
        ↓
   Root Node Tx
        ↓
  [Split/Node Txs...]
        ↓
    Leaf Node Tx  ← Your balance is here
        ↓
   Refund Tx (TIMELOCKED)
```

Each level of the tree is an actual Bitcoin transaction, but they're not all broadcast immediately.

### 2. FROST Threshold Signatures

Spark uses **FROST** (Flexible Round-Optimized Schnorr Threshold signatures):

- Your wallet holds one signing key share
- Spark operators hold other signing key shares
- **2-of-n** threshold required to sign
- All transactions are **pre-signed** during deposit setup

This means:
- ✅ **Cooperative case**: You + Spark cooperate to move funds (fast)
- ✅ **Uncooperative case**: Pre-signed transactions work without Spark (slow)

### 3. The Timelock Mechanism

Every leaf node has a pre-signed **refund transaction** that:

1. **Spends from the leaf node output**
2. **Sends Bitcoin back to your wallet's address**
3. **Has a relative timelock** using BIP 68 (OP_CSV)

#### Timelock Values

From `transaction.ts`:
```typescript
const INITIAL_TIMELOCK = 2000;  // blocks
const TEST_UNILATERAL_TIMELOCK = 100;  // blocks for testing

export const INITIAL_SEQUENCE = (1 << 30) | INITIAL_TIMELOCK;
```

- **Mainnet**: 2000 blocks ≈ **14 days** (at 10 min/block)
- **Testnet**: 100 blocks ≈ **16 hours**
- **Local/Regtest**: Same as testnet

The `(1 << 30)` sets bit 30, which enables **relative timelock** mode per BIP 68.

### 4. How Relative Timelocks Work (BIP 68)

Bitcoin's `nSequence` field in transaction inputs can encode relative timelocks:

```
Bits 31-30: Timelock type
  00 = No timelock (fully signed)
  01 = Block-based relative timelock (OP_CSV)

Bits 15-0: Timelock value (in blocks or 512-second intervals)
```

Spark uses: `0x40000000 | blocks`
- Bit 30 = 1: Enables relative timelock
- Bit 31 = 0: Not disabled
- Lower 16 bits: Block count

This means: **"This transaction can only be mined N blocks after its parent confirms"**

## The Uncooperative Exit Process

If Spark servers go offline permanently, here's how you recover:

### Step 1: Gather Your Data

Query your wallet's leaves to get:
- TreeNode data (contains pre-signed `nodeTx` and `refundTx`)
- Parent chain information
- Current sequence numbers (timelock values)

### Step 2: Build Transaction Chain

Use `constructUnilateralExitTxs()` from the SDK:

```javascript
const txChains = await constructUnilateralExitTxs(
  nodeHexStrings,  // Your leaf node data
  sparkClient,     // Optional, for querying parents
  network
);
```

This builds the complete chain from deposit to refund for each leaf.

### Step 3: Broadcast Node Transactions

Broadcast all transactions in order:
```
1. Root node tx       ← Broadcast immediately
2. Intermediate txs   ← Broadcast after each confirms
3. Your leaf node tx  ← Broadcast after parents confirm
```

**These transactions have NO timelock** - they can be broadcast immediately.

### Step 4: Wait for Timelock

After your leaf node transaction confirms, **wait 2000 blocks** (≈ 2 weeks on mainnet).

The refund transaction's timelock is **relative to the leaf node tx confirmation**, not absolute time.

### Step 5: Broadcast Refund Transaction

Once the timelock expires, broadcast your pre-signed refund transaction:
- Spends from the leaf node output
- Sends funds to your Bitcoin address
- **No cooperation from Spark needed!**

### Step 6: Funds Recovered! 🎉

Your Bitcoin is back on Layer 1, under your full control.

## Security Properties

### Trust Model

| Property | Status | Explanation |
|----------|--------|-------------|
| **Funds custody** | ✅ Non-custodial | Threshold signatures mean no single party controls funds |
| **Exit guarantee** | ✅ Guaranteed | Pre-signed refund txs ensure exit path |
| **Censorship resistance** | ✅ Resistant | Can exit via L1 even if Spark censors you |
| **Timelock delay** | ⚠️ 2 weeks | Uncooperative exit requires waiting |
| **Cooperative speed** | ✅ Fast | Normal Spark operations are instant |

### Attack Scenarios

#### 1. Spark Servers Disappear
**Result**: ✅ You can recover via uncooperative exit (2 weeks)

#### 2. Spark Censors Your Transactions
**Result**: ✅ Fall back to uncooperative exit

#### 3. Spark Tries to Steal Funds
**Result**: ✅ Impossible - refund tx already signed, they can't create conflicting tx

#### 4. You Lose Your Private Keys
**Result**: ❌ Funds lost (same as losing Bitcoin keys)

#### 5. Timelock Hasn't Expired Yet
**Result**: ⏰ Must wait for 2000 blocks - this is by design

## Comparison to Other L2 Systems

### Lightning Network
- **Structure**: Bilateral payment channels
- **Exit**: Immediate (can close channel unilaterally)
- **Limitation**: Must have channel with recipient
- **Spark advantage**: No channel management needed

### Optimistic Rollups (Arbitrum, Optimism)
- **Structure**: State commitments on L1
- **Exit**: Challenge period (typically 7 days)
- **Exit mechanism**: Fraud proofs
- **Spark difference**: Pre-signed transactions instead of fraud proofs

### State Channels (Statechains)
- **Structure**: Off-chain state transfers
- **Exit**: Pre-signed transactions
- **Similarity**: Spark uses similar pre-signing approach
- **Difference**: Spark uses threshold signatures (FROST)

### Federated Sidechains (Liquid)
- **Structure**: Separate blockchain
- **Exit**: Requires federation cooperation
- **Spark advantage**: Trustless exit via timelocks

## Code References

Key files in `@buildonspark/spark-sdk`:

### Transaction Creation
- `src/utils/transaction.ts:7-18` - Timelock constants
- `src/utils/transaction.ts:279-334` - `createRefundTxs()` function
- `src/services/deposit.ts:290-300` - Refund tx creation during deposit

### Unilateral Exit
- `src/utils/unilateral-exit.ts:132-232` - `constructUnilateralExitTxs()`
- `src/utils/unilateral-exit.ts:235-542` - `constructUnilateralExitFeeBumpPackages()`

### FROST Signatures
- `src/services/deposit.ts:472-530` - FROST signing process
- `src/services/deposit.ts:533-616` - Signature aggregation

## Testing the Mechanism

### Prerequisites
1. Have a Spark wallet with claimed Bitcoin
2. Query your wallet leaves
3. Have the `@buildonspark/spark-sdk` installed

### Demo Script

Run the provided demo script:
```bash
# Show information about your exit capability
node uncooperative-l1-exit.js "your mnemonic" info

# Prepare actual exit transactions
node uncooperative-l1-exit.js "your mnemonic" prepare

# Simulate what happens if Spark goes down
node uncooperative-l1-exit.js "your mnemonic" simulate
```

### What You'll See

1. **Your leaf nodes** - Each represents funds in the tree
2. **Pre-signed transactions** - Already signed, ready to broadcast
3. **Timelock information** - How long you'd need to wait
4. **Transaction chains** - The exact sequence to broadcast

## Educational Insights

### For Students

1. **Layer 2 Security**: Understand how L2s can be trustless
2. **Bitcoin Scripting**: See timelock mechanisms (OP_CSV) in action
3. **Threshold Signatures**: Learn about FROST and multi-party computation
4. **Trade-offs**: Fast cooperative path vs slow uncooperative path

### Key Takeaways

- 💡 Pre-signing transactions removes need for online operators
- 💡 Relative timelocks enable time-based security guarantees
- 💡 Threshold signatures prevent unilateral fund control
- 💡 Trade-off: Security (trustless exit) vs Speed (2-week delay)

## Practical Considerations

### When Would You Use Uncooperative Exit?

- ✅ Spark servers permanently offline
- ✅ Spark company ceases operations
- ✅ You're censored from Spark network
- ✅ Emergency situations
- ❌ Normal operations (use cooperative withdraw instead - much faster!)

### Limitations

1. **Time delay**: 2 weeks is a long time
2. **On-chain fees**: Must pay Bitcoin transaction fees
3. **Multiple transactions**: More expensive than single tx
4. **Complexity**: More complex than simple Bitcoin transaction

### Future Improvements

Possible enhancements to the mechanism:
- Dynamic timelocks (shorter if no disputes)
- Batch exits (multiple users exit together)
- Watchtowers (automated exit services)
- Insurance funds (compensate for delays)

## Conclusion

Spark's uncooperative exit mechanism provides **trustless recovery** of Bitcoin funds even if Spark disappears. This is achieved through:

1. **Pre-signed refund transactions** (created during deposit)
2. **Relative timelocks** (BIP 68 / OP_CSV)
3. **FROST threshold signatures** (prevents single-party control)
4. **Tree structure** (efficient organization of funds)

The trade-off is **speed vs security**:
- Fast path: Cooperate with Spark (instant)
- Slow path: Exit via timelocks (2 weeks)

This demonstrates how Layer 2 systems can maintain Bitcoin's trustless security properties while enabling faster transactions.

---

## Questions for Discussion

1. What happens if the timelock is too short? Too long?
2. Could this mechanism work without threshold signatures?
3. How does this compare to Lightning Network's security model?
4. What are the economic implications of a 2-week exit delay?
5. Could users "grief" the system by forcing uncooperative exits?

---

**Author**: Claude (AI Assistant for Spark Protocol Educational Demo)
**Date**: 2025-11-05
**Purpose**: Educational demonstration of Layer 2 security mechanisms

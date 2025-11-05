# Visual L1 Recovery Demo - Quick Reference Guide

## Overview

`uncooperative-l1-exit-visual.js` provides **4 interactive modes** to explore Spark's L1 recovery mechanism for classroom demonstrations.

## The Four Modes

### 1. INFO MODE (Quick Overview)
**Command**: `node uncooperative-l1-exit-visual.js "mnemonic" info`

**What it shows**:
- Your total recoverable balance
- Number of leaves (UTXOs in the tree)
- Basic timelock information
- Available modes

**Best for**: Quick status check, starting point for demonstrations

---

### 2. VISUAL MODE (ASCII Tree Structure)
**Command**: `node uncooperative-l1-exit-visual.js "mnemonic" visual`

**What it shows**:
```
     Bitcoin L1 Deposit UTXO
              │
              ▼
     ┌──────────────────────┐
     │  Root Node Tx        │
     │  ⚡ No timelock      │
     │  ✅ Pre-signed       │
     └──────────────────────┘
              │
              ▼
     ┌──────────────────────┐
     │  Leaf Node Tx        │
     │  ⚡ No timelock      │
     │  ✅ Pre-signed       │
     └──────────────────────┘
              │
              ▼
     ┌──────────────────────┐
     │  Refund Tx           │
     │  ⏰ 2000 block lock  │
     │  🔐 Pre-signed       │
     │  💰 Returns to L1    │
     └──────────────────────┘
              │
              ▼
     Your Bitcoin Address (L1)
```

**Features**:
- ASCII art visualization of transaction tree
- Shows which transactions have timelocks
- Transaction count and size estimates
- Clear visual flow from deposit to recovery

**Best for**:
- Explaining the overall structure
- Understanding the transaction chain
- Visualizing how funds move through the tree

---

### 3. DECODE MODE (Transaction Internals)
**Command**: `node uncooperative-l1-exit-visual.js "mnemonic" decode`

**What it shows**:
```
═══════════════════════════════════════════════════════════════
📋 NODE TX TRANSACTION DETAILS
═══════════════════════════════════════════════════════════════
TXID: a1b2c3d4e5f6...
Version: 3
Size: 191 bytes
Inputs: 1 | Outputs: 2

──────────────────────────────────────────────────────────────
📥 INPUTS:
──────────────────────────────────────────────────────────────

  Input #0:
    Previous TXID: f6e5d4c3b2a1...
    Output Index: 0
    Sequence: 0x40000000 (1073741824)
    ⚡ No timelock - can confirm immediately
    Witness UTXO Value: 50000 sats
    Script Type: P2TR (Pay-to-Taproot)
    Script (hex): 512000112233445566778899aabbccdd...

──────────────────────────────────────────────────────────────
📤 OUTPUTS:
──────────────────────────────────────────────────────────────

  Output #0:
    Value: 49000 sats
    Script Type: P2TR (Pay-to-Taproot)
    Script (hex): 51201122334455...
    🔑 TAPROOT OUTPUT:
       - Can be spent with key-path (schnorr signature)
       - OR script-path (reveal script + satisfy conditions)
       - Tweaked public key: 1122334455...

  Output #1:
    Value: 0 sats
    Script Type: Ephemeral Anchor (OP_1 + push)
    ⚓ EPHEMERAL ANCHOR OUTPUT (0-value, anyone-can-spend)
       Purpose: Allows CPFP fee bumping
```

**For Refund Transactions, also shows**:
```
  Input #0:
    Sequence: 0x400007d0 (1073743824)
    ⏰ TIMELOCK ACTIVE:
       Type: RELATIVE
       Value: 2000 blocks
       Human: ~14 days (at 10 min/block)
       🔒 This tx can only be mined 2000 blocks after parent confirms
```

**Features**:
- **Transaction structure**: Version, size, TXID
- **Input analysis**: Previous outputs, sequence numbers, witness data
- **Timelock decoding**: Shows BIP 68 sequence field breakdown
- **Script type identification**: P2TR, P2WPKH, ephemeral anchors
- **Taproot details**: Key-path vs script-path spending
- **Ephemeral anchors**: CPFP fee bumping outputs

**Best for**:
- Teaching Bitcoin transaction structure
- Understanding timelocks (BIP 68, OP_CSV)
- Explaining Taproot (P2TR) scripts
- Showing how CPFP fee bumping works

---

### 4. DRYRUN MODE (Broadcast Simulation)
**Command**: `node uncooperative-l1-exit-visual.js "mnemonic" dryrun`

**What it shows**:
```
╔════════════════════════════════════════════════════════════╗
║                   🎭 DRY RUN MODE                          ║
║   Simulating broadcast WITHOUT actually sending to network ║
╚════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════
CHAIN #1 - Leaf: a1b2c3d4e5f6...
═══════════════════════════════════════════════════════════════

Step 1: 📤 Node Transaction
──────────────────────────────────────────────────────────────
TXID: f1e2d3c4b5a6...
Size: 191 bytes

📡 BROADCAST SIMULATION:
   → sendrawtransaction 03000000...
   ✅ Success (simulated) - TXID: f1e2d3c4b5a6...
   ⛏️  Transaction mined in block 850001 (simulated)


Step 2: 🎯 Refund Transaction
──────────────────────────────────────────────────────────────
TXID: c4d5e6f7a8b9...
Size: 154 bytes

🔒 TIMELOCK CHECK:
   Parent confirmed at block: 850001
   Timelock period: 2000 blocks
   Can broadcast at block: 852001
   Current simulated block: 850001
   ⏰ Need to wait: 2000 blocks (~333 hours)

   ⏳ [Simulating wait for timelock...]
   ✅ Timelock expired! Now at block 852001

📡 BROADCAST SIMULATION:
   → sendrawtransaction 03000000...
   ✅ Success (simulated) - TXID: c4d5e6f7a8b9...
   ⛏️  Transaction mined in block 852002 (simulated)

✅ Chain 1 complete! Funds recovered to L1.

╔════════════════════════════════════════════════════════════╗
║              DRY RUN COMPLETE - NO ACTUAL BROADCAST        ║
╚════════════════════════════════════════════════════════════╝
```

**Features**:
- **Step-by-step broadcast simulation**
- **Timelock calculation**: Shows exactly when refund can be broadcast
- **Block progression**: Simulates blockchain advancing
- **Waiting period**: Visualizes the 2-week delay
- **Safe**: Nothing actually broadcast to network

**Best for**:
- Demonstrating the full recovery process
- Showing timelock enforcement
- Understanding the 2-week waiting period
- "What if Spark goes down?" scenarios

---

## Teaching Scenarios

### Scenario 1: Basic Understanding
**Goal**: Student understands there's a recovery mechanism

**Steps**:
1. Run `info` mode - show they have recoverable funds
2. Run `visual` mode - show the tree structure
3. Explain: "These transactions are already signed, you can broadcast them"

### Scenario 2: Bitcoin Scripting Deep-Dive
**Goal**: Student understands timelocks and Taproot

**Steps**:
1. Run `decode` mode
2. Point out the sequence field: `0x400007d0`
3. Show how bit 30 enables relative timelock
4. Explain P2TR outputs and key-path vs script-path
5. Discuss ephemeral anchors for fee bumping

### Scenario 3: Full Recovery Simulation
**Goal**: Student sees the entire exit process

**Steps**:
1. Run `dryrun` mode
2. Watch as transactions broadcast step-by-step
3. See the timelock enforcement
4. Understand why it takes 2 weeks
5. Discuss trade-off: security vs convenience

### Scenario 4: L2 Security Comparison
**Goal**: Compare Spark to other L2 systems

**Steps**:
1. Show Spark's pre-signed transactions (this demo)
2. Compare to Lightning (bilateral channels, immediate exit)
3. Compare to Optimistic Rollups (fraud proofs, 7-day delay)
4. Discuss: Which approach is better? Why?

---

## Key Concepts Demonstrated

### 1. **Relative Timelocks (BIP 68)**
- `decode` mode shows sequence field breakdown
- `0x40000000 | blocks` format
- Only 2000 blocks after parent confirms

### 2. **Taproot (P2TR)**
- `decode` mode identifies P2TR outputs
- Shows tweaked public key
- Explains key-path vs script-path spending

### 3. **FROST Threshold Signatures**
- Transactions are pre-signed during deposit
- User + operators both needed for signatures
- But refund txs already signed - no cooperation needed!

### 4. **Ephemeral Anchors (CPFP)**
- `decode` mode shows 0-value OP_TRUE outputs
- Allows fee bumping via Child-Pays-For-Parent
- Bitcoin v3 transaction feature

### 5. **Tree Structure**
- `visual` mode shows the hierarchy
- Deposit → Root → ... → Leaf → Refund
- Must broadcast in order (parent before child)

---

## Common Questions & Answers

### Q: Why not just broadcast the refund immediately?
**A**: The timelock prevents double-spending. Run `decode` mode and look at the sequence field - it enforces a 2000 block wait.

### Q: What if I lose my keys during the 2-week wait?
**A**: Your funds are lost, same as losing Bitcoin keys. The transactions are signed, but you need your keys to generate them initially.

### Q: Can Spark prevent me from exiting?
**A**: No! Run `dryrun` mode - the transactions are already signed. Spark can't stop you from broadcasting them.

### Q: Why is the refund transaction smaller than node transactions?
**A**: Run `decode` mode and count outputs. Refund txs only have 1 output (your address), while node txs have 2 (next node + ephemeral anchor).

### Q: What happens if Bitcoin fees spike during my exit?
**A**: The ephemeral anchor output (see `decode` mode) allows anyone to add fees via CPFP (Child-Pays-For-Parent).

---

## Demo Tips for Instructors

1. **Start with `info`** - Get students oriented
2. **Show `visual`** - Build intuition about structure
3. **Deep dive with `decode`** - Teach Bitcoin internals
4. **Finish with `dryrun`** - Bring it all together

**Pause points**:
- After `visual`: Ask "What would happen if we skipped a transaction?"
- During `decode`: Ask "What does bit 30 in the sequence field mean?"
- After `dryrun`: Ask "Is 2 weeks too long? Too short? Why?"

**Interactive exercises**:
- Have students calculate timelock expiry for different block heights
- Ask them to identify script types from hex
- Compare transaction sizes and discuss fees

---

## Prerequisites

- A Spark wallet with claimed Bitcoin (have students run `claim-l1-deposit.js` first)
- Node.js installed
- `@buildonspark/spark-sdk` installed (`npm install`)

---

## Safety Note

⚠️ **All modes are safe for classroom use**:
- Nothing is broadcast to the Bitcoin network
- `dryrun` mode only simulates broadcasting
- No actual funds are moved or risked

To actually recover funds (if Spark goes offline), you'd need:
1. These transaction hex strings
2. A Bitcoin node or broadcasting service
3. The ability to wait out the timelock period

---

## Further Reading

See [L1-RECOVERY-EXPLAINED.md](./L1-RECOVERY-EXPLAINED.md) for:
- Detailed technical explanation
- Security model analysis
- Comparison to other L2 systems
- Protocol-level details

# Spark Token Scripts

Clean, working scripts for creating and managing tokens on Spark network.

This repository contains four main categories of functionality:
1. **Bitcoin/Lightning → Spark L2 Onboarding** - Get funds onto Spark
2. **Token Creation & Management** - Create and mint tokens (no funding required!)
3. **L1 Recovery & Security** - Educational demo of uncooperative exit mechanisms
4. **Utility Scripts** - Helper functions for all workflows

## Bitcoin/Lightning Onboarding Scripts

### `generate-wallet-and-invoice.js`
Creates a new wallet with Bitcoin/Lightning funding options.

```bash
node generate-wallet-and-invoice.js
```

**Output:**
- New mnemonic phrase
- Bitcoin deposit address (bc1p...)
- Lightning invoice (3000 sats)
- Spark address

### `claim-l1-deposit.js`
Claims Bitcoin deposits from L1 to Spark L2.

```bash
node claim-l1-deposit.js "your mnemonic" [optional-txid]
```

**Features:**
- Automatically finds and claims Bitcoin deposits
- Requires 3+ Bitcoin confirmations (~30 minutes)
- Shows fees and net credit amount

## L1 Recovery & Security Demo

### `uncooperative-l1-exit.js` (Basic Demo)
Educational demo showing how to recover funds even if Spark goes offline.

```bash
# Show information about uncooperative exit capability
node uncooperative-l1-exit.js "your mnemonic" info

# Prepare actual exit transactions
node uncooperative-l1-exit.js "your mnemonic" prepare

# Simulate what happens if Spark goes down
node uncooperative-l1-exit.js "your mnemonic" simulate
```

### `uncooperative-l1-exit-visual.js` ⭐ (Enhanced Visual Demo)
**NEW**: Advanced demo with transaction decoding, ASCII tree visualization, and dry-run simulation.

```bash
# Quick overview
node uncooperative-l1-exit-visual.js "your mnemonic" info

# ASCII tree visualization
node uncooperative-l1-exit-visual.js "your mnemonic" visual

# Deep transaction decode (shows timelocks, Taproot, scripts)
node uncooperative-l1-exit-visual.js "your mnemonic" decode

# Dry-run broadcast simulation (safe, nothing actually sent)
node uncooperative-l1-exit-visual.js "your mnemonic" dryrun
```

**What it demonstrates:**
- 🌳 ASCII tree visualization of transaction chains
- 🔬 Bitcoin transaction internals (inputs, outputs, scripts)
- ⏰ BIP 68 relative timelock decoding (shows the 2000-block wait)
- 🔑 Taproot (P2TR) script analysis
- ⚓ Ephemeral anchors for CPFP fee bumping
- 🎭 Safe dry-run simulation (no actual broadcast)
- Pre-signed refund transactions with timelocks
- FROST threshold signatures
- Trustless recovery even if Spark disappears

**Key concepts:**
- Relative timelocks (BIP 68 / OP_CSV)
- Taproot key-path vs script-path spending
- Transaction tree structure
- Uncooperative exit requires waiting ~2000 blocks (2 weeks on mainnet)
- All funds can be recovered to Bitcoin L1 without Spark cooperation

📖 **Documentation:**
- [L1-RECOVERY-EXPLAINED.md](L1-RECOVERY-EXPLAINED.md) - Technical deep-dive
- [VISUAL-DEMO-GUIDE.md](VISUAL-DEMO-GUIDE.md) - Teaching guide with examples

### `backup-exit-data.js` ⚠️ (Critical for True Uncooperative Exit)
**IMPORTANT**: Backs up parent node data needed for uncooperative exit if Spark goes offline.

```bash
# Backup to default directory (./spark-exit-backup)
node backup-exit-data.js "your mnemonic"

# Backup to custom location
node backup-exit-data.js "your mnemonic" "/path/to/backup"
```

**Why you need this:**
- 🚨 Your wallet stores leaf transactions, but NOT parent node data
- 🚨 Without parent data, you cannot recover if Spark goes down
- 🚨 Parent data must be downloaded from Spark servers while they're online

**When to backup:**
- ✅ After depositing Bitcoin (use `claim-l1-deposit.js`)
- ✅ After receiving funds from others
- ✅ Monthly (recommended)
- ❌ NOT needed after sending funds

**What gets saved:**
- Complete transaction chains (root → intermediate → leaf → refund)
- All data needed to broadcast recovery without Spark's help
- Encrypted storage recommended

📖 **Critical Reading**: [BACKUP-STRATEGY.md](BACKUP-STRATEGY.md) - Complete backup guide

⚠️ **Security Model**: The pre-signed refund transactions guarantee you CAN exit, but only if you have the parent node data. Either Spark must provide it, or you must have backed it up. This is a **data availability** requirement, not a trust requirement.

## Token Creation Scripts

### `completely-fresh-token.js`
Creates and mints a new token instantly.

```bash
node completely-fresh-token.js "your twelve word mnemonic phrase" "TokenName"
```

**Requirements:**
- Just a mnemonic - **NO FUNDING NEEDED!**
- Each wallet can only create ONE token

**Output:**
- Creates token with specified name
- Mints tokens
- Takes ~5 seconds total

### `send-tokens.js`
Transfers tokens between wallets.

```bash
node send-tokens.js "sender mnemonic" 100 "recipient_spark_address"
```

## Utility Scripts

### `check-wallet-balance.js`
Checks wallet balance including pending transactions.

```bash
node check-wallet-balance.js "your mnemonic"
```

**Features:**
- Shows sats balance
- Lists token balances
- Processes pending Lightning payments automatically

### `sweep-to-target.js`
Transfers all funds to a target Spark address.

```bash
node sweep-to-target.js "source mnemonic" "target_spark_address"
```

### Other Utilities
- **`mint-more.js "mnemonic" amount`** - Mint additional tokens to existing supply
- **`consolidate-sats.js "target_address"`** - Transfer sats from multiple wallets

## Workflows

### Token Creation (No Funding Required!)

Create and mint tokens without any Bitcoin or Lightning funds:

1. **Generate wallet:** `node generate-wallet-and-invoice.js`
2. **Create token:** `node completely-fresh-token.js "mnemonic" "TokenName"` (works with empty wallet!)
3. **Transfer tokens:** `node send-tokens.js "mnemonic" amount "recipient_address"`

### Bitcoin L1 → Spark L2 Onboarding

Get Bitcoin funds onto Spark Layer 2:

1. **Generate wallet:** `node generate-wallet-and-invoice.js`
2. **Send Bitcoin:** Send Bitcoin to the bc1p... address shown
3. **Wait for confirmations:** ~30 minutes for 3+ confirmations
4. **Claim deposit:** `node claim-l1-deposit.js "mnemonic"`
5. **Check balance:** `node check-wallet-balance.js "mnemonic"`

### Lightning → Spark Onboarding

Get Lightning funds onto Spark instantly:

1. **Generate wallet:** `node generate-wallet-and-invoice.js`
2. **Pay invoice:** Pay the Lightning invoice (3000 sats)
3. **Check balance:** `node check-wallet-balance.js "mnemonic"` (funds appear instantly)

### L1 Recovery Demo (Educational)

Understand and demonstrate uncooperative exit mechanisms:

1. **Have funds on Spark:** Complete Bitcoin L1 onboarding first
2. **Check exit capability:** `node uncooperative-l1-exit.js "mnemonic" info`
3. **View refund transactions:** `node uncooperative-l1-exit.js "mnemonic" prepare`
4. **Simulate Spark offline:** `node uncooperative-l1-exit.js "mnemonic" simulate`
5. **Read detailed docs:** See [L1-RECOVERY-EXPLAINED.md](L1-RECOVERY-EXPLAINED.md)

## Key Features

- ✅ **No funding required for tokens** - Create and mint tokens with empty wallets!
- ✅ **Bitcoin L1 → Spark L2 bridging** - Automatic deposit claiming
- ✅ **Lightning payments** - Instant funding via Lightning Network
- ✅ **Trustless L1 recovery** - Uncooperative exit via pre-signed refund transactions
- ✅ **No Bitcoin fees on L2** - Operations are free on Spark L2
- ✅ **3+ confirmation requirement** - Bitcoin deposits need confirmations
- 🔒 **Security guarantees** - FROST threshold signatures + timelocks protect funds
- ⚠️ **One token per wallet** - Each issuer can only create one token

## Educational Value

This repository now includes comprehensive educational materials on Layer 2 security:

- **Uncooperative exit mechanisms** - How to recover funds without operator cooperation
- **Timelock implementations** - BIP 68 relative timelocks (OP_CSV) in practice
- **Threshold signatures** - FROST (Flexible Round-Optimized Schnorr Threshold)
- **Pre-signed transactions** - Bitcoin script-level security guarantees
- **Layer 2 trade-offs** - Speed vs security, cooperative vs uncooperative paths

Perfect for:
- 🎓 Blockchain courses and workshops
- 🔍 Security researchers studying Layer 2 systems
- 💻 Developers learning Bitcoin scripting
- 📚 Anyone interested in trustless Layer 2 design


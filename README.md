# Spark Token Scripts

Clean, working scripts for creating and managing tokens on Spark network.

This repository contains three main categories of functionality:
1. **Bitcoin/Lightning → Spark L2 Onboarding** - Get funds onto Spark
2. **Token Creation & Management** - Create and mint tokens (no funding required!)
3. **Utility Scripts** - Helper functions for both workflows

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

## Key Features

- ✅ **No funding required for tokens** - Create and mint tokens with empty wallets!
- ✅ **Bitcoin L1 → Spark L2 bridging** - Automatic deposit claiming
- ✅ **Lightning payments** - Instant funding via Lightning Network
- ✅ **No Bitcoin fees on L2** - Operations are free on Spark L2
- ✅ **3+ confirmation requirement** - Bitcoin deposits need confirmations
- ⚠️ **One token per wallet** - Each issuer can only create one token


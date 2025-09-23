# Spark Token Scripts

Clean, working scripts for creating and managing tokens on Spark network.

## Core Scripts

### 1. `generate-wallet-and-invoice.js`
Creates a new wallet with funding options.

```bash
node generate-wallet-and-invoice.js
```

**Output:**
- New mnemonic phrase
- Lightning invoice (optional - not needed!)
- Spark/Bitcoin addresses (optional - not needed!)

### 2. `completely-fresh-token.js`
Creates and mints a new token instantly.

```bash
node completely-fresh-token.js "your twelve word mnemonic phrase"
```

**Requirements:**
- Just a mnemonic - **NO FUNDING NEEDED!**
- Each wallet can only create ONE token

**Output:**
- Creates token with unique name (FreshTokenXXXXXX)
- Mints 1000 units (0.001 tokens with 6 decimals)
- Takes ~5 seconds total

### 3. `send-tokens.js`
Transfers tokens between wallets.

```bash
node send-tokens.js "sender mnemonic" 100 "recipient_spark_address"
```

**Example:** `node send-tokens.js "your mnemonic" 100 "sp1p..."`

## Utility Scripts

- **`quick-balance-check.js "mnemonic"`** - Check wallet balance and tokens
- **`mint-more.js "mnemonic" amount`** - Mint additional tokens to existing supply
- **`consolidate-sats.js "target_address"`** - Transfer sats from multiple wallets

## Optimized Workflow

1. **Generate wallet:** `node generate-wallet-and-invoice.js` (get mnemonic)
2. **Create token:** `node completely-fresh-token.js "mnemonic"` (instant!)
3. **Transfer tokens:** `node send-tokens.js "mnemonic" amount "recipient_address"`

**No funding, no waiting, just instant tokens!**

## Key Discoveries

- ✅ **No funding required** - Empty wallets work fine
- ✅ **No waiting required** - Instant minting works
- ✅ **No Bitcoin fees** - Everything is free on Spark L2
- ✅ **Total time: ~5 seconds** to create and mint tokens
- ⚠️ **One token per wallet** - Each issuer can only create one token


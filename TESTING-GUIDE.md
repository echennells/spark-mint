# Spark Token Creation & L1 Withdrawal Testing Guide

## Quick Start

### Option 1: Automated Test Script (Node.js + Docker)
```bash
cd /Users/eric/blah/spark-mint
./test-token-and-withdraw.sh
```

This script will:
- ✅ Generate a new wallet (or use existing from `$SPARK_MNEMONIC`)
- ✅ Create a test token (no funding required!)
- ✅ Show you how to fund the wallet
- ✅ Help you test L1 withdrawal

### Option 2: Docker CLI Only (Interactive)
```bash
cd /Users/eric/blah/spark-mint
./test-with-docker.sh
```

Then follow the interactive prompts.

### Option 3: Manual Docker CLI
```bash
docker run -it --rm -v spark-test:/app/.wallet spark-cli:latest
```

## Complete Workflow Example

### Step 1: Create Wallet & Get Funding Options

```bash
# Using Node.js script
node generate-wallet-and-invoice.js
```

**Output:**
- Mnemonic (SAVE THIS!)
- Lightning invoice (for instant funding)
- Bitcoin deposit address (for L1 funding)
- Spark address

### Step 2: Fund Your Wallet

**Option A: Lightning (Instant)**
1. Copy the Lightning invoice from Step 1
2. Pay it from any Lightning wallet (try Phoenix, Breez, or Muun)
3. Funds appear instantly!

**Option B: Bitcoin L1 (30 minutes)**
```bash
# 1. Send Bitcoin to the bc1p... address from Step 1
# 2. Wait for 3+ confirmations (~30 minutes)
# 3. Claim the deposit:
node claim-l1-deposit.js "your mnemonic phrase"
```

### Step 3: Verify Balance

```bash
node check-wallet-balance.js "your mnemonic phrase"
```

### Step 4: Create a Token (No Funding Required!)

```bash
node completely-fresh-token.js "your mnemonic" "MyToken" "MTK"
```

This works even with **0 sats** in your wallet!

**Parameters:**
- `"MyToken"` = Token name
- `"MTK"` = Token ticker
- Creates with 6 decimals and max supply of 1 trillion

### Step 5: Check Token Metadata

```bash
node check-token-metadata.js "your mnemonic"
```

### Step 6: Test L1 Cooperative Withdrawal

Using Docker CLI:

```bash
docker run -it --rm spark-cli:latest

# In the CLI:
> initwallet your twelve word mnemonic phrase

# Get fee estimate
> withdrawalfee 50000 bc1p...your_bitcoin_address

# Execute withdrawal (MEDIUM speed recommended)
> withdraw 50000 bc1p...your_bitcoin_address MEDIUM

# Check status
> getcoopexitrequest <request-id-from-above>
```

**Withdrawal Speeds:**
- `FAST` - Higher fee, quicker processing
- `MEDIUM` - Balanced fee/speed
- `SLOW` - Lower fee, slower processing

## Testing Different Scenarios

### Scenario 1: Token Creation (No Sats Required)

```bash
# Generate wallet
export MNEMONIC=$(node generate-wallet-and-invoice.js | grep -A 1 "Mnemonic:" | tail -1)

# Create token immediately (no funding needed!)
node completely-fresh-token.js "$MNEMONIC" "TestToken" "TEST"

# Verify
node check-token-metadata.js "$MNEMONIC"
```

### Scenario 2: Full Cycle (Funding → Token → Withdrawal)

```bash
# 1. Setup
./test-token-and-withdraw.sh

# 2. Fund via Lightning (follow prompts)

# 3. Script handles token creation automatically

# 4. Follow prompts for withdrawal test
```

### Scenario 3: Unilateral Exit Test

```bash
docker run -it --rm spark-cli:latest

> initwallet your mnemonic
> getleaves                    # See your withdrawal leaves
> checktimelock <leaf-id>       # Check if timelock expired
> unilateralexit                # Interactive unilateral exit
```

## Funding Amounts for Testing

**Minimum Recommended:**
- Token creation only: **0 sats** (it's free!)
- Testing transfers: **~1,000 sats**
- Testing L1 withdrawal: **~10,000 sats** (to cover fees)

**Where to Get Test Sats:**
- Lightning: [lightningnetworkstores.com/faucet](https://lightningnetworkstores.com/faucet)
- Or use real sats from your own wallet

## Troubleshooting

### "No wallet found"
```bash
# Make sure you initialize first:
docker run -it --rm spark-cli:latest
> initwallet
```

### "Balance is 0"
You need to fund the wallet first. See Step 2 above.

### "Fee quote expired"
Get a fresh quote right before calling `withdraw`:
```bash
> withdrawalfee 50000 bc1p...
> withdraw 50000 bc1p... MEDIUM  # do this immediately!
```

### "Cannot create token - already exists"
Each wallet can only create ONE token. Use a different wallet/mnemonic for a new token.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `generate-wallet-and-invoice.js` | Create wallet + funding options |
| `check-wallet-balance.js` | Check sats and token balance |
| `completely-fresh-token.js` | Create and mint a new token |
| `check-token-metadata.js` | View token details |
| `claim-l1-deposit.js` | Claim Bitcoin from L1 deposit |
| `send-tokens.js` | Transfer tokens to another address |
| `test-token-and-withdraw.sh` | **Automated test workflow** |
| `test-with-docker.sh` | **Docker CLI launcher** |

## Docker CLI Commands Reference

### Wallet Commands
- `initwallet [mnemonic]` - Create/restore wallet
- `getbalance` - Check balance
- `getsparkaddress` - Show your Spark address

### Funding Commands
- `createinvoice <amount> <memo> <includeSparkAddress>` - Lightning invoice
- `getdepositaddress` - Get L1 Bitcoin deposit address
- `claimdeposit <txid>` - Claim L1 deposit

### Token Commands
- `createtoken <name> <ticker> <decimals> <maxSupply> <isFreezable>` - Create token
- `getissuertokenmetadata` - View your token
- `minttokens <amount>` - Mint more tokens
- `transfertokens <tokenId> <address> <amount>` - Send tokens

### L1 Withdrawal Commands
- `withdrawalfee <amount> <address>` - Get fee quote
- `withdraw <amount> <address> <speed>` - Cooperative exit
- `getcoopexitrequest <id>` - Check withdrawal status
- `unilateralexit` - Emergency withdrawal (no SSP needed)
- `getleaves` - List withdrawal leaves
- `checktimelock <leafId>` - Check timelock status

## Next Steps

1. **Start with the automated script**: `./test-token-and-withdraw.sh`
2. **Get comfortable with Docker CLI**: `./test-with-docker.sh`
3. **Read the Docker docs**: `/Users/eric/blah/spark/SPARK-CLI-DOCKER.md`
4. **Explore token transfers**: Try sending tokens between wallets

## Important Notes

⚠️ **This is testnet/development**
- Use small amounts for testing
- Save your mnemonics securely
- Cooperative exits require SSP to be online
- Unilateral exits require timelock expiration

🎯 **Key Insight**
- Token creation = FREE (0 sats required)
- Token transfers = FREE (0 sats required)
- L1 withdrawals = Need sats for fees

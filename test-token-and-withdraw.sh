#!/bin/bash

# Test script for creating a Spark token and doing a cooperative L1 withdrawal
# This script demonstrates the full workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Spark Token Creation & L1 Withdrawal Test${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Generate or use existing wallet
echo -e "${YELLOW}Step 1: Wallet Setup${NC}"
if [ -z "$SPARK_MNEMONIC" ]; then
    echo "No SPARK_MNEMONIC environment variable found."
    echo "Generating a new wallet..."
    node generate-wallet-and-invoice.js > /tmp/spark-wallet-output.txt

    MNEMONIC=$(grep -A 1 "Mnemonic:" /tmp/spark-wallet-output.txt | tail -1 | xargs)
    SPARK_ADDRESS=$(grep "Spark Address:" /tmp/spark-wallet-output.txt | cut -d: -f2 | xargs)
    LIGHTNING_INVOICE=$(grep "Lightning Invoice:" /tmp/spark-wallet-output.txt | cut -d: -f2 | xargs)
    BITCOIN_ADDRESS=$(grep "Bitcoin Deposit Address:" /tmp/spark-wallet-output.txt | cut -d: -f2 | xargs)

    echo -e "${GREEN}✓ New wallet created!${NC}"
    echo -e "Mnemonic: ${YELLOW}$MNEMONIC${NC}"
    echo -e "Spark Address: $SPARK_ADDRESS"
    echo ""
    echo -e "${RED}IMPORTANT: Save this mnemonic securely!${NC}"
    echo "export SPARK_MNEMONIC=\"$MNEMONIC\""
    echo ""
else
    MNEMONIC="$SPARK_MNEMONIC"
    echo -e "${GREEN}✓ Using existing wallet from SPARK_MNEMONIC${NC}\n"
fi

# Step 2: Check current balance
echo -e "${YELLOW}Step 2: Checking wallet balance${NC}"
node check-wallet-balance.js "$MNEMONIC" > /tmp/balance-output.txt
cat /tmp/balance-output.txt
BALANCE=$(grep "Balance:" /tmp/balance-output.txt | awk '{print $2}')
echo ""

if [ "$BALANCE" == "0" ]; then
    echo -e "${RED}⚠️  Wallet has 0 sats!${NC}"
    echo ""
    echo "To test L1 withdrawal, you need to fund this wallet first."
    echo ""
    echo -e "${YELLOW}Funding Options:${NC}"
    echo ""
    echo "Option A - Lightning (FAST - instant):"
    echo "  1. Get a Lightning invoice:"
    echo "     node generate-wallet-and-invoice.js"
    echo "  2. Pay the invoice from any Lightning wallet"
    echo "  3. Re-run this script"
    echo ""
    echo "Option B - Bitcoin L1 (SLOW - ~30 min):"
    echo "  1. Send Bitcoin to: $BITCOIN_ADDRESS"
    echo "  2. Wait for 3+ confirmations (~30 minutes)"
    echo "  3. Claim: node claim-l1-deposit.js \"$MNEMONIC\""
    echo "  4. Re-run this script"
    echo ""
    echo -e "${BLUE}Continuing with token creation (no funding needed)...${NC}\n"
fi

# Step 3: Create a test token (doesn't require funding!)
echo -e "${YELLOW}Step 3: Creating test token${NC}"
TOKEN_NAME="TestToken$(date +%s)"
TOKEN_TICKER="TEST"

echo "Token Name: $TOKEN_NAME"
echo "Token Ticker: $TOKEN_TICKER"

node completely-fresh-token.js "$MNEMONIC" "$TOKEN_NAME" "$TOKEN_TICKER" > /tmp/token-output.txt
cat /tmp/token-output.txt

TOKEN_ID=$(grep "Token identifier:" /tmp/token-output.txt | cut -d: -f2 | xargs)
echo ""
echo -e "${GREEN}✓ Token created successfully!${NC}"
echo "Token Identifier: $TOKEN_ID"
echo ""

# Step 4: Check token balance
echo -e "${YELLOW}Step 4: Checking token balance${NC}"
node check-token-metadata.js "$MNEMONIC"
echo ""

# Step 5: Attempt cooperative withdrawal (only if we have sats)
if [ "$BALANCE" != "0" ] && [ -n "$BALANCE" ]; then
    echo -e "${YELLOW}Step 5: Testing L1 Cooperative Withdrawal${NC}"
    echo ""

    # Get user's Bitcoin address for withdrawal
    read -p "Enter your Bitcoin address for withdrawal (or press Enter to skip): " WITHDRAW_ADDRESS

    if [ -z "$WITHDRAW_ADDRESS" ]; then
        echo -e "${YELLOW}Skipping withdrawal test${NC}"
    else
        # Calculate withdrawal amount (leave some for fees)
        if [ "$BALANCE" -gt "10000" ]; then
            WITHDRAW_AMOUNT=$((BALANCE - 5000))
            echo "Withdrawing $WITHDRAW_AMOUNT sats to $WITHDRAW_ADDRESS"
            echo ""

            echo -e "${BLUE}Using Docker CLI for withdrawal...${NC}"
            echo ""

            # Create a temporary script for the Docker CLI
            cat > /tmp/spark-withdraw-commands.txt <<EOF
initwallet $MNEMONIC
withdrawalfee $WITHDRAW_AMOUNT $WITHDRAW_ADDRESS
EOF

            echo "Commands to run in Docker CLI:"
            cat /tmp/spark-withdraw-commands.txt
            echo "withdraw $WITHDRAW_AMOUNT $WITHDRAW_ADDRESS MEDIUM"
            echo ""

            echo -e "${YELLOW}Starting Docker CLI...${NC}"
            echo "Run the following commands:"
            echo "  > withdrawalfee $WITHDRAW_AMOUNT $WITHDRAW_ADDRESS"
            echo "  > withdraw $WITHDRAW_AMOUNT $WITHDRAW_ADDRESS MEDIUM"
            echo ""

            docker run -it --rm spark-cli:latest
        else
            echo -e "${RED}Balance too low for withdrawal (need >10000 sats, have $BALANCE)${NC}"
        fi
    fi
else
    echo -e "${YELLOW}Step 5: Skipping withdrawal (no sats in wallet)${NC}"
    echo ""
    echo -e "${BLUE}To test withdrawal:${NC}"
    echo "1. Fund the wallet using one of the methods above"
    echo "2. Re-run this script"
    echo "   OR"
    echo "3. Use the Docker CLI directly:"
    echo "   docker run -it --rm spark-cli:latest"
    echo "   > initwallet \"$MNEMONIC\""
    echo "   > withdraw <amount> <bitcoin-address> MEDIUM"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo "• Wallet Mnemonic: $MNEMONIC"
echo "• Token Created: $TOKEN_NAME ($TOKEN_TICKER)"
echo "• Token ID: $TOKEN_ID"
echo "• Current Balance: $BALANCE sats"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. To check token: node check-token-metadata.js \"$MNEMONIC\""
echo "2. To check balance: node check-wallet-balance.js \"$MNEMONIC\""
echo "3. To withdraw: Use Docker CLI (see above)"
echo ""

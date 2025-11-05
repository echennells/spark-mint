#!/bin/bash

# Simple Docker-based test for Spark token and withdrawal
# Uses the Docker CLI we just built

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}==============================================
Spark Token & Withdrawal Test (Docker CLI)
==============================================${NC}\n"

echo -e "${YELLOW}This script will launch the Docker CLI with helpful commands.${NC}\n"

echo "What you can do in the CLI:"
echo "  1. Create a wallet: initwallet"
echo "  2. Fund it via Lightning or L1 Bitcoin"
echo "  3. Create a token: createtoken <name> <ticker> <decimals> <maxSupply> <isFreezable>"
echo "  4. Check balance: getbalance"
echo "  5. Withdraw to L1: withdraw <amount> <address> <FAST|MEDIUM|SLOW>"
echo ""

echo -e "${GREEN}Example workflow:${NC}"
echo "  > initwallet"
echo "  > createinvoice 10000 \"Test funding\" false"
echo "  (pay the invoice from a Lightning wallet)"
echo "  > getbalance"
echo "  > createtoken TestToken TEST 6 1000000000000 false"
echo "  > getissuertokenmetadata"
echo "  > withdraw 5000 bc1p...your_address MEDIUM"
echo ""

read -p "Press Enter to launch Docker CLI..."

docker run -it --rm -v spark-test:/app/.wallet spark-cli:latest

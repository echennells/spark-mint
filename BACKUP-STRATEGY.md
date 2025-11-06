# Spark Exit Data Backup Strategy

## The Critical Question: "What if Spark goes down?"

For **true** uncooperative exit capability, you need both:
1. ✅ **Pre-signed refund transactions** (already stored in your leaves)
2. ⚠️ **Parent node transaction data** (must be downloaded from Spark servers)

## Why You Need Backups

Your wallet stores:
- ✅ Your leaf nodes (the UTXOs you own)
- ✅ Pre-signed refund transactions with timelocks

Your wallet **does NOT** store:
- ❌ Parent node transactions
- ❌ Root node transactions
- ❌ Intermediate node transactions

**Without parent data, you cannot broadcast the recovery chain.**

## When to Backup

### ✅ Backup After These Events:

1. **First Bitcoin deposit**
   ```bash
   node claim-l1-deposit.js "mnemonic"
   node backup-exit-data.js "mnemonic"  # ← DO THIS!
   ```

2. **Receiving funds from another user**
   ```bash
   # After someone sends you sats
   node backup-exit-data.js "mnemonic"
   ```

3. **Receiving Lightning payments**
   ```bash
   # After Lightning invoice is paid
   node backup-exit-data.js "mnemonic"
   ```

4. **Periodic backup (recommended: monthly)**
   ```bash
   # Set a calendar reminder
   node backup-exit-data.js "mnemonic"
   ```

### ❌ No Backup Needed After:

1. **Sending funds** - You're spending existing leaves (no new parent dependencies)
2. **Checking balance** - Read-only operation
3. **Querying transactions** - No state change

## How to Backup

### Basic Usage

```bash
# Backup to default directory (./spark-exit-backup)
node backup-exit-data.js "your mnemonic"

# Backup to custom directory
node backup-exit-data.js "your mnemonic" "/path/to/backup"

# Backup to encrypted USB drive
node backup-exit-data.js "your mnemonic" "/Volumes/SecureUSB/spark-backup"
```

### What Gets Saved

The backup includes:

```json
{
  "wallet": "spark1...",
  "backupDate": "2024-11-06T...",
  "network": "MAINNET",
  "leaves": [
    {
      "leafId": "01982a12-26f7-79fc-b...",
      "balance": 3000,
      "sequence": 1073743824,
      "parentNodeId": "01982a12-26d1-73dd-a...",
      "transactions": [
        "03000000...",  // Root tx
        "03000000...",  // Intermediate tx(s)
        "03000000...",  // Leaf tx
        "03000000..."   // Refund tx (timelocked)
      ],
      "transactionCount": 4
    }
  ]
}
```

**Each transaction is a complete, signed Bitcoin transaction hex string.**

## Storage Best Practices

### 1. Multiple Locations

Store backups in **at least 3 places**:

```bash
# Location 1: Local encrypted backup
node backup-exit-data.js "mnemonic" "~/Documents/spark-backup-encrypted"

# Location 2: External drive
node backup-exit-data.js "mnemonic" "/Volumes/Backup/spark"

# Location 3: Cloud (encrypted!)
# Encrypt first, then upload to Dropbox/Drive/etc.
tar -czf spark-backup.tar.gz ./spark-exit-backup
gpg -c spark-backup.tar.gz  # Encrypts with password
# Upload spark-backup.tar.gz.gpg to cloud
```

### 2. Encryption

**CRITICAL**: These backups contain signed transactions that can be broadcast!

```bash
# Encrypt with GPG
gpg -c spark-exit-backup/exit-data-backup.json

# Or use 7zip with AES-256
7z a -p -mhe=on spark-backup.7z spark-exit-backup/

# Or macOS encrypted disk image
hdiutil create -encryption AES-256 -size 10m -fs HFS+ \
  -volname "SparkBackup" spark-backup.dmg
```

### 3. Versioning

Keep multiple versions with timestamps:

```bash
# Include date in backup directory
node backup-exit-data.js "mnemonic" "./backups/spark-$(date +%Y%m%d)"

# Result:
# ./backups/spark-20241106/
# ./backups/spark-20241206/
# ./backups/spark-20250106/
```

### 4. Test Your Backups

Periodically verify backups are readable:

```bash
# Check backup file exists and is valid JSON
cat spark-exit-backup/exit-data-backup.json | jq .

# Count transactions
cat spark-exit-backup/exit-data-backup.json | jq '.leaves[].transactionCount'
```

## Using the Backup for Recovery

### Scenario: Spark Servers Are Permanently Offline

**Step 1**: Load your backup

```bash
cat spark-exit-backup/exit-data-backup.json
```

**Step 2**: For each leaf, broadcast transactions in order

```javascript
const backup = require('./spark-exit-backup/exit-data-backup.json');

for (const leaf of backup.leaves) {
  console.log(`Recovering leaf: ${leaf.leafId}`);
  console.log(`Balance: ${leaf.balance} sats`);

  // Broadcast all parent transactions (root, intermediate, leaf)
  for (let i = 0; i < leaf.transactions.length - 1; i++) {
    const txHex = leaf.transactions[i];
    console.log(`Broadcasting transaction ${i + 1}...`);
    // Use bitcoin-cli sendrawtransaction or API
    await broadcastTransaction(txHex);
    await waitForConfirmation();
  }

  // Wait for timelock (2000 blocks ≈ 2 weeks)
  console.log('Waiting for timelock to expire...');
  await waitForBlocks(2000);

  // Broadcast refund transaction
  const refundTx = leaf.transactions[leaf.transactions.length - 1];
  console.log('Broadcasting refund transaction...');
  await broadcastTransaction(refundTx);

  console.log('✅ Funds recovered to L1!');
}
```

**Step 3**: Tools for broadcasting

- **Bitcoin Core**: `bitcoin-cli sendrawtransaction <hex>`
- **Blockchain.com**: POST to `https://blockchain.info/pushtx?tx=<hex>`
- **Mempool.space**: Use their broadcast tool
- **Blockstream.info**: Use their broadcast API

## Security Considerations

### What If Someone Steals Your Backup?

**Good news**: The transactions are already signed but:
- They can only broadcast the refund tx after the timelock expires
- The refund tx sends funds to YOUR Bitcoin address (derived from your keys)
- They can't change the destination address (signature would be invalid)

**However**: They COULD grief you by:
- Broadcasting parent txs early, starting the timelock countdown
- This doesn't steal your funds, but forces you into uncooperative exit

**Protection**: Encrypt your backups!

### What If You Lose Your Backup?

If Spark servers are down AND you lost your backup:
- ❌ You cannot recover your funds
- ❌ The pre-signed refund transactions are useless without parent data
- ❌ No way to construct the transaction chain

**This is why multiple backups are critical!**

### What If Backup Is Outdated?

Scenario: You have a backup from January, but you received more funds in February.

- ✅ January leaves: Can recover (you have their chains)
- ❌ February leaves: Cannot recover (no backup of their chains)

**Solution**: Backup regularly after receiving funds!

## Comparison to Other Systems

### Lightning Network
- **Backup needed**: Channel state (penalty transactions)
- **Frequency**: After every payment
- **Failure mode**: Counterparty can steal funds with old state

### Spark
- **Backup needed**: Parent node transactions
- **Frequency**: After receiving funds (not every payment!)
- **Failure mode**: Funds stuck, but cannot be stolen

**Spark is safer**: Old backups don't create penalty risk.

## Recommended Backup Schedule

| User Type | Backup Frequency | Reason |
|-----------|-----------------|---------|
| **Light users** (< 10 tx/month) | After each receive | Low overhead |
| **Moderate users** (< 100 tx/month) | Weekly | Balance convenience/safety |
| **Heavy users** (> 100 tx/month) | Daily | High activity = higher risk |
| **Businesses** | Automated after each receive | Critical infrastructure |

## Automated Backup Script

```bash
#!/bin/bash
# Add this to cron: 0 0 * * 0  (runs weekly on Sunday)

MNEMONIC="your twelve word phrase here"
BACKUP_DIR="/secure/location/spark-backup-$(date +%Y%m%d)"
ENCRYPTED_BACKUP="/secure/location/spark-backup-$(date +%Y%m%d).gpg"

# Create backup
node backup-exit-data.js "$MNEMONIC" "$BACKUP_DIR"

# Encrypt
tar -czf - "$BACKUP_DIR" | gpg -c > "$ENCRYPTED_BACKUP"

# Upload to cloud (optional)
rclone copy "$ENCRYPTED_BACKUP" remote:spark-backups/

# Clean up unencrypted
rm -rf "$BACKUP_DIR"

echo "✅ Spark backup complete: $ENCRYPTED_BACKUP"
```

## Emergency Recovery Checklist

If Spark goes down permanently:

- [ ] Find your most recent backup
- [ ] Verify backup file is readable
- [ ] Set up Bitcoin node or broadcasting service
- [ ] For each leaf in backup:
  - [ ] Broadcast root transaction
  - [ ] Wait for confirmation
  - [ ] Broadcast intermediate transactions
  - [ ] Wait for confirmations
  - [ ] Calculate timelock expiry block height
  - [ ] Wait for timelock to expire
  - [ ] Broadcast refund transaction
  - [ ] Confirm funds received on L1

## FAQ

**Q: How big are the backup files?**
A: ~1-5 KB per leaf. A wallet with 10 leaves ≈ 10-50 KB total.

**Q: Can I backup multiple wallets in one file?**
A: No, run the script separately for each wallet.

**Q: What if I backup while a transaction is pending?**
A: Wait for pending transactions to settle, then backup. Pending txs might create new leaves.

**Q: Do backups expire?**
A: No, but they become incomplete as you receive more funds.

**Q: Can I verify a backup without broadcasting?**
A: Yes! The visual demo scripts can show the transaction chains from a backup file (feature coming soon).

**Q: What about tokens?**
A: Token balances are in the same leaves. Backing up sats backs up tokens too.

## Conclusion

**Key Principle**: Uncooperative exit requires both cryptographic guarantees (pre-signed txs) AND data availability (parent nodes).

- ✅ **Pre-signed txs**: Spark provides this automatically
- ⚠️ **Parent data**: You must backup yourself

Think of it like:
- **Pre-signed txs** = Your house key (lets you get in)
- **Parent data** = Knowing where your house is (you need both!)

**Backup regularly. Your future self will thank you.**

---

**Next Steps**:
1. Run `node backup-exit-data.js "your mnemonic"` right now
2. Encrypt the backup
3. Store in 3 locations
4. Set a monthly reminder to re-backup
5. Test recovery procedure in testnet/regtest

For questions, see [L1-RECOVERY-EXPLAINED.md](./L1-RECOVERY-EXPLAINED.md)

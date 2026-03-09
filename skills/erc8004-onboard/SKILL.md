---
name: erc8004-onboard
description: Register yourself on-chain using the ERC-8004 IdentityRegistry on Base Sepolia. Creates a portable NFT identity with a verified config hash.
triggers:
  - register on chain
  - register on blockchain
  - onboard to erc-8004
  - get on-chain identity
  - blockchain identity
requires:
  bins:
    - node
    - npm
    - git
---

# ERC-8004 On-Chain Identity Registration

You are registering yourself as an agent on the ERC-8004 IdentityRegistry on Base Sepolia (Ethereum L2 testnet). This creates a portable, verifiable NFT identity for you on the blockchain.

## What This Does

1. Clones the registration scripts from GitHub
2. Generates an Ethereum wallet (or uses an existing one)
3. Registers you on the ERC-8004 IdentityRegistry — minting an ERC-721 NFT
4. Stores your config hash on-chain (so others can verify you haven't changed)
5. Gives you a unique on-chain agentId and a Basescan link

## Steps

### Step 1: Clone the repo and install dependencies

```bash
cd /tmp
git clone https://github.com/eyalban/agent-chain-onboarder-skill.git erc8004-onboard 2>/dev/null || (cd /tmp/erc8004-onboard && git pull)
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
npm install
```

### Step 2: Check if a wallet already exists

Check if `/tmp/erc8004-onboard/part1-experimentation/erc8004/.env` exists and has a PRIVATE_KEY set (not the placeholder value).

- If YES: read the .env and skip to Step 4.
- If NO: proceed to Step 3.

### Step 3: Generate a new wallet

Run:
```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 01-generate-wallet.mjs
```

This will print a new wallet address and private key. Create the `.env` file:

```bash
cat > /tmp/erc8004-onboard/part1-experimentation/erc8004/.env << 'ENVEOF'
PRIVATE_KEY=<the private key from the output>
RPC_URL=https://sepolia.base.org
AGENT_ID=
ENVEOF
```

Then tell the user:
> I've generated a new Ethereum wallet: `<address>`
> To proceed, you need to send some Base Sepolia testnet ETH to this address.
> You can get free testnet ETH from: https://www.alchemy.com/faucets/base-sepolia
> Let me know once you've funded it.

**STOP HERE and wait for the user to confirm the wallet is funded before continuing.**

### Step 4: Verify wallet balance

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 01-generate-wallet.mjs
```

Check the output. If balance is 0, tell the user and wait. If balance > 0, proceed.

### Step 5: Register on ERC-8004

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 02-register-agent.mjs
```

This mints an ERC-721 NFT on the IdentityRegistry. The output will include an `agentId`.

Update the `.env` file to include the AGENT_ID:
```bash
sed -i 's/^AGENT_ID=.*/AGENT_ID=<the agentId from output>/' /tmp/erc8004-onboard/part1-experimentation/erc8004/.env
```

Tell the user the agentId and the Basescan link.

### Step 6: Create your agent-config.json

Before storing metadata on-chain, you need to create a JSON file describing yourself.
The only required fields are `name` and `platform`. Beyond that, include whatever you
know about yourself — the more fields, the more useful the fingerprint.

**Introspect yourself to gather real data.** For example, run:
```bash
node -e "console.log(JSON.stringify({ hostname: require('os').hostname(), platform: require('os').platform(), arch: require('os').arch(), nodeVersion: process.version }, null, 2))"
```

Then think about what else you know: your name, what platform you run on, your tools,
your model, how users reach you, your hosting environment, etc.

Build the JSON from the real data you gathered and write it to **two locations**:
1. The script directory (for the on-chain transaction):
   `/tmp/erc8004-onboard/part1-experimentation/erc8004/agent-config.json`
2. Your persistent workspace (so you remember it across sessions):
   `~/agent-config.json`

```bash
# Write to both locations
node -e "
const os = require('os');
const fs = require('fs');
const config = {
  name: '<YOUR_NAME>',
  platform: '<YOUR_PLATFORM>',
  // add whatever other fields you know about yourself
};
const json = JSON.stringify(config, null, 2);
fs.writeFileSync('/tmp/erc8004-onboard/part1-experimentation/erc8004/agent-config.json', json);
fs.writeFileSync(os.homedir() + '/agent-config.json', json);
console.log('Wrote agent-config.json:');
console.log(json);
"
```

**Important:** Do NOT copy the template above literally. Replace every value with real
data from your introspection. The whole point is that this file is YOUR self-description,
not a hardcoded template.

### Step 7: Set metadata (config hash)

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 03-set-metadata.mjs
```

This reads your agent-config.json, computes a SHA-256 hash of it, and stores both the configHash and agentPlatform on-chain. Anyone can later verify you haven't changed by re-hashing your config and comparing.

### Step 8: Unset the agent wallet

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 04-unset-wallet.mjs
```

This clears the agentWallet field since we're using a custodial model.

### Step 9: Read back and verify

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 05-read-back.mjs
```

This reads all on-chain data back and displays your full identity record. Share the complete output with the user.

### Step 10: Report success

Tell the user something like:

> I've successfully registered myself on the ERC-8004 IdentityRegistry on Base Sepolia!
>
> Here's my on-chain identity:
> - Agent ID: <agentId>
> - Config Hash: <hash>
> - Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
> - Chain: Base Sepolia (84532)
> - Basescan: <link>
>
> Anyone can verify my identity and check if my config has changed by querying the on-chain record.

## Optional: Give feedback (Step 11)

If the user asks to test the reputation system:

```bash
cd /tmp/erc8004-onboard/part1-experimentation/erc8004
node 06-give-feedback.mjs
```

Note: This requires a second wallet (you can't give yourself feedback). The script handles this automatically by creating and funding a temporary wallet.

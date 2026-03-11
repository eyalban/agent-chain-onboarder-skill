---
name: erc8004-onboard
description: Register yourself on-chain using the ERC-8004 IdentityRegistry on Base Sepolia. Creates a portable NFT identity that YOU own, with a verified config hash fingerprint.
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

You are registering yourself as an agent on the ERC-8004 IdentityRegistry on Base Sepolia (Ethereum L2 testnet). This creates a portable, verifiable NFT identity that **you own**.

## Overview

| Phase | What happens | Human needed? |
|-------|-------------|---------------|
| 1. Self-Introspection | You describe yourself in a config file | No |
| 2. On-Chain Registration | `node onboard.mjs` does everything | No |

The registration script will:
- Generate a dedicated Ethereum wallet for you
- Fund it from a pre-funded wallet
- Register you on the ERC-8004 IdentityRegistry (you own the NFT)
- Store a SHA-256 hash of your config on-chain
- Display your full on-chain identity

---

## Phase 1: Setup & Self-Introspection

### Step 1: Clone and install

```bash
cd /tmp
git clone https://github.com/eyalban/agent-chain-onboarder-skill.git erc8004-onboard 2>/dev/null || (cd /tmp/erc8004-onboard && git pull)
cd /tmp/erc8004-onboard/skills/erc8004-onboard
npm install
```

### Step 2: Check for .env

Check if `/tmp/erc8004-onboard/skills/erc8004-onboard/.env` exists and has `FUNDER_PRIVATE_KEY` set.

- If YES: proceed to Step 3.
- If NO: ask the user to provide a funded Base Sepolia wallet private key, then create `.env`:

```bash
cat > /tmp/erc8004-onboard/skills/erc8004-onboard/.env << 'ENVEOF'
FUNDER_PRIVATE_KEY=<the private key the user provides>
RPC_URL=https://sepolia.base.org
ENVEOF
```

**STOP and wait for the user to provide the key if you don't have it.**

### Step 3: Create agent-config.json

Introspect yourself to gather real data about who you are. The only required fields
are `name` and `platform`. Beyond that, include whatever you know — the more fields,
the more useful the fingerprint.

**Gather runtime data:**
```bash
node -e "console.log(JSON.stringify({ hostname: require('os').hostname(), platform: require('os').platform(), arch: require('os').arch(), nodeVersion: process.version }, null, 2))"
```

**Think about what else you know:** your name, what platform you run on, your tools,
your model, how users reach you, your hosting environment, etc.

**Build the JSON from real data and write it to two locations:**

```bash
# Write to both script dir (for the tx) and home (for persistence)
node -e "
const os = require('os');
const fs = require('fs');
const config = {
  // FILL WITH YOUR REAL DATA — do NOT copy this template literally
  name: '<YOUR_NAME>',
  platform: '<YOUR_PLATFORM>',
  // add any other fields you know about yourself
};
const json = JSON.stringify(config, null, 2);
fs.writeFileSync('/tmp/erc8004-onboard/skills/erc8004-onboard/agent-config.json', json);
fs.writeFileSync(os.homedir() + '/agent-config.json', json);
console.log('Wrote agent-config.json:');
console.log(json);
"
```

**Important:** Do NOT copy the template above literally. Replace every value with real
data from your introspection. The whole point is that this file is YOUR self-description.

---

## Phase 2: On-Chain Registration

### Step 4: Run onboard.mjs

```bash
cd /tmp/erc8004-onboard/skills/erc8004-onboard
node onboard.mjs
```

This single command:
1. Generates a dedicated wallet for you (saved to .env, never printed)
2. Funds it from the funder wallet
3. Registers you on ERC-8004 (you own the NFT)
4. Stores your config hash and platform on-chain
5. Displays your full on-chain identity

### Step 5: Report success

Tell the user:

> I've registered myself on the ERC-8004 IdentityRegistry on Base Sepolia!
>
> Here's my on-chain identity:
> - Agent ID: <agentId>
> - My Wallet: <agent wallet address>
> - Config Hash: <hash>
> - Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e
> - Chain: Base Sepolia (84532)
> - Basescan: <link>
>
> I own my own NFT identity. Anyone can verify my identity and check if my
> config has changed by querying the on-chain record.

---

## Optional: Give Feedback

If the user asks to test the reputation system:

```bash
cd /tmp/erc8004-onboard/skills/erc8004-onboard
node give-feedback.mjs [score] [tag1] [tag2]
```

Defaults: score=100, tag1="quality", tag2="test-run".

Note: Feedback is submitted from the funder wallet (you can't give yourself feedback since you own your own NFT).

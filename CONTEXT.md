# HW4 Context File — Agentic Infrastructure Exploration

## Student
Eyal Ban (eyaltrueman@gmail.com)
MIT Media Lab — AI Agents Class

## Assignment Overview
Homework 4: Agentic Infrastructure Exploration (Individual)

### Deliverables
1. **1–3 page PDF** covering:
   - Topic of interest and why it matters
   - Existing players / landscape (open-source + notable projects)
   - One open-source protocol/framework you ran locally
   - What you learned from using it (what worked, what was confusing, limitations/tradeoffs)
   - Why this area interests you
2. **Join39 app** — create an app on join39.org and submit the app name. We have NOT yet explored what Join39 is or what it supports. Eyal needs to provide details about the platform before we can decide on an app idea.

Full assignment text: https://join39.org/apps (for app submission)
Developer docs: join39.org/developers

---

## Chosen Topic: Agent Identity, Trust & Verifiable Behavior Infrastructure

### Why This Topic
Eyal is building a startup called **Magic** focused on tokenizing agents (agent as an asset/NFT — ownership, licensing, royalties, governance). The original idea of "just mint an agent NFT" was too narrow for this assignment. We reframed the topic toward the broader infrastructure problem: **how do agents get identified, registered, discovered, and trusted?**

This reframing maps directly to the "registries/discovery" category from the assignment, while still feeding into Magic's long-term thesis.

---

## Landscape Research (Completed)

### The Core Infrastructure Problem
As agents proliferate, the ecosystem needs to answer:
- Who made this agent?
- What can it do?
- Is it authorized to act on my behalf?
- Can I verify its past behavior?
- Has its code/behavior changed since I last trusted it?

### Protocols & Frameworks Explored

#### 1. Fetch.ai uAgents Framework
- **What it is:** Python library that gives each agent a crypto keypair identity, a REST endpoint, and registers it on the Almanac (a smart contract on Fetch.ai's blockchain acting as decentralized DNS for agents).
- **What it solves:** Discovery (Almanac registry), identity (crypto keypairs), interoperability (shared Protocol/Model schemas), cryptographic message signing.
- **Critical limitations we identified:**
  - **Ownership = seed phrase.** Whoever has the seed controls everything. No separation between ownership, operation, and delegation.
  - **No behavior verification.** The Almanac stores address + endpoint + protocol names only. No code hash, no behavior snapshot. Creator can completely rewrite agent logic, restart with same seed, and no one would know.
  - **No reputation system.** No track record, no attestations, no way to verify "this flight broker agent is legit."
  - **Coupled to Fetch.ai's chain.**
- **Repo:** https://github.com/fetchai/uAgents
- **Status:** Open source, actively maintained, pip installable.

#### 2. Phala Network dstack (TEE-based verifiable execution)
- **What it is:** Runs agents inside Trusted Execution Environments (Intel TDX). Hardware produces a remote attestation proof containing a cryptographic hash of the exact code running in the enclave.
- **What it solves:** The "did the code change?" problem. If creator modifies agent code, the hash changes and attestation won't match.
- **Limitation:** Requires specific hardware (TEE-capable).
- **Repo:** https://github.com/Phala-Network/dstack (Apache 2.0)
- **Also accepted into Linux Foundation Confidential Computing Consortium.**

#### 3. ERC-8004 (On-chain trust infrastructure standard)
- **What it is:** Ethereum standard (live on mainnet Jan 2026) defining three on-chain registries:
  - **Identity Registry** — ERC-721 NFT as agent's portable identity
  - **Reputation Registry** — clients post feedback scores after interactions
  - **Validation Registry** — hooks for third-party validators to attest to behavior (TEE proofs plug in here)
- **What it solves:** Social/economic trust layer. Identity is an NFT (transferable!), reputation is on-chain, validation is extensible.
- **Repos:**
  - Official contracts: https://github.com/erc-8004/erc-8004-contracts
  - Phala's combined TEE + ERC-8004 agent: https://github.com/Phala-Network/erc-8004-tee-agent
  - Example project: https://github.com/vistara-apps/erc-8004-example

#### 4. VERA Protocol (mentioned but NOT verified as open source)
- Claims cryptographic Proof of Execution (PoE).
- Blog post: https://berlinailabs.de/blog/vera-protocol-launch.html
- **No public GitHub repo found. Do NOT rely on this for the assignment.**

### Landscape Summary Table

| Approach | What it proves | Limitation |
|---|---|---|
| uAgents/Almanac | "Same entity" (identity) | Nothing about behavior |
| Phala/TEE | "Same code" (code integrity) | Requires specific hardware |
| ERC-8004 | "Others vouch for it" (reputation + validation) | Trust is social, not cryptographic |

**Key insight:** No single protocol solves the full trust stack. Real agent trust likely needs identity + code verification + reputation composed together.

---

## Decision: What to Run Locally

**Phala ERC-8004 TEE Agent** (https://github.com/Phala-Network/erc-8004-tee-agent)
- Combines TEE attestation with ERC-8004 on-chain identity/reputation/validation.
- This is the open-source thing Eyal will run locally and write about.
- Has NOT been set up yet. This is the next step.

---

## Connection to Magic (Startup)

The gap Eyal identified through this research:
- uAgents proves identity but not behavior, and ownership is just a shared secret (seed phrase) with no transferability.
- ERC-8004 makes agent identity an NFT — transferable, with on-chain reputation.
- Phala proves code integrity via hardware attestation.
- **Magic's thesis:** A token-based identity layer could make agent ownership transferable, verifiable, and separable from operation. The NFT becomes not just proof of ownership but proof of trustworthiness.

---

## What's Left To Do

1. **Run Phala ERC-8004 TEE Agent locally** and document the experience (what worked, what was confusing, limitations).
2. **Figure out Join39** — Eyal needs to share what the platform is / what dev docs say so we can decide on an app idea. ChatGPT suggested "Agent Gallery" but we haven't validated this against what Join39 actually supports.
3. **Write the 1–3 page PDF** covering all the above.
4. **Submit the Join39 app name.**

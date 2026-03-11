/**
 * ERC-8004 On-Chain Identity Registration — Consolidated Script
 *
 * Does everything in one shot:
 *   1. Generate agent wallet (or reuse existing)
 *   2. Fund agent wallet from funder
 *   3. Register agent on IdentityRegistry (agent owns its own NFT)
 *   4. Set metadata (configHash + agentPlatform) from agent-config.json
 *   5. Read back and display full on-chain identity
 *
 * Idempotent — re-runs skip already-completed steps.
 *
 * Required .env:
 *   FUNDER_PRIVATE_KEY=0x...   (user's pre-funded wallet)
 *
 * Required file:
 *   agent-config.json          (in script dir or ~/agent-config.json)
 */

import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { homedir } from "os";
import "dotenv/config";

import {
  provider,
  getFunderSigner,
  getIdentityRegistry,
  basescanTx,
  basescanAddress,
  IDENTITY_REGISTRY_ADDRESS,
} from "./lib/contracts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = join(__dirname, ".env");
const CONFIG_PATH = join(__dirname, "agent-config.json");
const HOME_CONFIG_PATH = join(homedir(), "agent-config.json");
const HOME_WALLET_PATH = join(homedir(), "agent-wallet.json");

// Minimum ETH to fund the agent wallet with
const FUND_AMOUNT = ethers.parseEther("0.002");
// Minimum balance before we skip funding
const MIN_BALANCE = ethers.parseEther("0.001");

// ─── Helpers ───────────────────────────────────────────────────────

function readEnv() {
  if (!existsSync(ENV_PATH)) return {};
  const lines = readFileSync(ENV_PATH, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

function updateEnv(key, value) {
  let content = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf-8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content = content.trimEnd() + `\n${key}=${value}\n`;
  }
  writeFileSync(ENV_PATH, content);
  process.env[key] = value;
}

function loadAgentConfig() {
  // Check script directory first, then home directory
  if (existsSync(CONFIG_PATH)) {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  }
  if (existsSync(HOME_CONFIG_PATH)) {
    // Copy to local dir for consistency
    copyFileSync(HOME_CONFIG_PATH, CONFIG_PATH);
    return JSON.parse(readFileSync(HOME_CONFIG_PATH, "utf-8"));
  }
  console.error("❌ agent-config.json not found.");
  console.error("   Looked in:", CONFIG_PATH);
  console.error("   Looked in:", HOME_CONFIG_PATH);
  console.error("\nCreate this file with your agent's real config. Required fields: name, platform");
  console.error("Example:", JSON.stringify({ name: "MyAgent", platform: "openclaw" }, null, 2));
  process.exit(1);
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║      ERC-8004 On-Chain Identity Registration        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  // ── Step 0: Validate prerequisites ──────────────────────────────

  if (!process.env.FUNDER_PRIVATE_KEY) {
    console.error("❌ FUNDER_PRIVATE_KEY not set in .env");
    console.error("   This should be a pre-funded wallet on Base Sepolia.");
    process.exit(1);
  }

  const agentConfig = loadAgentConfig();
  if (!agentConfig.name || !agentConfig.platform) {
    console.error("❌ agent-config.json must have 'name' and 'platform' fields.");
    process.exit(1);
  }

  const funder = getFunderSigner();
  console.log("Funder wallet:", funder.address);

  const funderBalance = await provider.getBalance(funder.address);
  console.log("Funder balance:", ethers.formatEther(funderBalance), "ETH");
  if (funderBalance < FUND_AMOUNT) {
    console.error("\n❌ Funder wallet doesn't have enough ETH.");
    console.error("   Need at least", ethers.formatEther(FUND_AMOUNT), "ETH");
    console.error("   Fund it from a faucet: https://console.optimism.io/faucet");
    process.exit(1);
  }

  // ── Step 1: Generate agent wallet ───────────────────────────────

  console.log("\n── Step 1: Agent Wallet ──────────────────────────────\n");

  let agentWallet;
  if (process.env.AGENT_PRIVATE_KEY) {
    agentWallet = new ethers.Wallet(process.env.AGENT_PRIVATE_KEY, provider);
    console.log("✓ Using existing agent wallet:", agentWallet.address);
  } else {
    agentWallet = ethers.Wallet.createRandom().connect(provider);
    updateEnv("AGENT_PRIVATE_KEY", agentWallet.privateKey);

    // Save address (not key) to home for persistence
    const walletInfo = {
      address: agentWallet.address,
      chain: "base-sepolia",
      chainId: 84532,
      created: new Date().toISOString(),
    };
    writeFileSync(HOME_WALLET_PATH, JSON.stringify(walletInfo, null, 2));

    console.log("✓ Generated new agent wallet:", agentWallet.address);
    console.log("  Saved to .env and", HOME_WALLET_PATH);
  }

  // ── Step 2: Fund agent wallet ───────────────────────────────────

  console.log("\n── Step 2: Fund Agent Wallet ─────────────────────────\n");

  const agentBalance = await provider.getBalance(agentWallet.address);
  console.log("Agent balance:", ethers.formatEther(agentBalance), "ETH");

  if (agentBalance < MIN_BALANCE) {
    console.log("Funding agent wallet with", ethers.formatEther(FUND_AMOUNT), "ETH...");
    const fundTx = await funder.sendTransaction({
      to: agentWallet.address,
      value: FUND_AMOUNT,
    });
    console.log("Tx:", fundTx.hash);
    await fundTx.wait();
    const newBalance = await provider.getBalance(agentWallet.address);
    console.log("✓ Funded. New balance:", ethers.formatEther(newBalance), "ETH");
  } else {
    console.log("✓ Already funded. Skipping.");
  }

  // ── Step 3: Register on ERC-8004 ────────────────────────────────

  console.log("\n── Step 3: Register Agent ────────────────────────────\n");

  const identityRegistry = getIdentityRegistry(agentWallet);
  let agentId;

  if (process.env.AGENT_ID) {
    agentId = process.env.AGENT_ID;
    console.log("✓ Already registered. Agent ID:", agentId);
  } else {
    const agentURI = process.env.AGENT_URI || "https://github.com/eyalban/agent-chain-onboarder-skill";
    console.log("Agent URI:", agentURI);
    console.log("Registering...");

    const tx = await identityRegistry["register(string)"](agentURI);
    console.log("Tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("✓ Confirmed in block:", receipt.blockNumber);

    // Parse Registered event for agentId
    const registeredEvent = receipt.logs
      .map((log) => {
        try { return identityRegistry.interface.parseLog(log); }
        catch { return null; }
      })
      .find((parsed) => parsed && parsed.name === "Registered");

    if (!registeredEvent) {
      console.error("❌ Could not parse Registered event. Check Basescan:", basescanTx(tx.hash));
      process.exit(1);
    }

    agentId = registeredEvent.args.agentId.toString();
    updateEnv("AGENT_ID", agentId);
    console.log("✓ Agent ID:", agentId);
    console.log("  Owner:", registeredEvent.args.owner);
    console.log("  Basescan:", basescanTx(tx.hash));
  }

  // ── Step 4: Set metadata ────────────────────────────────────────

  console.log("\n── Step 4: Set Metadata ──────────────────────────────\n");

  const canonical = JSON.stringify(agentConfig);
  const configHash = createHash("sha256").update(canonical).digest("hex");

  console.log("Agent config:", canonical);
  console.log("Config hash:", configHash);

  // Check if configHash already matches on-chain
  const existingHashBytes = await getIdentityRegistry(provider).getMetadata(agentId, "configHash");
  const existingHash = ethers.dataLength(existingHashBytes) > 0
    ? ethers.toUtf8String(existingHashBytes)
    : "";

  if (existingHash === configHash) {
    console.log("\n✓ configHash already matches on-chain. Skipping metadata transactions.");
  } else {
    if (existingHash) {
      console.log("\nOn-chain hash differs — updating...");
    }

    // Get nonce explicitly to avoid race conditions between consecutive txs
    let nonce = await agentWallet.getNonce();

    console.log("\n1/2 Setting configHash...");
    const tx1 = await identityRegistry.setMetadata(
      agentId,
      "configHash",
      ethers.toUtf8Bytes(configHash),
      { nonce: nonce++ }
    );
    console.log("   Tx:", tx1.hash);
    await tx1.wait();
    console.log("   ✓ Confirmed");

    console.log("2/2 Setting agentPlatform...");
    const tx2 = await identityRegistry.setMetadata(
      agentId,
      "agentPlatform",
      ethers.toUtf8Bytes(agentConfig.platform),
      { nonce: nonce++ }
    );
    console.log("   Tx:", tx2.hash);
    await tx2.wait();
    console.log("   ✓ Confirmed");
  }

  // ── Step 5: Read back and display ───────────────────────────────

  console.log("\n── Step 5: On-Chain Identity ─────────────────────────\n");

  const readRegistry = getIdentityRegistry(provider);
  const owner = await readRegistry.ownerOf(agentId);
  const tokenURI = await readRegistry.tokenURI(agentId);
  const onChainWallet = await readRegistry.getAgentWallet(agentId);

  const hashBytes = await readRegistry.getMetadata(agentId, "configHash");
  const platformBytes = await readRegistry.getMetadata(agentId, "agentPlatform");
  const finalHash = ethers.dataLength(hashBytes) > 0 ? ethers.toUtf8String(hashBytes) : "(not set)";
  const finalPlatform = ethers.dataLength(platformBytes) > 0 ? ethers.toUtf8String(platformBytes) : "(not set)";

  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│            ERC-8004 Agent Identity                  │");
  console.log("├─────────────────────────────────────────────────────┤");
  console.log("│ Agent ID:       ", agentId);
  console.log("│ Name:           ", agentConfig.name);
  console.log("│ Token URI:      ", tokenURI);
  console.log("│ Owner:          ", owner);
  console.log("│ Agent Wallet:   ", onChainWallet);
  console.log("│ Config Hash:    ", finalHash);
  console.log("│ Platform:       ", finalPlatform);
  console.log("│ Registry:       ", IDENTITY_REGISTRY_ADDRESS);
  console.log("│ Chain:           Base Sepolia (84532)");
  console.log("└─────────────────────────────────────────────────────┘");

  console.log("\n🔗 Basescan:");
  console.log("   Registry:", basescanAddress(IDENTITY_REGISTRY_ADDRESS));
  console.log("   Owner:   ", basescanAddress(owner));

  // Machine-readable summary
  const summary = {
    agentId,
    name: agentConfig.name,
    owner,
    agentWallet: onChainWallet,
    configHash: finalHash,
    platform: finalPlatform,
    tokenURI,
    chain: "base-sepolia",
    chainId: 84532,
    registry: IDENTITY_REGISTRY_ADDRESS,
    basescan: basescanAddress(IDENTITY_REGISTRY_ADDRESS),
  };

  console.log("\n--- MACHINE-READABLE OUTPUT ---");
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

/**
 * Step 3: Set on-chain metadata for the registered agent.
 *
 * Stores:
 * - configHash: SHA-256 of the agent's configuration (for integrity verification)
 * - agentPlatform: "openclaw" (to identify where the agent runs)
 *
 * This demonstrates how ERC-8004 metadata can be used to fingerprint an agent's
 * behavior/config so anyone can later verify it hasn't changed.
 */

import { createHash } from "crypto";
import { ethers } from "ethers";
import { getSigner, getIdentityRegistry, basescanTx } from "./lib/contracts.mjs";

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env. Run 02-register-agent.mjs first.");

  const signer = getSigner();
  const identityRegistry = getIdentityRegistry(signer);

  console.log("=== Setting Metadata for Agent", agentId, "===\n");

  // Simulate agent config — in production this would be fetched from the agent's API
  // For our OpenClaw agent, we create a representative config object
  const agentConfig = {
    name: "Foxtail",
    platform: "openclaw",
    hosting: "hostinger-vps",
    channels: ["telegram"],
    tools: ["exec", "chat"],
    model: "gpt-4o-mini",
    version: "1.0.0",
  };

  const configJson = JSON.stringify(agentConfig);
  const configHash = createHash("sha256").update(configJson).digest("hex");

  console.log("Agent config:", configJson);
  console.log("Config hash (SHA-256):", configHash);

  // Transaction 1: Store configHash
  console.log("\n1/2 Setting configHash...");
  const tx1 = await identityRegistry.setMetadata(
    agentId,
    "configHash",
    ethers.toUtf8Bytes(configHash)
  );
  console.log("   Tx:", tx1.hash);
  const receipt1 = await tx1.wait();
  console.log("   ✅ Confirmed in block:", receipt1.blockNumber);

  // Transaction 2: Store agentPlatform
  console.log("\n2/2 Setting agentPlatform...");
  const tx2 = await identityRegistry.setMetadata(
    agentId,
    "agentPlatform",
    ethers.toUtf8Bytes("openclaw")
  );
  console.log("   Tx:", tx2.hash);
  const receipt2 = await tx2.wait();
  console.log("   ✅ Confirmed in block:", receipt2.blockNumber);

  console.log("\n=== Metadata Set Successfully ===");
  console.log("Basescan:", basescanTx(tx1.hash));
}

main().catch(console.error);

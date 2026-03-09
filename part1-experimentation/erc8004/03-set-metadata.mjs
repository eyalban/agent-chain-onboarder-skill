/**
 * Step 3: Set on-chain metadata for the registered agent.
 *
 * Reads the agent's self-reported config from agent-config.json (same directory),
 * hashes it, and stores both the configHash and agentPlatform on-chain.
 *
 * The agent is responsible for creating agent-config.json about itself before
 * running this script. This keeps the script generic — any agent on any platform
 * can use it.
 *
 * Required fields in agent-config.json: name, platform
 * All other fields are optional and will be included in the hash.
 */

import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { getSigner, getIdentityRegistry, basescanTx } from "./lib/contracts.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = join(__dirname, "agent-config.json");

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env. Run 02-register-agent.mjs first.");

  // Load agent config from file
  if (!existsSync(CONFIG_PATH)) {
    console.error("❌ agent-config.json not found at:", CONFIG_PATH);
    console.error("\nThe agent should create this file with its own config, e.g.:");
    console.error(JSON.stringify({ name: "MyAgent", platform: "openclaw", model: "gpt-4o-mini" }, null, 2));
    process.exit(1);
  }

  const configJson = readFileSync(CONFIG_PATH, "utf-8");
  const agentConfig = JSON.parse(configJson);

  if (!agentConfig.name || !agentConfig.platform) {
    throw new Error("agent-config.json must have at least 'name' and 'platform' fields.");
  }

  // Deterministic hash: re-stringify to remove formatting differences
  const canonical = JSON.stringify(agentConfig);
  const configHash = createHash("sha256").update(canonical).digest("hex");

  const signer = getSigner();
  const identityRegistry = getIdentityRegistry(signer);

  console.log("=== Setting Metadata for Agent", agentId, "===\n");
  console.log("Agent config:", canonical);
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
    ethers.toUtf8Bytes(agentConfig.platform)
  );
  console.log("   Tx:", tx2.hash);
  const receipt2 = await tx2.wait();
  console.log("   ✅ Confirmed in block:", receipt2.blockNumber);

  console.log("\n=== Metadata Set Successfully ===");
  console.log("Basescan:", basescanTx(tx1.hash));
}

main().catch(console.error);

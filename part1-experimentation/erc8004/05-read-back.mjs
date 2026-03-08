/**
 * Step 5: Read back all on-chain data for the registered agent.
 *
 * This is a read-only step (no gas needed). It demonstrates that all the
 * identity, metadata, and ownership information is publicly queryable by anyone.
 *
 * This is exactly what a verifier would do to check an agent's identity.
 */

import { ethers } from "ethers";
import { provider, getIdentityRegistry, basescanAddress, IDENTITY_REGISTRY_ADDRESS } from "./lib/contracts.mjs";

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env. Run 02-register-agent.mjs first.");

  const identityRegistry = getIdentityRegistry(provider);

  console.log("=== On-Chain Identity for Agent", agentId, "===\n");

  // Read all fields
  const owner = await identityRegistry.ownerOf(agentId);
  const tokenURI = await identityRegistry.tokenURI(agentId);
  const agentWallet = await identityRegistry.getAgentWallet(agentId);

  // Read custom metadata
  const configHashBytes = await identityRegistry.getMetadata(agentId, "configHash");
  const platformBytes = await identityRegistry.getMetadata(agentId, "agentPlatform");

  const configHash = ethers.dataLength(configHashBytes) > 0 ? ethers.toUtf8String(configHashBytes) : "(not set)";
  const platform = ethers.dataLength(platformBytes) > 0 ? ethers.toUtf8String(platformBytes) : "(not set)";

  console.log("┌─────────────────────────────────────────────────┐");
  console.log("│            ERC-8004 Agent Identity              │");
  console.log("├─────────────────────────────────────────────────┤");
  console.log("│ Agent ID:       ", agentId);
  console.log("│ Token URI:      ", tokenURI);
  console.log("│ Owner:          ", owner);
  console.log("│ Agent Wallet:   ", agentWallet);
  console.log("│ Config Hash:    ", configHash);
  console.log("│ Platform:       ", platform);
  console.log("│ Registry:       ", IDENTITY_REGISTRY_ADDRESS);
  console.log("│ Chain:           Base Sepolia (84532)");
  console.log("└─────────────────────────────────────────────────┘");

  console.log("\n🔗 View on Basescan:");
  console.log("   Registry:", basescanAddress(IDENTITY_REGISTRY_ADDRESS));
  console.log("   Owner:   ", basescanAddress(owner));

  // Verify the config hash
  console.log("\n=== Integrity Check ===");
  if (configHash !== "(not set)") {
    console.log("To verify this agent hasn't changed, re-hash the agent's config");
    console.log("and compare with the on-chain hash:", configHash);
  } else {
    console.log("No configHash stored. Run 03-set-metadata.mjs first.");
  }
}

main().catch(console.error);

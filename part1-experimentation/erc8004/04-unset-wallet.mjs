/**
 * Step 4: Unset the agentWallet field.
 *
 * When register() is called, agentWallet is automatically set to msg.sender
 * (our wallet). Since this is a custodial setup and the agent doesn't actually
 * transact on-chain, we clear this field to avoid confusion.
 *
 * In ERC-8004, agentWallet is meant to be the agent's verified receiving address.
 * Clearing it signals "this agent doesn't have an operational wallet yet."
 */

import { getSigner, getIdentityRegistry, basescanTx } from "./lib/contracts.mjs";

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env. Run 02-register-agent.mjs first.");

  const signer = getSigner();
  const identityRegistry = getIdentityRegistry(signer);

  console.log("=== Unsetting agentWallet for Agent", agentId, "===\n");

  // Check current agentWallet before
  const walletBefore = await identityRegistry.getAgentWallet(agentId);
  console.log("agentWallet before:", walletBefore);

  // Unset it
  console.log("\nSending unsetAgentWallet transaction...");
  const tx = await identityRegistry.unsetAgentWallet(agentId);
  console.log("Tx:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);

  // Verify
  const walletAfter = await identityRegistry.getAgentWallet(agentId);
  console.log("\nagentWallet after:", walletAfter);
  console.log("Basescan:", basescanTx(tx.hash));
}

main().catch(console.error);

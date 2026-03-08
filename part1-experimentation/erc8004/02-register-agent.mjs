/**
 * Step 2: Register an agent on the ERC-8004 IdentityRegistry on Base Sepolia.
 *
 * This mints an ERC-721 NFT representing the agent's on-chain identity.
 * The agentURI points to a JSON file describing the agent.
 *
 * For this experiment, we're registering an OpenClaw agent hosted on a VPS.
 */

import { ethers } from "ethers";
import { getSigner, getIdentityRegistry, basescanTx } from "./lib/contracts.mjs";

async function main() {
  const signer = getSigner();
  const identityRegistry = getIdentityRegistry(signer);

  console.log("=== Registering Agent on ERC-8004 ===");
  console.log("Wallet:", signer.address);

  // Agent URI — describes the agent. For a real deployment, this would be
  // an IPFS or HTTPS URL pointing to a registration JSON file.
  // For this experiment, we use a descriptive placeholder.
  const agentURI = "https://join39.org/api/eyalban/agentfacts.json";

  console.log("Agent URI:", agentURI);
  console.log("\nSending register transaction...");

  // Use the register(string) overload — mints NFT with agentURI
  const tx = await identityRegistry["register(string)"](agentURI);
  console.log("Tx hash:", tx.hash);
  console.log("Waiting for confirmation...");

  const receipt = await tx.wait();
  console.log("✅ Confirmed in block:", receipt.blockNumber);
  console.log("Basescan:", basescanTx(tx.hash));

  // Parse the Registered event to get the agentId
  const registeredEvent = receipt.logs
    .map((log) => {
      try {
        return identityRegistry.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "Registered");

  if (registeredEvent) {
    const agentId = registeredEvent.args.agentId;
    console.log("\n=== Agent Registered! ===");
    console.log("Agent ID:", agentId.toString());
    console.log("Owner:  ", registeredEvent.args.owner);
    console.log("\n📝 Add this to your .env file:");
    console.log(`AGENT_ID=${agentId.toString()}`);
  } else {
    console.log("\n⚠️  Could not parse Registered event. Check Basescan for details.");
  }
}

main().catch(console.error);

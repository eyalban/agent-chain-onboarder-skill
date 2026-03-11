/**
 * Give feedback on an agent via the ERC-8004 ReputationRegistry.
 *
 * The ReputationRegistry prevents self-feedback — you can't give feedback
 * on an agent you own. Since the agent owns its own NFT, the FUNDER wallet
 * is used to submit the feedback.
 *
 * Usage: node give-feedback.mjs [score] [tag1] [tag2]
 *   score  - 0 to 100 (default: 100)
 *   tag1   - first tag (default: "quality")
 *   tag2   - second tag (default: "test-run")
 */

import { ethers } from "ethers";
import {
  provider,
  getFunderSigner,
  getReputationRegistry,
  basescanTx,
} from "./lib/contracts.mjs";

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env. Run onboard.mjs first.");

  // Parse optional CLI args
  const score = parseInt(process.argv[2]) || 100;
  const tag1 = process.argv[3] || "quality";
  const tag2 = process.argv[4] || "test-run";

  // Use funder wallet for feedback (can't self-feedback as agent owner)
  const funder = getFunderSigner();

  console.log("=== Giving Feedback on Agent", agentId, "===\n");
  console.log("Feedback wallet:", funder.address);

  const reputationRegistry = getReputationRegistry(funder);

  console.log("\nSubmitting feedback...");
  console.log("  Value:   ", score, "(out of 100)");
  console.log("  Tag1:    ", tag1);
  console.log("  Tag2:    ", tag2);

  const tx = await reputationRegistry.giveFeedback(
    agentId,
    score,
    0,                         // valueDecimals: 0 (integer score)
    tag1,
    tag2,
    "",                        // endpoint (empty)
    "",                        // feedbackURI (empty)
    ethers.ZeroHash            // feedbackHash (empty)
  );
  console.log("Tx:", tx.hash);

  const receipt = await tx.wait();
  console.log("✅ Feedback submitted in block:", receipt.blockNumber);
  console.log("Basescan:", basescanTx(tx.hash));

  // Read it back
  console.log("\n=== Reading Feedback Back ===");
  const reputationRead = getReputationRegistry(provider);

  const lastIndex = await reputationRead.getLastIndex(agentId, funder.address);
  const [value, valueDecimals, readTag1, readTag2, isRevoked] = await reputationRead.readFeedback(
    agentId,
    funder.address,
    lastIndex
  );

  console.log("Value:         ", value.toString());
  console.log("Value Decimals:", valueDecimals.toString());
  console.log("Tag1:          ", readTag1);
  console.log("Tag2:          ", readTag2);
  console.log("Revoked:       ", isRevoked);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});

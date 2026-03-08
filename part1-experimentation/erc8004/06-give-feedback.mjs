/**
 * Step 6: Give feedback on an agent via the ERC-8004 ReputationRegistry.
 *
 * IMPORTANT: The ReputationRegistry prevents self-feedback — you can't give
 * feedback on an agent you own. This requires a SECOND wallet.
 *
 * This script generates a second wallet, funds it from the primary wallet,
 * and then submits feedback on the agent.
 *
 * If you don't have enough ETH for a second wallet, this will skip the
 * on-chain transaction and just demonstrate the concept.
 */

import { ethers } from "ethers";
import {
  provider,
  getSigner,
  getReputationRegistry,
  basescanTx,
} from "./lib/contracts.mjs";

async function main() {
  const agentId = process.env.AGENT_ID;
  if (!agentId) throw new Error("AGENT_ID not set in .env");

  const primarySigner = getSigner();

  console.log("=== Giving Feedback on Agent", agentId, "===\n");
  console.log("Primary wallet (agent owner):", primarySigner.address);

  // Generate a second wallet for feedback (can't self-feedback)
  const feedbackWallet = ethers.Wallet.createRandom().connect(provider);
  console.log("Feedback wallet (new):       ", feedbackWallet.address);

  // Fund the feedback wallet with a small amount of ETH
  const fundAmount = ethers.parseEther("0.001");
  const primaryBalance = await provider.getBalance(primarySigner.address);

  if (primaryBalance < fundAmount * 2n) {
    console.log("\n⚠️  Primary wallet doesn't have enough ETH to fund a second wallet.");
    console.log("   Skipping on-chain feedback. Here's what WOULD happen:");
    console.log("   - Second wallet calls giveFeedback(agentId, 85, 0, 'quality', 'test', ...)");
    console.log("   - ReputationRegistry stores: value=85, tag1='quality', tag2='test'");
    console.log("   - Anyone can read it with readFeedback() or getSummary()");
    return;
  }

  console.log("\nFunding feedback wallet...");
  const fundTx = await primarySigner.sendTransaction({
    to: feedbackWallet.address,
    value: fundAmount,
  });
  await fundTx.wait();
  console.log("✅ Funded with", ethers.formatEther(fundAmount), "ETH");

  // Give feedback from the second wallet
  const reputationRegistry = getReputationRegistry(feedbackWallet);

  console.log("\nSubmitting feedback...");
  console.log("  Value:    85 (out of 100)");
  console.log("  Tag1:     quality");
  console.log("  Tag2:     test-run");

  const tx = await reputationRegistry.giveFeedback(
    agentId,
    85,                        // value: 85/100
    0,                         // valueDecimals: 0 (integer score)
    "quality",                 // tag1
    "test-run",                // tag2
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

  const [value, valueDecimals, tag1, tag2, isRevoked] = await reputationRead.readFeedback(
    agentId,
    feedbackWallet.address,
    1 // first feedback from this client
  );

  console.log("Value:         ", value.toString());
  console.log("Value Decimals:", valueDecimals.toString());
  console.log("Tag1:          ", tag1);
  console.log("Tag2:          ", tag2);
  console.log("Revoked:       ", isRevoked);
}

main().catch(console.error);

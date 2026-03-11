/**
 * GET /api/lookup?agentId=1759 — Look up an ERC-8004 agent's on-chain identity
 *
 * Read-only — no gas, no wallet needed. Returns the full identity card.
 */

import { readFileSync } from "fs";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const BASESCAN = "https://sepolia.basescan.org";

const identityAbi = JSON.parse(
  readFileSync(join(__dirname, "..", "abis", "IdentityRegistry.json"), "utf-8")
);

const provider = new ethers.JsonRpcProvider(RPC_URL);
const registry = new ethers.Contract(IDENTITY_REGISTRY_ADDRESS, identityAbi, provider);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const { agentId } = req.query;

  if (!agentId) {
    return res.status(400).json({
      error: "Missing required query parameter: agentId",
      usage: "GET /api/lookup?agentId=1759",
    });
  }

  try {
    const owner = await registry.ownerOf(agentId);
    const tokenURI = await registry.tokenURI(agentId);
    const agentWallet = await registry.getAgentWallet(agentId);

    const hashBytes = await registry.getMetadata(agentId, "configHash");
    const platformBytes = await registry.getMetadata(agentId, "agentPlatform");

    const configHash = ethers.dataLength(hashBytes) > 0
      ? ethers.toUtf8String(hashBytes)
      : null;
    const platform = ethers.dataLength(platformBytes) > 0
      ? ethers.toUtf8String(platformBytes)
      : null;

    return res.status(200).json({
      agentId,
      owner,
      agentWallet,
      tokenURI,
      configHash,
      platform,
      chain: "base-sepolia",
      chainId: 84532,
      registry: IDENTITY_REGISTRY_ADDRESS,
      basescan: `${BASESCAN}/address/${agentWallet}`,
    });
  } catch (err) {
    if (err.message.includes("nonexistent token") || err.message.includes("invalid token")) {
      return res.status(404).json({ error: `Agent ${agentId} not found on-chain.` });
    }
    return res.status(500).json({ error: err.message });
  }
}

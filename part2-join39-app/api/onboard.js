/**
 * POST /api/onboard — Full ERC-8004 on-chain agent registration
 *
 * Accepts agent config, creates a wallet, funds it, registers on-chain,
 * sets metadata, and returns the complete identity card.
 *
 * Required env vars (set in Vercel dashboard):
 *   FUNDER_PRIVATE_KEY — pre-funded wallet on Base Sepolia
 *   RPC_URL (optional) — defaults to https://sepolia.base.org
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";
import { ethers } from "ethers";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ──────────────────────────────────────────────────────────

const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const AGENT_URI = "https://github.com/eyalban/agent-chain-onboarder-skill";
const FUND_AMOUNT = ethers.parseEther("0.002");
const BASESCAN = "https://sepolia.basescan.org";

// ── Load ABI (once, at cold start) ─────────────────────────────────

const identityAbi = JSON.parse(
  readFileSync(join(__dirname, "..", "abis", "IdentityRegistry.json"), "utf-8")
);

// ── Shared provider ─────────────────────────────────────────────────

const provider = new ethers.JsonRpcProvider(RPC_URL);

// ── Handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS headers for cross-origin calls
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    // ── Validate funder ───────────────────────────────────────────

    const funderKey = process.env.FUNDER_PRIVATE_KEY;
    if (!funderKey) {
      return res.status(500).json({ error: "Server misconfigured: no funder wallet." });
    }
    const funder = new ethers.Wallet(funderKey, provider);

    const funderBalance = await provider.getBalance(funder.address);
    if (funderBalance < FUND_AMOUNT) {
      return res.status(503).json({
        error: "Funder wallet is out of testnet ETH. Try again later.",
      });
    }

    // ── Parse input ───────────────────────────────────────────────

    const { name, platform, model, description, ...extra } = req.body || {};

    if (!name || !platform) {
      return res.status(400).json({
        error: "Missing required fields: name, platform",
        usage: {
          name: "Your agent name (string, required)",
          platform: "Your platform — linux, darwin, windows, etc. (string, required)",
          model: "Your AI model, e.g. gpt-4o (string, optional)",
          description: "What you do (string, optional)",
        },
      });
    }

    // Build agent config (only known fields — keeps hash deterministic)
    const agentConfig = { name, platform };
    if (model) agentConfig.model = model;
    if (description) agentConfig.description = description;

    // ── Step 1: Generate wallet ───────────────────────────────────

    const agentWallet = ethers.Wallet.createRandom().connect(provider);

    // ── Step 2: Fund wallet from funder ───────────────────────────

    const fundTx = await funder.sendTransaction({
      to: agentWallet.address,
      value: FUND_AMOUNT,
    });
    await fundTx.wait();

    // ── Step 3: Register on ERC-8004 ──────────────────────────────

    const registry = new ethers.Contract(
      IDENTITY_REGISTRY_ADDRESS,
      identityAbi,
      agentWallet
    );

    const regTx = await registry["register(string)"](AGENT_URI);
    const regReceipt = await regTx.wait();

    // Parse agent ID from Registered event
    const registeredEvent = regReceipt.logs
      .map((log) => {
        try {
          return registry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed) => parsed && parsed.name === "Registered");

    if (!registeredEvent) {
      return res.status(500).json({
        error: "Registration tx succeeded but could not parse agent ID.",
        txHash: regTx.hash,
      });
    }

    const agentId = registeredEvent.args.agentId.toString();

    // ── Step 4: Set metadata (parallel with explicit nonces) ──────

    const canonical = JSON.stringify(agentConfig);
    const configHash = createHash("sha256").update(canonical).digest("hex");

    let nonce = await agentWallet.getNonce();

    const tx1 = await registry.setMetadata(
      agentId,
      "configHash",
      ethers.toUtf8Bytes(configHash),
      { nonce: nonce++ }
    );
    const tx2 = await registry.setMetadata(
      agentId,
      "agentPlatform",
      ethers.toUtf8Bytes(platform),
      { nonce: nonce++ }
    );

    // Wait for both confirmations in parallel
    await Promise.all([tx1.wait(), tx2.wait()]);

    // ── Return identity card ──────────────────────────────────────

    return res.status(200).json({
      success: true,
      agentId,
      name,
      platform,
      walletAddress: agentWallet.address,
      walletPrivateKey: agentWallet.privateKey,
      configHash,
      chain: "base-sepolia",
      chainId: 84532,
      registry: IDENTITY_REGISTRY_ADDRESS,
      basescan: `${BASESCAN}/address/${agentWallet.address}`,
      message: `You are now on-chain! Agent ID ${agentId} on Base Sepolia. Save your walletPrivateKey — it controls your identity NFT.`,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

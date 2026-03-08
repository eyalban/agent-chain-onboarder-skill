import { ethers } from "ethers";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const abisDir = join(__dirname, "..", "abis");

// Base Sepolia config
const RPC_URL = process.env.RPC_URL || "https://sepolia.base.org";
const BASESCAN_URL = "https://sepolia.basescan.org";

// ERC-8004 contract addresses on Base Sepolia
const IDENTITY_REGISTRY_ADDRESS = "0x8004A818BFB912233c491871b3d84c89A494BD9e";
const REPUTATION_REGISTRY_ADDRESS = "0x8004B663056A597Dffe9eCcC1965A193B7388713";

// Load ABIs
const identityRegistryAbi = JSON.parse(
  readFileSync(join(abisDir, "IdentityRegistry.json"), "utf-8")
);
const reputationRegistryAbi = JSON.parse(
  readFileSync(join(abisDir, "ReputationRegistry.json"), "utf-8")
);

// Provider
export const provider = new ethers.JsonRpcProvider(RPC_URL);

// Signer (requires PRIVATE_KEY in .env)
export function getSigner() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in .env");
  return new ethers.Wallet(pk, provider);
}

// Contract instances
export function getIdentityRegistry(signerOrProvider) {
  return new ethers.Contract(
    IDENTITY_REGISTRY_ADDRESS,
    identityRegistryAbi,
    signerOrProvider || provider
  );
}

export function getReputationRegistry(signerOrProvider) {
  return new ethers.Contract(
    REPUTATION_REGISTRY_ADDRESS,
    reputationRegistryAbi,
    signerOrProvider || provider
  );
}

// Helpers
export function basescanTx(txHash) {
  return `${BASESCAN_URL}/tx/${txHash}`;
}

export function basescanAddress(address) {
  return `${BASESCAN_URL}/address/${address}`;
}

export { IDENTITY_REGISTRY_ADDRESS, REPUTATION_REGISTRY_ADDRESS, BASESCAN_URL };

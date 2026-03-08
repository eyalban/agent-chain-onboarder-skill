/**
 * Step 1: Generate a new Ethereum wallet for testing on Base Sepolia.
 *
 * After running this:
 * 1. Copy the private key into .env as PRIVATE_KEY
 * 2. Go to a faucet and request testnet ETH for the address:
 *    - https://www.alchemy.com/faucets/base-sepolia
 *    - https://faucets.chain.link/base-sepolia
 * 3. Run this script again to check the balance
 */

import { ethers } from "ethers";
import { provider } from "./lib/contracts.mjs";

async function main() {
  // Check if we already have a wallet in .env
  if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here") {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);
    console.log("=== Existing Wallet ===");
    console.log("Address:", wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
      console.log("\n⚠️  Balance is 0. Fund this address with testnet ETH from a faucet.");
    } else {
      console.log("\n✅ Wallet is funded and ready to go!");
    }
    return;
  }

  // Generate a new wallet
  const wallet = ethers.Wallet.createRandom();

  console.log("=== New Wallet Generated ===");
  console.log("Address:     ", wallet.address);
  console.log("Private Key: ", wallet.privateKey);
  console.log("");
  console.log("Next steps:");
  console.log("1. Copy the private key to .env as PRIVATE_KEY");
  console.log("2. Get testnet ETH from: https://www.alchemy.com/faucets/base-sepolia");
  console.log("3. Run this script again to verify the balance");
}

main().catch(console.error);

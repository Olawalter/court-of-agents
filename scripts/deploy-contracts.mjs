/**
 * Court of Agents — GenLayer Contract Deployment Script
 *
 * Deploys the single merged Intelligent Contract (CourtOfAgents) to StudioNet.
 * This replaces the previous 3-contract deployment (Adjudicator,
 * ReputationTracker, DisputeRegistry) — all of that logic now lives in one
 * contract at intelligent-contracts/court_of_agents/contract.py.
 *
 * Usage:
 *   node scripts/deploy-contracts.mjs
 *
 * Prerequisites:
 *   - npm install genlayer-js@1.1.7
 *   - Fund your account with GEN tokens on StudioNet
 */

import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

// Use provided private key or generate a new one
const privateKey = process.env.GENLAYER_PRIVATE_KEY || null;

let account;
if (privateKey) {
  account = createAccount(privateKey);
} else {
  const newKey = generatePrivateKey();
  account = createAccount(newKey);
  console.log("\n⚠️  No GENLAYER_PRIVATE_KEY set. Generated a new account:");
  console.log(`   Private Key: ${newKey}`);
  console.log(`   Address: ${account.address}`);
  console.log(`   Save this key in your .env.local as GENLAYER_PRIVATE_KEY`);
  console.log(`   Fund this address with GEN tokens on StudioNet before deploying.\n`);
}

const client = createClient({
  chain: chains.studionet,
  account,
});

console.log("=".repeat(60));
console.log("  Court of Agents — Contract Deployment");
console.log("=".repeat(60));
console.log(`  Network: StudioNet (chain ID: 61999)`);
console.log(`  Account: ${account.address}`);
console.log();

const CONTRACT = {
  name: "CourtOfAgents",
  path: "intelligent-contracts/court_of_agents/contract.py",
  envKey: "NEXT_PUBLIC_COURT_CONTRACT_ADDRESS",
};

async function deployContract(contract) {
  console.log(`\n📄 Deploying ${contract.name}...`);

  const codePath = path.join(PROJECT_ROOT, contract.path);
  const code = fs.readFileSync(codePath, "utf-8");

  try {
    // Initialize consensus smart contract reference
    await client.initializeConsensusSmartContract();

    const hash = await client.deployContract({
      code,
      args: [],
      leaderOnly: false,
    });

    console.log(`   TX Hash: ${hash}`);
    console.log(`   Waiting for acceptance...`);

    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      retries: 60,
      interval: 3000,
    });

    const contractAddress = receipt.contract_address || receipt.result?.contract_address;
    console.log(`   ✅ ${contract.name} deployed at: ${contractAddress}`);
    return contractAddress;
  } catch (error) {
    console.error(`   ❌ Failed to deploy ${contract.name}:`, error.message || error);
    return null;
  }
}

async function main() {
  const address = await deployContract(CONTRACT);

  console.log("\n" + "=".repeat(60));
  console.log("  Deployment Summary");
  console.log("=".repeat(60));

  if (address) {
    console.log(`  ${CONTRACT.envKey}=${address}`);
    console.log("\n  Add this to your .env.local file.");
    console.log("  Then restart the dev server.");
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);

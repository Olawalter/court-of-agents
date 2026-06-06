import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";

export const CONTRACT_ADDRESSES = {
  adjudicator: (process.env.NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS || "") as `0x${string}`,
  reputation: (process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS || "") as `0x${string}`,
  disputeRegistry: (process.env.NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS || "") as `0x${string}`,
};

/**
 * Create a GenLayer client with a server-side account (for API routes).
 * Uses GENLAYER_PRIVATE_KEY if set, otherwise generates ephemeral account.
 */
export function getGenLayerClient() {
  const privateKey = process.env.GENLAYER_PRIVATE_KEY || undefined;
  const account = privateKey ? createAccount(privateKey) : createAccount();
  const client = createClient({
    chain: chains.studionet,
    account,
  });
  return { client, account };
}

/**
 * Create a GenLayer client for browser use (user's wallet).
 * Pass the user's private key to create their account.
 */
export function getGenLayerClientForUser(privateKey: string) {
  const account = createAccount(privateKey);
  const client = createClient({
    chain: chains.studionet,
    account,
  });
  return { client, account };
}

/**
 * Generate a new wallet for a user during registration.
 */
export function generateWallet() {
  const privateKey = generatePrivateKey();
  const account = createAccount(privateKey);
  return {
    privateKey,
    address: account.address,
  };
}

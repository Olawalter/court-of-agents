import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";

// Strip BOM (U+FEFF) and other invisible prefix characters from env vars
const stripBOM = (s: string | undefined): string => (s ?? "").replace(/^[﻿￾]+/, "");

export const CONTRACT_ADDRESSES = {
  adjudicator: stripBOM(process.env.NEXT_PUBLIC_ADJUDICATOR_CONTRACT_ADDRESS) as `0x${string}`,
  reputation: stripBOM(process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS) as `0x${string}`,
  disputeRegistry: stripBOM(process.env.NEXT_PUBLIC_DISPUTE_REGISTRY_CONTRACT_ADDRESS) as `0x${string}`,
};

/**
 * Create a GenLayer client with a server-side account (for API routes).
 * Uses GENLAYER_PRIVATE_KEY if set, otherwise generates ephemeral account.
 */
export function getGenLayerClient() {
  const rawKey = stripBOM(process.env.GENLAYER_PRIVATE_KEY);
  const privateKey = rawKey || undefined;
  const account = privateKey ? createAccount(privateKey as `0x${string}`) : createAccount();
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

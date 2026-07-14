import { createClient, createAccount, generatePrivateKey, chains } from "genlayer-js";

// Strip BOM (char code 65279 = 0xFEFF) from the start of an env var string.
// Vercel env vars can acquire a BOM prefix when pasted from Windows UTF-8 files.
const stripBOM = (s: string | undefined): string => {
  let str = s ?? "";
  while (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return str;
};

// All adjudication, reputation, and dispute-audit logic now lives in a single
// merged contract (intelligent-contracts/court_of_agents/contract.py), so
// every action below resolves to the same address. The three keys are kept
// so existing call sites (which pass `adjudicator`/`reputation`/`disputeRegistry`)
// don't need to change.
const COURT_ADDRESS = stripBOM(process.env.NEXT_PUBLIC_COURT_CONTRACT_ADDRESS) as `0x${string}`;

export const CONTRACT_ADDRESSES = {
  adjudicator: COURT_ADDRESS,
  reputation: COURT_ADDRESS,
  disputeRegistry: COURT_ADDRESS,
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

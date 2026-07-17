"use client";

import { createClient, chains } from "genlayer-js";

const CONTRACT_ADDRESS = (
  process.env.NEXT_PUBLIC_COURT_CONTRACT_ADDRESS ?? ""
) as `0x${string}`;

export { CONTRACT_ADDRESS };

/**
 * Create a GenLayer client that routes signing through the injected wallet
 * (MetaMask / Rabby). When `account` is a plain hex address string (not a
 * privateKeyToAccount object), genlayer-js automatically delegates
 * eth_sendTransaction and related signing methods to window.ethereum.
 *
 * Call this only in browser (client) components.
 */
export function createBrowserClient(address: string) {
  return createClient({
    chain: chains.studionet,
    account: address as `0x${string}`,
  });
}

/**
 * Sanitize a string for GenLayer contract args: NFC-normalise, replace smart
 * punctuation with ASCII, drop anything above Latin-1 (same rules as the
 * server-side cleanStr in /api/contracts/route.ts).
 */
export function sanitizeArg(value: string): string {
  let s = value.normalize("NFC");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0x2018 || code === 0x2019) { out += "'"; continue; }
    if (code === 0x201C || code === 0x201D || code === 0x00AB || code === 0x00BB) { out += '"'; continue; }
    if (code === 0x2013 || code === 0x2014 || code === 0x2015) { out += "-"; continue; }
    if (code === 0x2026) { out += "..."; continue; }
    if (code === 0x2022 || code === 0x2023 || code === 0x2043 || code === 0x25CF || code === 0x25E6) { out += "-"; continue; }
    if (code === 0x00A0) { out += " "; continue; }
    if (
      code === 0xFEFF || code === 0xFFFE || code === 0xFFFF ||
      code === 0x200B || code === 0x200C || code === 0x200D ||
      code === 0x0000 || code === 0xFFFD
    ) { continue; }
    if (code > 0xFF) { continue; }
    out += s[i];
  }
  return out.trim();
}

// ─── Types matching the contract's stored JSON shape ────────────────────────

export interface OnChainVerdict {
  persona: string;
  verdict: string;
  confidence: number;
  reasoning: string;
  key_factors: string[];
}

export interface OnChainConsensus {
  case_id: string;
  final_verdict: string;
  overall_confidence: number;
  agreement_ratio: number;
  method: string;
  resolution_explanation: string;
  dissenting_summary: string;
  participating_judges: string[];
}

/**
 * Read verdicts for a case from the contract via the API route.
 * Returns null if the contract returns an empty string (no verdicts yet).
 */
export async function fetchVerdictsFromContract(
  caseId: string
): Promise<OnChainVerdict[] | null> {
  try {
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_verdicts", params: { case_id: caseId } }),
    });
    const data = await res.json();
    if (!data.result) return null;
    return JSON.parse(data.result) as OnChainVerdict[];
  } catch {
    return null;
  }
}

/**
 * Read the consensus result for a case from the contract via the API route.
 * Returns null if no consensus has been recorded yet.
 */
export async function fetchConsensusFromContract(
  caseId: string
): Promise<OnChainConsensus | null> {
  try {
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_consensus", params: { case_id: caseId } }),
    });
    const data = await res.json();
    if (!data.result) return null;
    return JSON.parse(data.result) as OnChainConsensus;
  } catch {
    return null;
  }
}

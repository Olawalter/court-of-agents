import { NextResponse } from "next/server";
import { getGenLayerClient, getGenLayerClientForUser, CONTRACT_ADDRESSES } from "@/services/genlayer/client";
import { z } from "zod";

const requestSchema = z.object({
  private_key: z.string().optional(),
  action: z.enum([
    "submit_case", "run_judges", "calculate_consensus", "submit_user_decision",
    "get_case", "get_verdicts", "get_consensus", "get_user_decision", "get_case_count",
    "register_user", "update_after_decision", "get_reputation", "get_user_count",
    "register_dispute", "resolve_dispute", "get_dispute", "get_stats",
  ]),
  params: z.record(z.unknown()).default({}),
});

// Strip BOM (U+FEFF), zero-width chars, and other invisible Unicode from strings
function cleanStr(s: string): string {
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // Skip: BOM, zero-width space, ZWNJ, ZWJ, replacement chars
    if (code === 0xFEFF || code === 0xFFFE || code === 0xFFFF ||
        code === 0x200B || code === 0x200C || code === 0x200D ||
        code === 0x00 || code === 0xFFFD) {
      continue;
    }
    result += s[i];
  }
  return result.trim();
}

function sanitize(val: unknown): unknown {
  if (typeof val === "string") return cleanStr(val);
  if (Array.isArray(val)) return val.map(sanitize);
  if (val && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  return val;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, params, private_key } = parsed.data;
    const p = sanitize(params) as Record<string, unknown>;
    const key = private_key ? cleanStr(private_key) : undefined;

    const { client } = key
      ? getGenLayerClientForUser(key)
      : getGenLayerClient();

    // ─── ADJUDICATOR ───
    const adjAddr = CONTRACT_ADDRESSES.adjudicator;
    const repAddr = CONTRACT_ADDRESSES.reputation;
    const regAddr = CONTRACT_ADDRESSES.disputeRegistry;

    if (action === "submit_case") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: adjAddr,
        functionName: "submit_case",
        args: [
          p.case_id as string, p.title as string, p.description as string,
          p.category as string, p.difficulty as number,
          p.claim_a_name as string, p.claim_a_summary as string, p.claim_a_argument as string,
          p.claim_b_name as string, p.claim_b_summary as string, p.claim_b_argument as string,
          p.evidence_summary as string,
        ],
      });
      return NextResponse.json({ tx_hash: hash, status: "submitted" });
    }

    if (action === "run_judges") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: adjAddr, functionName: "run_judges", args: [p.case_id as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "judges_running" });
    }

    if (action === "calculate_consensus") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: adjAddr, functionName: "calculate_consensus", args: [p.case_id as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "consensus_calculating" });
    }

    if (action === "submit_user_decision") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: adjAddr, functionName: "submit_user_decision",
        args: [p.case_id as string, p.user_address as string, p.decision as string, p.reasoning as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "decision_submitted" });
    }

    if (action === "get_case") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_case", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_verdicts") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_verdicts", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_consensus") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_consensus", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_user_decision") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_user_decision", args: [p.case_id as string, p.user_address as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_case_count") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_case_count", args: [] });
      return NextResponse.json({ result });
    }

    // ─── REPUTATION ───
    if (action === "register_user") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: repAddr, functionName: "register_user", args: [p.user_address as string, p.username as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "user_registered" });
    }

    if (action === "update_after_decision") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: repAddr, functionName: "update_after_decision", args: [p.user_address as string, p.is_correct as boolean],
      });
      return NextResponse.json({ tx_hash: hash, status: "reputation_updated" });
    }

    if (action === "get_reputation") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const result = await client.readContract({ address: repAddr, functionName: "get_reputation", args: [p.user_address as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_user_count") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const result = await client.readContract({ address: repAddr, functionName: "get_user_count", args: [] });
      return NextResponse.json({ result });
    }

    // ─── DISPUTE REGISTRY ───
    if (action === "register_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: regAddr, functionName: "register_dispute",
        args: [p.dispute_id as string, p.title as string, p.category as string, p.submitter_address as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "dispute_registered" });
    }

    if (action === "resolve_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const hash = await client.writeContract({
        address: regAddr, functionName: "resolve_dispute",
        args: [p.dispute_id as string, p.verdict as string, p.confidence as number],
      });
      return NextResponse.json({ tx_hash: hash, status: "dispute_resolved" });
    }

    if (action === "get_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const result = await client.readContract({ address: regAddr, functionName: "get_dispute", args: [p.dispute_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_stats") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const result = await client.readContract({ address: regAddr, functionName: "get_stats", args: [] });
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Contract interaction error:", err);
    const message = err instanceof Error ? err.message : "Contract interaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

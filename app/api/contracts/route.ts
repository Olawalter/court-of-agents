import { NextResponse } from "next/server";
import { getGenLayerClient, getGenLayerClientForUser, CONTRACT_ADDRESSES } from "@/services/genlayer/client";
import { z } from "zod";

const requestSchema = z.object({
  private_key: z.string().optional(),
  action: z.enum([
    // Adjudicator contract
    "submit_case",
    "run_judges",
    "calculate_consensus",
    "submit_user_decision",
    "get_case",
    "get_verdicts",
    "get_consensus",
    "get_user_decision",
    "get_case_count",
    // Reputation contract
    "register_user",
    "update_after_decision",
    "get_reputation",
    "get_user_count",
    // Dispute Registry contract
    "register_dispute",
    "resolve_dispute",
    "get_dispute",
    "get_stats",
  ]),
  params: z.record(z.unknown()).default({}),
});

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

    // Use user's wallet if private_key provided, otherwise server account
    const { client } = private_key
      ? getGenLayerClientForUser(private_key)
      : getGenLayerClient();

    // ─── ADJUDICATOR CONTRACT ───
    if (["submit_case", "run_judges", "calculate_consensus", "submit_user_decision", "get_case", "get_verdicts", "get_consensus", "get_user_decision", "get_case_count"].includes(action)) {
      if (!CONTRACT_ADDRESSES.adjudicator) {
        return NextResponse.json({ error: "Adjudicator contract not configured" }, { status: 503 });
      }

      // WRITE methods
      if (action === "submit_case") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "submit_case",
          args: [
            params.case_id as string,
            params.title as string,
            params.description as string,
            params.category as string,
            params.difficulty as number,
            params.claim_a_name as string,
            params.claim_a_summary as string,
            params.claim_a_argument as string,
            params.claim_b_name as string,
            params.claim_b_summary as string,
            params.claim_b_argument as string,
            params.evidence_summary as string,
          ],
        });
        return NextResponse.json({ tx_hash: hash, status: "submitted" });
      }

      if (action === "run_judges") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "run_judges",
          args: [params.case_id as string],
        });
        return NextResponse.json({ tx_hash: hash, status: "judges_running" });
      }

      if (action === "calculate_consensus") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "calculate_consensus",
          args: [params.case_id as string],
        });
        return NextResponse.json({ tx_hash: hash, status: "consensus_calculating" });
      }

      if (action === "submit_user_decision") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "submit_user_decision",
          args: [
            params.case_id as string,
            params.user_address as string,
            params.decision as string,
            params.reasoning as string,
          ],
        });
        return NextResponse.json({ tx_hash: hash, status: "decision_submitted" });
      }

      // READ methods
      if (action === "get_case") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "get_case",
          args: [params.case_id as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_verdicts") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "get_verdicts",
          args: [params.case_id as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_consensus") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "get_consensus",
          args: [params.case_id as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_user_decision") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "get_user_decision",
          args: [params.case_id as string, params.user_address as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_case_count") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.adjudicator,
          functionName: "get_case_count",
          args: [],
        });
        return NextResponse.json({ result });
      }
    }

    // ─── REPUTATION CONTRACT ───
    if (["register_user", "update_after_decision", "get_reputation", "get_user_count"].includes(action)) {
      if (!CONTRACT_ADDRESSES.reputation) {
        return NextResponse.json({ error: "Reputation contract not configured" }, { status: 503 });
      }

      if (action === "register_user") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.reputation,
          functionName: "register_user",
          args: [params.user_address as string, params.username as string],
        });
        return NextResponse.json({ tx_hash: hash, status: "user_registered" });
      }

      if (action === "update_after_decision") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.reputation,
          functionName: "update_after_decision",
          args: [params.user_address as string, params.is_correct as boolean],
        });
        return NextResponse.json({ tx_hash: hash, status: "reputation_updated" });
      }

      if (action === "get_reputation") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.reputation,
          functionName: "get_reputation",
          args: [params.user_address as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_user_count") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.reputation,
          functionName: "get_user_count",
          args: [],
        });
        return NextResponse.json({ result });
      }
    }

    // ─── DISPUTE REGISTRY CONTRACT ───
    if (["register_dispute", "resolve_dispute", "get_dispute", "get_stats"].includes(action)) {
      if (!CONTRACT_ADDRESSES.disputeRegistry) {
        return NextResponse.json({ error: "DisputeRegistry contract not configured" }, { status: 503 });
      }

      if (action === "register_dispute") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.disputeRegistry,
          functionName: "register_dispute",
          args: [
            params.dispute_id as string,
            params.title as string,
            params.category as string,
            params.submitter_address as string,
          ],
        });
        return NextResponse.json({ tx_hash: hash, status: "dispute_registered" });
      }

      if (action === "resolve_dispute") {
        const hash = await client.writeContract({
          address: CONTRACT_ADDRESSES.disputeRegistry,
          functionName: "resolve_dispute",
          args: [
            params.dispute_id as string,
            params.verdict as string,
            params.confidence as number,
          ],
        });
        return NextResponse.json({ tx_hash: hash, status: "dispute_resolved" });
      }

      if (action === "get_dispute") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.disputeRegistry,
          functionName: "get_dispute",
          args: [params.dispute_id as string],
        });
        return NextResponse.json({ result });
      }

      if (action === "get_stats") {
        const result = await client.readContract({
          address: CONTRACT_ADDRESSES.disputeRegistry,
          functionName: "get_stats",
          args: [],
        });
        return NextResponse.json({ result });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Contract interaction error:", err);
    const message = err instanceof Error ? err.message : "Contract interaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

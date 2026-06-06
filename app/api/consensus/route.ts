import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  case_id: z.string().uuid(),
});

type VerdictValue = "favor_a" | "favor_b" | "partial_a" | "partial_b" | "dismiss";

interface StoredVerdict {
  id: string;
  case_id: string;
  judge_persona: string;
  provider: string;
  verdict: VerdictValue;
  confidence: number;
  reasoning: string;
  key_factors: string[];
  dissenting_points: string[];
  created_at: string;
}

function calculateConsensus(verdicts: StoredVerdict[]) {
  if (verdicts.length === 0) {
    throw new Error("No verdicts to calculate consensus from");
  }

  // Weighted vote count: each verdict weighted by confidence
  const weightedVotes: Record<string, number> = {};
  let totalWeight = 0;

  for (const v of verdicts) {
    const weight = v.confidence / 100;
    weightedVotes[v.verdict] = (weightedVotes[v.verdict] || 0) + weight;
    totalWeight += weight;
  }

  // Find the verdict with the highest weighted support
  const sorted = Object.entries(weightedVotes).sort((a, b) => b[1] - a[1]);
  const winningVerdict = sorted[0][0] as VerdictValue;
  const winningWeight = sorted[0][1];

  // Agreement ratio: how much of the total weight supports the winning verdict
  const agreementRatio = totalWeight > 0 ? winningWeight / totalWeight : 0;

  // Overall confidence: average confidence of judges who agreed with majority
  const majorityVerdicts = verdicts.filter((v) => v.verdict === winningVerdict);
  const overallConfidence =
    majorityVerdicts.reduce((sum, v) => sum + v.confidence, 0) /
    majorityVerdicts.length;

  // Majority reasoning: combine reasoning from agreeing judges
  const majorityReasoning = majorityVerdicts
    .map((v) => `[${v.judge_persona}] ${v.reasoning}`)
    .join("\n\n");

  // Dissenting summary
  const dissentingVerdicts = verdicts.filter((v) => v.verdict !== winningVerdict);
  const dissentingSummary =
    dissentingVerdicts.length > 0
      ? dissentingVerdicts
          .map((v) => `[${v.judge_persona}] ${v.reasoning}`)
          .join("\n\n")
      : "No dissenting opinions.";

  // Determine consensus method
  const allAgree = verdicts.every((v) => v.verdict === winningVerdict);
  const superMajority = agreementRatio >= 0.67;
  const method = allAgree
    ? "unanimous"
    : superMajority
      ? "supermajority"
      : "weighted_majority";

  // Build resolution explanation
  const resolution = `The court reached ${method === "unanimous" ? "a unanimous" : method === "supermajority" ? "a supermajority" : "a weighted majority"} decision of "${winningVerdict}" with ${Math.round(agreementRatio * 100)}% agreement across ${verdicts.length} judges. Overall confidence: ${Math.round(overallConfidence)}%.`;

  // Verdict breakdown
  const breakdown: Record<string, number> = {};
  for (const v of verdicts) {
    breakdown[v.verdict] = (breakdown[v.verdict] || 0) + 1;
  }

  return {
    method,
    final_verdict: winningVerdict,
    overall_confidence: Math.round(overallConfidence),
    agreement_ratio: Math.round(agreementRatio * 100) / 100,
    majority_reasoning: majorityReasoning,
    dissenting_summary: dissentingSummary,
    resolution_explanation: resolution,
    participating_judges: verdicts.map((v) => v.judge_persona),
    verdict_breakdown: breakdown,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const body = await request.json();

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Fetch verdicts for this case
    const { data: verdicts, error: verdictError } = await supabase
      .from("verdicts")
      .select("*")
      .eq("case_id", parsed.data.case_id);

    if (verdictError || !verdicts || verdicts.length === 0) {
      return NextResponse.json(
        { error: "No verdicts found for this case. Run agent evaluation first." },
        { status: 400 }
      );
    }

    // Calculate consensus
    const consensus = calculateConsensus(verdicts as StoredVerdict[]);

    // Store consensus result
    const { data: consensusResult, error: consensusError } = await supabase
      .from("consensus_results")
      .insert({
        case_id: parsed.data.case_id,
        ...consensus,
      })
      .select()
      .single();

    if (consensusError) {
      return NextResponse.json(
        { error: consensusError.message },
        { status: 500 }
      );
    }

    // Update case status and link consensus
    await supabase
      .from("cases")
      .update({
        status: "consensus_reached",
        consensus_id: consensusResult.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.case_id);

    return NextResponse.json(consensusResult);
  } catch (err) {
    console.error("Consensus error:", err);
    return NextResponse.json(
      { error: "Failed to calculate consensus" },
      { status: 500 }
    );
  }
}

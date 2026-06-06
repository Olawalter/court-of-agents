import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { getJudgeVerdict } from "@/services/ai/judge-engine";
import { judgeConfigs } from "@/config/judges";
import type { Case } from "@/types/cases";
import { z } from "zod";

const requestSchema = z.object({
  case_id: z.string().uuid(),
  judge_persona: z
    .enum(["commerce", "consumer", "contract", "neutral", "risk", "genlayer"])
    .optional(),
});

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

    // Fetch the case with evidence
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", parsed.data.case_id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: evidence } = await supabase
      .from("evidence")
      .select("*")
      .eq("case_id", parsed.data.case_id);

    const fullCase: Case = {
      ...caseData,
      claim_a: caseData.claim_a as Case["claim_a"],
      claim_b: caseData.claim_b as Case["claim_b"],
      evidence: (evidence || []) as Case["evidence"],
    };

    // Determine which judges to run
    const judges = parsed.data.judge_persona
      ? judgeConfigs.filter((j) => j.persona === parsed.data.judge_persona)
      : judgeConfigs;

    // Update case status
    await supabase
      .from("cases")
      .update({ status: "in_review", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.case_id);

    // Get verdicts from all selected judges
    const verdicts = await Promise.allSettled(
      judges.map((judge) => getJudgeVerdict(judge, fullCase))
    );

    const successfulVerdicts = verdicts
      .filter(
        (v): v is PromiseFulfilledResult<Awaited<ReturnType<typeof getJudgeVerdict>>> =>
          v.status === "fulfilled"
      )
      .map((v) => v.value);

    // Store verdicts in database
    if (successfulVerdicts.length > 0) {
      const { error: insertError } = await supabase.from("verdicts").insert(
        successfulVerdicts.map((v) => ({
          case_id: v.case_id,
          judge_persona: v.judge_persona,
          provider: v.provider,
          verdict: v.verdict,
          confidence: v.confidence,
          reasoning: v.reasoning,
          key_factors: v.key_factors,
          dissenting_points: v.dissenting_points,
        }))
      );

      if (insertError) {
        console.error("Failed to store verdicts:", insertError);
      }
    }

    // Update case status
    await supabase
      .from("cases")
      .update({ status: "deliberating", updated_at: new Date().toISOString() })
      .eq("id", parsed.data.case_id);

    return NextResponse.json({
      case_id: parsed.data.case_id,
      verdicts: successfulVerdicts,
      failed: verdicts.filter((v) => v.status === "rejected").length,
    });
  } catch (err) {
    console.error("Agent evaluation error:", err);
    return NextResponse.json(
      { error: "Failed to evaluate case" },
      { status: 500 }
    );
  }
}

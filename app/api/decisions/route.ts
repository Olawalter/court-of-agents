import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { userDecisionSchema } from "@/lib/validators";
import { REPUTATION_THRESHOLDS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = userDecisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Check if user already decided on this case
    const { data: existing } = await supabase
      .from("user_decisions")
      .select("id")
      .eq("user_id", user.id)
      .eq("case_id", parsed.data.case_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a decision for this case" },
        { status: 409 }
      );
    }

    // Insert decision
    const { data: decision, error } = await supabase
      .from("user_decisions")
      .insert({
        user_id: user.id,
        case_id: parsed.data.case_id,
        decision: parsed.data.decision,
        reasoning: parsed.data.reasoning,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update reputation
    await updateReputation(supabase, user.id, parsed.data.case_id, parsed.data.decision);

    return NextResponse.json(decision, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to submit decision" },
      { status: 500 }
    );
  }
}

async function updateReputation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string,
  caseId: string,
  userDecision: string
) {
  // Check if case has consensus
  const { data: caseData } = await supabase
    .from("cases")
    .select("consensus_id")
    .eq("id", caseId)
    .single();

  if (!caseData?.consensus_id) return;

  const { data: consensus } = await supabase
    .from("consensus_results")
    .select("final_verdict")
    .eq("id", caseData.consensus_id)
    .single();

  if (!consensus) return;

  const isCorrect = userDecision === consensus.final_verdict;

  // Get or create reputation
  const { data: rep } = await supabase
    .from("user_reputation")
    .select("*")
    .eq("user_id", userId)
    .single();

  const currentRep = rep || {
    user_id: userId,
    rank: "novice_arbiter",
    score: 0,
    total_cases: 0,
    correct_decisions: 0,
    accuracy: 0,
    streak: 0,
    best_streak: 0,
    participation_rate: 0,
    consistency_score: 0,
  };

  const newTotalCases = currentRep.total_cases + 1;
  const newCorrect = currentRep.correct_decisions + (isCorrect ? 1 : 0);
  const newAccuracy = newCorrect / newTotalCases;
  const newStreak = isCorrect ? currentRep.streak + 1 : 0;
  const newBestStreak = Math.max(currentRep.best_streak, newStreak);
  const scoreChange = isCorrect ? 10 + Math.floor(newStreak * 2) : -3;
  const newScore = Math.max(0, currentRep.score + scoreChange);

  // Determine rank
  let newRank = "novice_arbiter";
  for (const threshold of [...REPUTATION_THRESHOLDS].reverse()) {
    if (
      newScore >= threshold.min_score &&
      newTotalCases >= threshold.min_cases &&
      newAccuracy >= threshold.min_accuracy
    ) {
      newRank = threshold.rank;
      break;
    }
  }

  const updates = {
    user_id: userId,
    rank: newRank,
    score: newScore,
    total_cases: newTotalCases,
    correct_decisions: newCorrect,
    accuracy: Math.round(newAccuracy * 100) / 100,
    streak: newStreak,
    best_streak: newBestStreak,
    participation_rate: 1,
    consistency_score: Math.round(newAccuracy * 100) / 100,
    updated_at: new Date().toISOString(),
  };

  await supabase.from("user_reputation").upsert(updates);
}

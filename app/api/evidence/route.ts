import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { z } from "zod";

const requestSchema = z.object({
  case_id: z.string().uuid(),
  url: z.string().url(),
  label: z.string().min(1).max(200),
  summary: z.string().min(1),
  submitted_by: z.enum(["claimant", "respondent"]),
});

// Mirrors a fetched-and-verified web evidence entry (from the contract's
// attach_web_evidence, which actually fetched the URL and had validators
// independently re-fetch it to reach consensus on the summary) into
// Supabase for fast display. This is NOT where evidence is verified —
// that already happened on-chain — this is just a read-optimized copy.
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

    const { data, error } = await supabase
      .from("evidence")
      .insert({
        case_id: parsed.data.case_id,
        title: parsed.data.label,
        description: `Fetched and AI-verified from ${parsed.data.url}`,
        type: "data",
        content: parsed.data.summary,
        submitted_by: parsed.data.submitted_by,
        credibility_score: 90, // fetched + LLM-verified via GenLayer consensus, not a bare assertion
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to record evidence" },
      { status: 500 }
    );
  }
}

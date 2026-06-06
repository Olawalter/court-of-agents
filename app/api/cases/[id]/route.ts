import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();

    // Fetch case with evidence and verdicts
    const { data: caseData, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", id)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const { data: evidence } = await supabase
      .from("evidence")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: true });

    const { data: verdicts } = await supabase
      .from("verdicts")
      .select("*")
      .eq("case_id", id)
      .order("created_at", { ascending: true });

    const { data: consensus } = caseData.consensus_id
      ? await supabase
          .from("consensus_results")
          .select("*")
          .eq("id", caseData.consensus_id)
          .single()
      : { data: null };

    return NextResponse.json({
      ...caseData,
      evidence: evidence || [],
      verdicts: verdicts || [],
      consensus: consensus || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch case" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseAdmin();
    const body = await request.json();

    const { data, error } = await supabase
      .from("cases")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update case" },
      { status: 500 }
    );
  }
}

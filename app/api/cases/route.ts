import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { createCaseSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("cases")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const body = await request.json();

    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("cases")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
        claim_a: parsed.data.claim_a,
        claim_b: parsed.data.claim_b,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
}

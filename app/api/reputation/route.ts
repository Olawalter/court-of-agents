import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = createSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (userId) {
      // Get specific user reputation
      const { data, error } = await supabase
        .from("user_reputation")
        .select("*, profiles(username, avatar_url)")
        .eq("user_id", userId)
        .single();

      if (error) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    // Get leaderboard
    const limit = parseInt(searchParams.get("limit") || "50");
    const { data, error } = await supabase
      .from("user_reputation")
      .select("*, profiles(username, avatar_url)")
      .order("score", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const leaderboard = (data || []).map((entry, index) => ({
      ...entry,
      position: index + 1,
    }));

    return NextResponse.json(leaderboard);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch reputation data" },
      { status: 500 }
    );
  }
}

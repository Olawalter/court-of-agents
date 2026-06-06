import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { z } from "zod";

const createSchema = z.object({
  address: z.string().min(42).max(42),
  username: z.string().min(3).max(30),
});

// GET — lookup profile by address
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json({ error: "address parameter required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("wallet_profiles")
      .select("*")
      .eq("address", address.toLowerCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST — create or update profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const normalizedAddress = parsed.data.address.toLowerCase();
    const supabase = createSupabaseAdmin();

    // Check if profile exists
    const { data: existing } = await supabase
      .from("wallet_profiles")
      .select("*")
      .eq("address", normalizedAddress)
      .single();

    if (existing) {
      // Update username
      const { data, error } = await supabase
        .from("wallet_profiles")
        .update({
          username: parsed.data.username,
          updated_at: new Date().toISOString(),
        })
        .eq("address", normalizedAddress)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ profile: data, created: false });
    }

    // Create new profile
    const { data, error } = await supabase
      .from("wallet_profiles")
      .insert({
        address: normalizedAddress,
        username: parsed.data.username,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data, created: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}

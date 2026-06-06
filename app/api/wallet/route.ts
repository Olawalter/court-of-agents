import { NextResponse } from "next/server";
import { generateWallet } from "@/services/genlayer/client";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { z } from "zod";

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Generate GenLayer wallet
    const wallet = generateWallet();

    // Create Supabase auth user
    const supabase = createSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        username: parsed.data.username,
        wallet_address: wallet.address,
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // Create profile with wallet address
      await supabase.from("profiles").insert({
        id: authData.user.id,
        username: parsed.data.username,
        avatar_url: null,
      });

      // Initialize reputation
      await supabase.from("user_reputation").insert({
        user_id: authData.user.id,
        rank: "novice_arbiter",
        score: 0,
        total_cases: 0,
        correct_decisions: 0,
        accuracy: 0,
        streak: 0,
        best_streak: 0,
        participation_rate: 0,
        consistency_score: 0,
      });
    }

    // Register on GenLayer reputation contract
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_user",
          params: {
            user_address: wallet.address,
            username: parsed.data.username,
          },
        }),
      });
    } catch {
      // Non-blocking — contract registration can be retried
    }

    return NextResponse.json({
      user_id: authData.user?.id,
      wallet_address: wallet.address,
      private_key: wallet.privateKey,
      username: parsed.data.username,
      message: "Account created. SAVE YOUR PRIVATE KEY — it cannot be recovered.",
    });
  } catch (err) {
    console.error("Wallet registration error:", err);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

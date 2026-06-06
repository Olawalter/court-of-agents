import { NextResponse } from "next/server";
import { generateWallet } from "@/services/genlayer/client";
import { z } from "zod";

const schema = z.object({
  username: z.string().min(3).max(30),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters" },
        { status: 400 }
      );
    }

    // Generate GenLayer wallet
    const wallet = generateWallet();

    // Register on reputation contract (non-blocking)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${baseUrl}/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_user",
          private_key: wallet.privateKey,
          params: {
            user_address: wallet.address,
            username: parsed.data.username,
          },
        }),
      });
    } catch {
      // Contract registration can be retried later
    }

    return NextResponse.json({
      address: wallet.address,
      private_key: wallet.privateKey,
      username: parsed.data.username,
    });
  } catch (err) {
    console.error("Wallet creation error:", err);
    return NextResponse.json(
      { error: "Failed to create wallet" },
      { status: 500 }
    );
  }
}

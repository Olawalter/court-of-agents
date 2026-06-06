import { NextResponse } from "next/server";
import { createAccount } from "genlayer-js";
import { z } from "zod";

const schema = z.object({
  private_key: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Private key is required" }, { status: 400 });
    }

    // Validate the private key by creating an account
    let account;
    try {
      account = createAccount(parsed.data.private_key);
    } catch {
      return NextResponse.json({ error: "Invalid private key" }, { status: 400 });
    }

    // Try to get username from reputation contract
    let username = account.address.slice(0, 8);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/contracts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_reputation",
          params: { user_address: account.address },
        }),
      });
      const data = await res.json();
      if (data.result) {
        try {
          const rep = JSON.parse(data.result);
          if (rep.username) username = rep.username;
        } catch {}
      }
    } catch {}

    return NextResponse.json({
      address: account.address,
      username,
    });
  } catch (err) {
    console.error("Wallet connect error:", err);
    return NextResponse.json(
      { error: "Failed to connect wallet" },
      { status: 500 }
    );
  }
}

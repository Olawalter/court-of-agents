import { NextResponse } from "next/server";
import { getGenLayerClient, getGenLayerClientForUser, CONTRACT_ADDRESSES } from "@/services/genlayer/client";
import { z } from "zod";

const requestSchema = z.object({
  private_key: z.string().optional(),
  action: z.enum([
    "submit_case", "run_judges", "calculate_consensus", "submit_user_decision",
    "get_case", "get_verdicts", "get_consensus", "get_user_decision", "get_case_count",
    "register_user", "update_after_decision", "get_reputation", "get_user_count",
    "register_dispute", "resolve_dispute", "get_dispute", "get_stats",
  ]),
  params: z.record(z.unknown()).default({}),
});

// Sanitize a contract arg string: NFC-normalise, strip BOM + invisibles,
// replace smart punctuation, then drop anything > 255 that remains.
function cleanStr(s: string): string {
  // NFC first so combining sequences are pre-composed before char-code checks
  s = s.normalize("NFC");
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    // Smart single quotes / backtick / acute -> apostrophe
    if (code === 0x2018 || code === 0x2019 || code === 0x0060 || code === 0x00B4) { out += "'"; continue; }
    // Smart double quotes / guillemets -> straight quote
    if (code === 0x201C || code === 0x201D || code === 0x00AB || code === 0x00BB) { out += '"'; continue; }
    // En-dash / em-dash / horizontal bar -> hyphen
    if (code === 0x2013 || code === 0x2014 || code === 0x2015) { out += '-'; continue; }
    // Ellipsis -> three dots
    if (code === 0x2026) { out += '...'; continue; }
    // Bullets -> hyphen
    if (code === 0x2022 || code === 0x2023 || code === 0x2043 || code === 0x25CF || code === 0x25E6) { out += '-'; continue; }
    // Non-breaking space -> regular space
    if (code === 0x00A0) { out += ' '; continue; }
    // Strip: BOM, reverse BOM, zero-width, invisible, replacement char, null
    if (code === 0xFEFF || code === 0xFFFE || code === 0xFFFF ||
        code === 0x200B || code === 0x200C || code === 0x200D ||
        code === 0x0000 || code === 0xFFFD) { continue; }
    // Strip anything else above 255 (can't be encoded as ByteString)
    if (code > 0xFF) { continue; }
    out += s[i];
  }
  return out.trim();
}
function sanitize(val: unknown): unknown {
  if (typeof val === "string") return cleanStr(val);
  if (Array.isArray(val)) return val.map(sanitize);
  if (val && typeof val === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out;
  }
  return val;
}

// Last-line-of-defense: coerce any arg to a safe ASCII string right before sending to contract.
// This catches anything sanitize() might have missed (e.g., non-string values cast to string
// containing unicode surrogates, or numbers that somehow have weird string representations).
function safeStr(val: unknown): string {
  const s = String(val ?? "");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code <= 0x7E && code >= 0x20) { out += s[i]; continue; } // printable ASCII fast-path
    if (code === 0x09 || code === 0x0A || code === 0x0D) { out += " "; continue; } // tab/LF/CR → space
    if (code === 0x2018 || code === 0x2019) { out += "'"; continue; }
    if (code === 0x201C || code === 0x201D) { out += '"'; continue; }
    if (code === 0x2013 || code === 0x2014) { out += "-"; continue; }
    if (code === 0x2026) { out += "..."; continue; }
    if (code === 0x00A0) { out += " "; continue; }
    if (code > 0x1F && code <= 0xFF) { out += s[i]; continue; } // other Latin-1 printable
    // skip everything else (BOM, zero-width, surrogates, etc.)
  }
  return out;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, params, private_key } = parsed.data;
    const p = sanitize(params) as Record<string, unknown>;

    // Strip BOM and any non-hex chars from the private key
    let key: string | undefined;
    if (private_key) {
      const stripped = cleanStr(private_key);
      // A valid EVM private key is 0x followed by 64 hex chars (66 chars total)
      // or 32 raw bytes (64 hex chars without prefix)
      if (/^0x[0-9a-fA-F]{64}$/.test(stripped) || /^[0-9a-fA-F]{64}$/.test(stripped)) {
        key = stripped;
      } else {
        console.error("[contracts] Invalid private key format after cleaning. Length:", stripped.length, "First char code:", stripped.charCodeAt(0));
        // Fall back to server key
      }
    }

    const { client } = key
      ? getGenLayerClientForUser(key)
      : getGenLayerClient();

    // ─── ADJUDICATOR ───
    const adjAddr = CONTRACT_ADDRESSES.adjudicator;
    const repAddr = CONTRACT_ADDRESSES.reputation;
    const regAddr = CONTRACT_ADDRESSES.disputeRegistry;

    if (action === "submit_case") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      // safeStr() is applied here as a final guard — sanitize() already ran on params above,
      // but this ensures the exact bytes going into the SDK are Latin-1 safe.
      const submitArgs: [string, string, string, string, number, string, string, string, string, string, string, string] = [
        safeStr(p.case_id), safeStr(p.title), safeStr(p.description),
        safeStr(p.category), Number(p.difficulty) || 1,
        safeStr(p.claim_a_name), safeStr(p.claim_a_summary), safeStr(p.claim_a_argument),
        safeStr(p.claim_b_name), safeStr(p.claim_b_summary), safeStr(p.claim_b_argument),
        safeStr(p.evidence_summary),
      ];
      console.log("[submit_case] args char-code check:", submitArgs.map((a, i) =>
        typeof a === "string"
          ? `[${i}]len=${a.length},max=${a.split("").reduce((m, c) => Math.max(m, c.charCodeAt(0)), 0)}`
          : `[${i}]num=${a}`
      ).join(" "));
      const hash = await client.writeContract({ value: BigInt(0),
        address: adjAddr,
        functionName: "submit_case",
        args: submitArgs,
      });
      return NextResponse.json({ tx_hash: hash, status: "submitted" });
    }

    if (action === "run_judges") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: adjAddr, functionName: "run_judges", args: [p.case_id as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "judges_running" });
    }

    if (action === "calculate_consensus") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: adjAddr, functionName: "calculate_consensus", args: [p.case_id as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "consensus_calculating" });
    }

    if (action === "submit_user_decision") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: adjAddr, functionName: "submit_user_decision",
        args: [p.case_id as string, p.user_address as string, p.decision as string, p.reasoning as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "decision_submitted" });
    }

    if (action === "get_case") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_case", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_verdicts") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_verdicts", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_consensus") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_consensus", args: [p.case_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_user_decision") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_user_decision", args: [p.case_id as string, p.user_address as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_case_count") {
      if (!adjAddr) return NextResponse.json({ error: "Adjudicator not configured" }, { status: 503 });
      const result = await client.readContract({ address: adjAddr, functionName: "get_case_count", args: [] });
      return NextResponse.json({ result });
    }

    // ─── REPUTATION ───
    if (action === "register_user") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: repAddr, functionName: "register_user", args: [p.user_address as string, p.username as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "user_registered" });
    }

    if (action === "update_after_decision") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: repAddr, functionName: "update_after_decision", args: [p.user_address as string, p.is_correct as boolean],
      });
      return NextResponse.json({ tx_hash: hash, status: "reputation_updated" });
    }

    if (action === "get_reputation") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const result = await client.readContract({ address: repAddr, functionName: "get_reputation", args: [p.user_address as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_user_count") {
      if (!repAddr) return NextResponse.json({ error: "Reputation not configured" }, { status: 503 });
      const result = await client.readContract({ address: repAddr, functionName: "get_user_count", args: [] });
      return NextResponse.json({ result });
    }

    // ─── DISPUTE REGISTRY ───
    if (action === "register_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: regAddr, functionName: "register_dispute",
        args: [p.dispute_id as string, p.title as string, p.category as string, p.submitter_address as string],
      });
      return NextResponse.json({ tx_hash: hash, status: "dispute_registered" });
    }

    if (action === "resolve_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const hash = await client.writeContract({ value: BigInt(0),
        address: regAddr, functionName: "resolve_dispute",
        args: [p.dispute_id as string, p.verdict as string, p.confidence as number],
      });
      return NextResponse.json({ tx_hash: hash, status: "dispute_resolved" });
    }

    if (action === "get_dispute") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const result = await client.readContract({ address: regAddr, functionName: "get_dispute", args: [p.dispute_id as string] });
      return NextResponse.json({ result });
    }

    if (action === "get_stats") {
      if (!regAddr) return NextResponse.json({ error: "Registry not configured" }, { status: 503 });
      const result = await client.readContract({ address: regAddr, functionName: "get_stats", args: [] });
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Contract interaction failed";
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[contracts] Error:", message);
    if (stack) console.error("[contracts] Stack:", stack);
    // Include first 6 stack frames in response to identify the exact throw site
    const stackLines = stack?.split("\n").slice(0, 6).join(" | ") ?? "";
    return NextResponse.json({ error: message, _stack: stackLines }, { status: 500 });
  }
}

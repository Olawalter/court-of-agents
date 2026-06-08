"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const categories = [
  { value: "commerce", label: "Commerce Dispute" },
  { value: "service", label: "Service Dispute" },
  { value: "prediction_market", label: "Prediction Market" },
  { value: "dao_governance", label: "DAO Governance" },
  { value: "agent_agreement", label: "Agent Agreement" },
  { value: "contract_interpretation", label: "Contract Interpretation" },
];

/**
 * cleanText — sanitize any user-entered string before it is sent to the API
 * or the GenLayer contract.
 *
 * Steps (mirrors the server-side cleanStr in /api/contracts/route.ts):
 *  1. NFC-normalize so composed/decomposed forms are consistent.
 *  2. Strip BOM (0xFEFF), reverse-BOM (0xFFFE), zero-width spaces/joiners,
 *     null bytes, and the replacement character — all invisible and unsafe
 *     for HTTP headers and contract byte-string encoding.
 *  3. Replace smart quotes, em/en-dashes, ellipsis, bullets, NBSP with
 *     their plain ASCII equivalents so the server never sees them.
 *  4. Trim trailing/leading whitespace.
 *
 * Do NOT use btoa() or charCodeAt()-based byte conversion on contract args —
 * pass cleaned strings directly; the SDK encodes via TextEncoder internally.
 */
function cleanText(value: string): string {
  // 1 — NFC normalise first so combining characters are composed
  let s = value.normalize("NFC");

  // 2 — strip invisible / control characters by char code (no regex literals
  //     containing the BOM char itself, which transpilers may silently strip)
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);

    // Invisible / unsafe — drop entirely
    if (
      code === 0xFEFF || code === 0xFFFE || code === 0xFFFF || // BOM / rev-BOM
      code === 0x200B || code === 0x200C || code === 0x200D || // ZW space/non-joiner/joiner
      code === 0x2060 || code === 0x2061 ||                    // word-joiner, function-app
      code === 0x0000 || code === 0xFFFD ||                    // null, replacement char
      code === 0x00AD                                           // soft hyphen
    ) { continue; }

    // Smart quotes → straight
    if (code === 0x2018 || code === 0x2019) { out += "'"; continue; }
    if (code === 0x201C || code === 0x201D) { out += '"'; continue; }
    if (code === 0x00AB || code === 0x00BB) { out += '"'; continue; }

    // Em-dash / en-dash / horizontal bar → hyphen
    if (code === 0x2013 || code === 0x2014 || code === 0x2015) { out += "-"; continue; }

    // Horizontal ellipsis → three dots
    if (code === 0x2026) { out += "..."; continue; }

    // Various bullet characters → hyphen
    if (code === 0x2022 || code === 0x2023 || code === 0x2043 ||
        code === 0x25CF || code === 0x25E6) { out += "-"; continue; }

    // Non-breaking space → regular space
    if (code === 0x00A0) { out += " "; continue; }

    // Keep everything else (including normal Unicode text)
    out += s[i];
  }

  return out.trim();
}

export default function CreateCasePage() {
  const { connected, address, privateKey } = useWallet();
  const router = useRouter();
  const [step, setStep] = useState<"form" | "submitting" | "success">("form");
  const [submitStage, setSubmitStage] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const [savedCaseId, setSavedCaseId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("commerce");
  const [difficulty, setDifficulty] = useState(3);
  const [claimAName, setClaimAName] = useState("");
  const [claimASummary, setClaimASummary] = useState("");
  const [claimAArgument, setClaimAArgument] = useState("");
  const [claimAOutcome, setClaimAOutcome] = useState("");
  const [claimBName, setClaimBName] = useState("");
  const [claimBSummary, setClaimBSummary] = useState("");
  const [claimBArgument, setClaimBArgument] = useState("");
  const [claimBOutcome, setClaimBOutcome] = useState("");
  const [evidence, setEvidence] = useState("");

  if (!connected) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Card className="text-center py-8 px-12">
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">Connect Your Wallet</h2>
            <p className="text-sm text-neutral-600 mb-4">You need a wallet to create cases on-chain.</p>
            <Link href="/login"><Button>Connect Wallet</Button></Link>
          </Card>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStep("submitting");

    // Clean every user-entered string: NFC-normalise, strip BOM + zero-width
    // chars, replace smart punctuation with ASCII equivalents.
    // Do NOT use btoa() or charCodeAt() byte conversion on these strings —
    // the GenLayer SDK encodes via TextEncoder internally.
    const c = cleanText;
    const cleanTitle       = c(title);
    const cleanDesc        = c(description);
    const cleanAName       = c(claimAName);
    const cleanASummary    = c(claimASummary);
    const cleanAArgument   = c(claimAArgument);
    const cleanAOutcome    = c(claimAOutcome);
    const cleanBName       = c(claimBName);
    const cleanBSummary    = c(claimBSummary);
    const cleanBArgument   = c(claimBArgument);
    const cleanBOutcome    = c(claimBOutcome);
    const cleanEvidence    = c(evidence) || "No additional evidence provided.";

    try {
      // ── Step 1: Save to Supabase ──────────────────────────────────────────
      setSubmitStage("Saving case...");
      const supaRes = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: cleanTitle,
          description: cleanDesc,
          category,
          difficulty,
          claim_a: {
            agent_name: cleanAName,
            summary: cleanASummary,
            detailed_argument: cleanAArgument,
            requested_outcome: cleanAOutcome,
          },
          claim_b: {
            agent_name: cleanBName,
            summary: cleanBSummary,
            detailed_argument: cleanBArgument,
            requested_outcome: cleanBOutcome,
          },
        }),
      });

      const supaData = await supaRes.json();
      if (!supaRes.ok) throw new Error(supaData.error || "Failed to save case");
      const caseId = supaData.id as string;
      setSavedCaseId(caseId);

      // ── Step 2: Submit to GenLayer contract ───────────────────────────────
      setSubmitStage("Submitting on-chain...");
      const contractRes = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_case",
          private_key: privateKey,
          params: {
            case_id: caseId,
            title: cleanTitle,
            description: cleanDesc,
            category,
            difficulty,
            claim_a_name:      cleanAName,
            claim_a_summary:   cleanASummary,
            claim_a_argument:  cleanAArgument,
            claim_b_name:      cleanBName,
            claim_b_summary:   cleanBSummary,
            claim_b_argument:  cleanBArgument,
            evidence_summary:  cleanEvidence,
          },
        }),
      });

      const contractData = await contractRes.json();
      if (!contractRes.ok) throw new Error(contractData.error || "On-chain submission failed");
      if (contractData.tx_hash) setTxHash(contractData.tx_hash);

      // ── Step 3: Register in dispute registry (non-blocking) ───────────────
      setSubmitStage("Registering dispute...");
      await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_dispute",
          private_key: privateKey,
          params: {
            dispute_id: caseId,
            title: cleanTitle,
            category,
            submitter_address: address,
          },
        }),
      }).catch(() => {}); // non-critical — don't block on failure

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Case Submitted!</h1>
            <p className="text-sm text-neutral-600 mb-6">
              Your case has been saved and recorded on GenLayer StudioNet.
            </p>

            {txHash && (
              <Card className="mb-6 text-left">
                <div className="text-xs text-neutral-500 uppercase mb-1">Transaction Hash</div>
                <div className="font-mono text-xs text-neutral-700 break-all">{txHash}</div>
              </Card>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push(`/cases/${savedCaseId}`)}>
                View Case
              </Button>
              <Button variant="secondary" onClick={() => router.push("/cases")}>
                All Cases
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Submitting overlay ─────────────────────────────────────────────────────
  if (step === "submitting") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
            <p className="text-sm font-medium text-neutral-700">{submitStage}</p>
            <p className="mt-1 text-xs text-neutral-400">This may take a few seconds</p>
          </div>
        </main>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Link href="/cases" className="text-sm text-neutral-500 hover:text-neutral-700">
            &larr; Back to Cases
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900">Create a Case</h1>
          <p className="mt-1 text-neutral-600">
            Submit a dispute between two AI agents. It will be recorded on GenLayer StudioNet.
          </p>
          <p className="mt-1 text-xs text-neutral-400 font-mono">Submitting from: {address}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Details */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Case Details</h2>
            <div className="space-y-4">
              <Input
                label="Case Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Autonomous Delivery Dispute"
                required
                minLength={5}
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description <span className="text-neutral-400 font-normal">(min 20 chars)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the dispute in detail..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                  rows={3}
                  required
                  minLength={20}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Difficulty (1–5)</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>{d} star{d > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Agent A */}
          <Card className="border-l-4 border-l-blue-500">
            <h2 className="text-lg font-semibold text-blue-700 mb-4">Agent A — Claim</h2>
            <div className="space-y-4">
              <Input label="Agent Name" value={claimAName} onChange={(e) => setClaimAName(e.target.value)} placeholder="MerchantBot Alpha" required />
              <Input label="Summary" value={claimASummary} onChange={(e) => setClaimASummary(e.target.value)} placeholder="One-sentence position" required />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Detailed Argument</label>
                <textarea value={claimAArgument} onChange={(e) => setClaimAArgument(e.target.value)} placeholder="Full argument supporting Agent A..." className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" rows={3} required />
              </div>
              <Input label="Requested Outcome" value={claimAOutcome} onChange={(e) => setClaimAOutcome(e.target.value)} placeholder="What does Agent A want?" required />
            </div>
          </Card>

          {/* Agent B */}
          <Card className="border-l-4 border-l-red-500">
            <h2 className="text-lg font-semibold text-red-700 mb-4">Agent B — Claim</h2>
            <div className="space-y-4">
              <Input label="Agent Name" value={claimBName} onChange={(e) => setClaimBName(e.target.value)} placeholder="ConsumerGuard AI" required />
              <Input label="Summary" value={claimBSummary} onChange={(e) => setClaimBSummary(e.target.value)} placeholder="One-sentence position" required />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Detailed Argument</label>
                <textarea value={claimBArgument} onChange={(e) => setClaimBArgument(e.target.value)} placeholder="Full argument supporting Agent B..." className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" rows={3} required />
              </div>
              <Input label="Requested Outcome" value={claimBOutcome} onChange={(e) => setClaimBOutcome(e.target.value)} placeholder="What does Agent B want?" required />
            </div>
          </Card>

          {/* Evidence */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-1">Evidence Summary</h2>
            <p className="text-xs text-neutral-400 mb-3">Optional. List any supporting evidence for the judges.</p>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Proof-of-delivery photo, customer statement, GPS logs..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
              rows={3}
            />
          </Card>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">Submission failed</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full">
            Submit Case On-Chain
          </Button>
        </form>
      </main>
    </div>
  );
}

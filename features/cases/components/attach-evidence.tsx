"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AttachEvidenceProps {
  caseId: string;
  claimantAddress: string;
  respondentAddress: string;
  hasEvidence: boolean;
}

// Real evidence, not free-text assertions: this calls the contract's
// attach_web_evidence(), which actually fetches the given URL on-chain
// (GenVM validators independently re-fetch the same URL to reach
// consensus) and has an LLM summarize only what's genuinely on the page.
// run_judges() requires at least one of these before judges can run.
export function AttachEvidence({
  caseId,
  claimantAddress,
  respondentAddress,
  hasEvidence,
}: AttachEvidenceProps) {
  const { connected, address, privateKey } = useWallet();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [lastSummary, setLastSummary] = useState("");
  const router = useRouter();

  if (!connected) return null;

  const isParty =
    address.toLowerCase() === claimantAddress.toLowerCase() ||
    address.toLowerCase() === respondentAddress.toLowerCase();
  if (!isParty) return null;

  const submittedBy = address.toLowerCase() === claimantAddress.toLowerCase() ? "claimant" : "respondent";

  async function handleSubmit() {
    if (!url || !label) {
      setError("Enter both a URL and a short label for this evidence.");
      return;
    }

    setLoading(true);
    setError("");
    setLastSummary("");

    try {
      // Step 1: fetch + verify on-chain via GenLayer's web access
      setStep("Fetching and verifying via GenLayer LLM...");
      const contractRes = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach_web_evidence",
          private_key: privateKey,
          params: { case_id: caseId, url, label },
        }),
      });
      const contractData = await contractRes.json();
      if (!contractRes.ok) throw new Error(contractData.error || "Failed to fetch evidence");

      // Step 2: read back the verified summary that was actually stored
      setStep("Reading verified summary...");
      const readRes = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_evidence_fetch",
          params: { case_id: caseId, url },
        }),
      });
      const readData = await readRes.json();
      const fetched = readData.result ? JSON.parse(readData.result) : null;
      const summary = fetched?.summary || "";
      setLastSummary(summary);

      // Step 3: mirror into Supabase for display
      if (summary) {
        await fetch("/api/evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: caseId,
            url,
            label,
            summary,
            submitted_by: submittedBy,
          }),
        }).catch(() => {});
      }

      setUrl("");
      setLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <Card className="mb-4 border-l-4 border-l-brand-500">
      <h3 className="text-base font-semibold text-neutral-900 mb-1">Attach Web Evidence</h3>
      <p className="text-xs text-neutral-500 mb-4">
        Paste a URL — GenLayer fetches the live page and an LLM summarizes
        only what's genuinely there.{" "}
        {!hasEvidence && (
          <span className="text-amber-600 font-medium">
            At least one evidence entry is required before judges can run.
          </span>
        )}
      </p>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto] items-end">
        <Input
          label="Evidence URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/proof-of-delivery"
        />
        <Input
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Delivery receipt"
        />
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? step || "Working..." : "Fetch & Attach"}
        </Button>
      </div>

      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}

      {lastSummary && (
        <div className="mt-3 rounded-lg bg-brand-50 border border-brand-100 p-3">
          <div className="text-xs font-medium text-brand-700 mb-1">Verified summary</div>
          <p className="text-sm text-neutral-700">{lastSummary}</p>
        </div>
      )}
    </Card>
  );
}

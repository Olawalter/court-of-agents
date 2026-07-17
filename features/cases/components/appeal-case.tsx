"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createBrowserClient, CONTRACT_ADDRESS, sanitizeArg } from "@/lib/genlayer-browser";

interface AppealCaseProps {
  caseId: string;
  caseStatus: string;
  claimantAddress: string;
  respondentAddress: string;
}

export function AppealCase({
  caseId,
  caseStatus,
  claimantAddress,
  respondentAddress,
}: AppealCaseProps) {
  const { connected, address } = useWallet();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [newEvidence, setNewEvidence] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (caseStatus !== "consensus_reached" || !connected) return null;

  const isParty =
    address.toLowerCase() === claimantAddress.toLowerCase() ||
    address.toLowerCase() === respondentAddress.toLowerCase();
  if (!isParty) return null;

  if (submitted) {
    return (
      <Card className="border-amber-200 bg-amber-50/30 text-center py-6 mb-8">
        <p className="text-amber-700 font-medium">
          Appeal recorded on-chain — the case has reopened for a fresh round of judges.
        </p>
      </Card>
    );
  }

  async function handleAppeal() {
    if (reason.length < 10) {
      setError("Give at least 10 characters explaining the appeal.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // The contract verifies the caller is the claimant or respondent via
      // gl.message.sender_address — no need to pass the address explicitly.
      const client = createBrowserClient(address);
      const hash = await client.writeContract({
        value: BigInt(0),
        address: CONTRACT_ADDRESS,
        functionName: "appeal_case",
        args: [sanitizeArg(caseId), sanitizeArg(reason), sanitizeArg(newEvidence)],
      });
      await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });

      await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "pending" }),
      }).catch(() => {});

      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mb-8">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Appeal This Verdict
        </Button>
      </div>
    );
  }

  return (
    <Card className="mb-8 border-l-4 border-l-amber-500">
      <h3 className="text-base font-semibold text-neutral-900 mb-1">Appeal this verdict</h3>
      <p className="text-xs text-neutral-500 mb-4">
        Only the claimant or respondent may appeal. This reopens the case for
        a fresh 6-judge round, optionally with new evidence.
      </p>

      <label htmlFor="appeal-reason" className="block text-sm font-medium text-neutral-700 mb-1">
        Reason
      </label>
      <textarea
        id="appeal-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why should this be reconsidered? (at least 10 characters)"
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm mb-3 focus:border-brand-500 focus:outline-none resize-none"
        rows={2}
      />

      <label htmlFor="appeal-evidence" className="block text-sm font-medium text-neutral-700 mb-1">
        New Evidence <span className="text-neutral-400 font-normal">(optional)</span>
      </label>
      <textarea
        id="appeal-evidence"
        value={newEvidence}
        onChange={(e) => setNewEvidence(e.target.value)}
        placeholder="Anything new since the original ruling..."
        className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm mb-3 focus:border-brand-500 focus:outline-none resize-none"
        rows={2}
      />

      {error && <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleAppeal} disabled={loading}>
          {loading ? "Submitting appeal..." : "Submit Appeal On-Chain"}
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface SubmitOnChainButtonProps {
  caseId: string;
  caseTitle: string;
  claimASummary: string;
  claimBSummary: string;
  consensusVerdict: string;
  hasOnChainTx: boolean;
}

export function SubmitOnChainButton({
  caseId,
  caseTitle,
  claimASummary,
  claimBSummary,
  consensusVerdict,
  hasOnChainTx,
}: SubmitOnChainButtonProps) {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const { privateKey } = useWallet();
  const router = useRouter();

  if (hasOnChainTx) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Recorded on-chain
      </div>
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // Register dispute on-chain
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_dispute",
          private_key: privateKey,
          params: {
            dispute_id: caseId,
            title: caseTitle,
            claim_a: claimASummary,
            claim_b: claimBSummary,
            evidence_summary: `Consensus verdict: ${consensusVerdict}`,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit on-chain");
      }

      const data = await res.json();
      setTxHash(data.tx_hash);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleSubmit}
        disabled={loading}
        variant="secondary"
        size="sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            Submitting to StudioNet...
          </span>
        ) : (
          "Submit On-Chain"
        )}
      </Button>

      {txHash && (
        <p className="text-xs text-green-600">
          TX: {txHash.substring(0, 16)}...
        </p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

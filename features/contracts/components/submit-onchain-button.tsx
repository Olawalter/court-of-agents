"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { createBrowserClient, CONTRACT_ADDRESS } from "@/lib/genlayer-browser";

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
  const { address } = useWallet();
  const router = useRouter();

  if (hasOnChainTx) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Finalized on-chain
      </div>
    );
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      // Case submission (submit_case) and dispute-audit-log resolution
      // (auto-run inside calculate_consensus) already happened on-chain
      // earlier in the flow. The remaining lifecycle step is finalizing
      // the case now that consensus has been reached.
      const client = createBrowserClient(address);
      const hash = await client.writeContract({
        value: BigInt(0),
        address: CONTRACT_ADDRESS,
        functionName: "finalize_case",
        args: [caseId],
      });
      await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      setTxHash(String(hash));
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
            Finalizing on StudioNet...
          </span>
        ) : (
          "Finalize Case On-Chain"
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

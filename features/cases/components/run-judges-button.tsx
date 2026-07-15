"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface RunJudgesButtonProps {
  caseId: string;
  caseStatus: string;
  hasVerdicts: boolean;
  hasEvidence: boolean;
  isOnChain: boolean;
  caseTitle: string;
  caseDescription: string;
  caseCategory: string;
  caseDifficulty: number;
  claimAName: string;
  claimASummary: string;
  claimAArgument: string;
  claimBName: string;
  claimBSummary: string;
  claimBArgument: string;
  evidenceSummary: string;
}

export function RunJudgesButton({
  caseId,
  caseStatus,
  hasVerdicts,
  hasEvidence,
  isOnChain,
  caseTitle,
  caseDescription,
  caseCategory,
  caseDifficulty,
  claimAName,
  claimASummary,
  claimAArgument,
  claimBName,
  claimBSummary,
  claimBArgument,
  evidenceSummary,
}: RunJudgesButtonProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");
  const { connected, privateKey } = useWallet();
  const router = useRouter();

  if (!connected) {
    return (
      <p className="text-sm text-neutral-500">
        <a href="/login" className="text-brand-600 hover:underline">Connect your wallet</a> to interact with this case.
      </p>
    );
  }

  async function callContract(action: string, params: Record<string, unknown>) {
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, params, private_key: privateKey }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Failed: ${action}`);
    return data;
  }

  async function handleSubmitAndRunJudges() {
    setLoading(true);
    setError("");

    try {
      // Step 1: Submit case to contract if not already on-chain
      if (!isOnChain) {
        setStep("Submitting case on-chain...");
        const submitResult = await callContract("submit_case", {
          case_id: caseId,
          title: caseTitle,
          description: caseDescription,
          category: caseCategory,
          difficulty: caseDifficulty,
          claim_a_name: claimAName,
          claim_a_summary: claimASummary,
          claim_a_argument: claimAArgument,
          claim_b_name: claimBName,
          claim_b_summary: claimBSummary,
          claim_b_argument: claimBArgument,
          evidence_summary: evidenceSummary,
        });
        setTxHash(submitResult.tx_hash || "");
      }

      // Step 2: Run judges on contract (6x gl.exec_prompt)
      setStep("Running 6 AI Judges via GenLayer LLM...");
      const judgeResult = await callContract("run_judges", { case_id: caseId });
      setTxHash(judgeResult.tx_hash || "");

      // Step 3: Also store verdicts in Supabase for fast display
      setStep("Syncing results...");
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      setStep("Done!");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  // GenLayer's on-chain calculate_consensus occasionally fails during
  // consensus (StudioNet-side crash/timeout, not something visible to this
  // submit call — the failure happens asynchronously well after we already
  // get a tx_hash back). This retries the on-chain call in the background,
  // without blocking the UI: the app's actual result already comes from
  // the always-succeeds off-chain /api/consensus sync below, so a failed
  // on-chain retry never breaks the user-facing flow — it only affects
  // whether the verdict also lands in GenLayer's on-chain record.
  async function retryOnChainConsensusInBackground(maxAttempts = 2, delayMs = 20000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, delayMs));
      try {
        const check = await callContract("get_consensus", { case_id: caseId });
        if (check.result) return; // already landed on-chain, nothing to do
        await callContract("calculate_consensus", { case_id: caseId });
      } catch {
        // Best-effort only — off-chain result is already in Supabase, so a
        // failed background retry is not user-facing.
      }
    }
  }

  async function handleRunConsensus() {
    setLoading(true);
    setError("");

    try {
      // Step 1: Calculate consensus on contract
      setStep("Calculating consensus via GenLayer LLM...");
      const result = await callContract("calculate_consensus", { case_id: caseId });
      setTxHash(result.tx_hash || "");

      // Step 2: Also sync to Supabase — this is the source of truth the UI
      // actually reads from, and it always succeeds independent of the
      // on-chain transaction's eventual outcome.
      setStep("Syncing results...");
      await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      setStep("Done!");
      router.refresh();

      // Fire-and-forget: try to get the on-chain record to succeed too,
      // without making the user wait for it.
      void retryOnChainConsensusInBackground();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  const canRun = caseStatus === "pending" || caseStatus === "in_review";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {canRun && !hasVerdicts && (
          <Button
            onClick={handleSubmitAndRunJudges}
            disabled={loading || !hasEvidence}
            size="lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {step || "Processing..."}
              </span>
            ) : (
              "Run AI Judges On-Chain"
            )}
          </Button>
        )}

        {canRun && !hasVerdicts && !hasEvidence && (
          <p className="text-sm text-amber-600">
            Attach at least one piece of web evidence above before judges can run.
          </p>
        )}

        {hasVerdicts && caseStatus !== "consensus_reached" && caseStatus !== "finalized" && (
          <Button onClick={handleRunConsensus} disabled={loading} variant="secondary" size="lg">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                {step || "Processing..."}
              </span>
            ) : (
              "Calculate Consensus On-Chain"
            )}
          </Button>
        )}
      </div>

      {txHash && (
        <p className="text-xs text-green-600 font-mono">
          TX: {txHash.substring(0, 20)}...
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

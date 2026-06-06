"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface RunJudgesButtonProps {
  caseId: string;
  caseStatus: string;
  hasVerdicts: boolean;
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

  async function handleRunConsensus() {
    setLoading(true);
    setError("");

    try {
      // Step 1: Calculate consensus on contract
      setStep("Calculating consensus via GenLayer LLM...");
      const result = await callContract("calculate_consensus", { case_id: caseId });
      setTxHash(result.tx_hash || "");

      // Step 2: Also sync to Supabase
      setStep("Syncing results...");
      await fetch("/api/consensus", {
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

  const canRun = caseStatus === "pending" || caseStatus === "in_review";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        {canRun && !hasVerdicts && (
          <Button onClick={handleSubmitAndRunJudges} disabled={loading} size="lg">
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createBrowserClient,
  CONTRACT_ADDRESS,
  fetchVerdictsFromContract,
  fetchConsensusFromContract,
  type OnChainVerdict,
  type OnChainConsensus,
} from "@/lib/genlayer-browser";

interface RunJudgesButtonProps {
  caseId: string;
  caseStatus: string;
  hasVerdicts: boolean;
  hasEvidence: boolean;
}

const verdictLabels: Record<string, string> = {
  FAVOR_A: "Favor Agent A",
  FAVOR_B: "Favor Agent B",
  PARTIAL_A: "Partial — Agent A",
  PARTIAL_B: "Partial — Agent B",
  DISMISS: "Dismissed",
};

function verdictBadgeVariant(v: string): "info" | "danger" | "warning" | "default" {
  if (v.startsWith("FAVOR_A") || v.startsWith("PARTIAL_A")) return "info";
  if (v.startsWith("FAVOR_B") || v.startsWith("PARTIAL_B")) return "danger";
  return "warning";
}

export function RunJudgesButton({
  caseId,
  caseStatus,
  hasVerdicts: initialHasVerdicts,
  hasEvidence,
}: RunJudgesButtonProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  // On-chain results fetched after finalization — displayed inline without
  // requiring a full page reload (router.refresh() is still called so the
  // server component also re-renders with the fresh contract data).
  const [liveVerdicts, setLiveVerdicts] = useState<OnChainVerdict[] | null>(null);
  const [liveConsensus, setLiveConsensus] = useState<OnChainConsensus | null>(null);
  const [hasVerdicts, setHasVerdicts] = useState(initialHasVerdicts);

  const { connected, address } = useWallet();
  const router = useRouter();

  if (!connected) {
    return (
      <p className="text-sm text-neutral-500">
        <a href="/login" className="text-brand-600 hover:underline">
          Connect your wallet
        </a>{" "}
        to interact with this case.
      </p>
    );
  }

  /** Submit a write transaction through the injected wallet and wait for ACCEPTED. */
  async function writeAndWait(
    functionName: string,
    args: unknown[],
    stepLabel: string
  ): Promise<string> {
    setStep(stepLabel);
    const client = createBrowserClient(address);
    const hash = await client.writeContract({
      value: BigInt(0),
      address: CONTRACT_ADDRESS,
      functionName,
      args,
    });
    setTxHash(String(hash));
    setStep("Waiting for GenLayer consensus...");
    // waitForTransactionReceipt polls until ACCEPTED (leader + validators agreed)
    await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });
    return String(hash);
  }

  async function handleRunJudges() {
    setLoading(true);
    setError("");
    try {
      // Run the 6-judge panel on-chain; MetaMask shows approval popup
      await writeAndWait("run_judges", [caseId], "Running 6 AI judges on-chain...");

      // Read the verified verdicts directly from the contract
      setStep("Reading verdicts from contract...");
      const verdicts = await fetchVerdictsFromContract(caseId);
      if (verdicts?.length) {
        setLiveVerdicts(verdicts);
        setHasVerdicts(true);
      }

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
      // Calculate consensus on-chain
      await writeAndWait(
        "calculate_consensus",
        [caseId],
        "Calculating consensus via GenLayer LLM..."
      );

      // Read the verified consensus directly from the contract
      setStep("Reading consensus from contract...");
      const consensus = await fetchConsensusFromContract(caseId);
      if (consensus) setLiveConsensus(consensus);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setStep("");
    }
  }

  const canRun =
    caseStatus === "pending" ||
    caseStatus === "in_review" ||
    caseStatus === "deliberating";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        {canRun && !hasVerdicts && (
          <Button
            onClick={handleRunJudges}
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
            Attach at least one piece of web evidence before judges can run.
          </p>
        )}

        {hasVerdicts &&
          caseStatus !== "consensus_reached" &&
          caseStatus !== "finalized" && (
            <Button
              onClick={handleRunConsensus}
              disabled={loading}
              variant="secondary"
              size="lg"
            >
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
          TX: {txHash.substring(0, 20)}...{" "}
          <span className="text-neutral-400">(confirmed on StudioNet)</span>
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Verdicts fetched live from the contract after run_judges finalizes */}
      {liveVerdicts && liveVerdicts.length > 0 && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-neutral-900 mb-3">
            Judge Verdicts{" "}
            <span className="text-xs font-normal text-green-600">
              — verified on-chain
            </span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveVerdicts.map((v) => (
              <Card key={v.persona}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-neutral-900 capitalize">
                    {v.persona} Judge
                  </h4>
                  <span className="text-lg font-bold text-brand-600">
                    {v.confidence}%
                  </span>
                </div>
                <Badge variant={verdictBadgeVariant(v.verdict)} className="mb-2">
                  {verdictLabels[v.verdict] || v.verdict}
                </Badge>
                <p className="text-sm text-neutral-600 line-clamp-4">{v.reasoning}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Consensus fetched live from the contract after calculate_consensus finalizes */}
      {liveConsensus && (
        <div className="mt-4">
          <h3 className="text-base font-semibold text-neutral-900 mb-3">
            Consensus Result{" "}
            <span className="text-xs font-normal text-green-600">
              — verified on-chain
            </span>
          </h3>
          <Card className="border-2 border-brand-200 bg-brand-50/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge variant="success" className="text-sm px-3 py-1">
                  {verdictLabels[liveConsensus.final_verdict] ||
                    liveConsensus.final_verdict}
                </Badge>
                <span className="ml-3 text-sm text-neutral-600">
                  Method: {liveConsensus.method.replace(/_/g, " ")}
                </span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-600">
                  {liveConsensus.overall_confidence}%
                </div>
                <div className="text-xs text-neutral-500">confidence</div>
              </div>
            </div>
            <p className="text-sm text-neutral-700 mb-3">
              {liveConsensus.resolution_explanation}
            </p>
            <div className="text-xs text-neutral-500">
              Agreement: {Math.round(liveConsensus.agreement_ratio * 100)}% |
              Judges: {liveConsensus.participating_judges.length}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

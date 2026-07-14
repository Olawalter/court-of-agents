"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

interface SubmitDecisionProps {
  caseId: string;
  hasConsensus: boolean;
}

const verdictOptions = [
  { value: "FAVOR_A", label: "Favor Agent A", color: "border-blue-300 bg-blue-50 hover:border-blue-500" },
  { value: "FAVOR_B", label: "Favor Agent B", color: "border-red-300 bg-red-50 hover:border-red-500" },
  { value: "PARTIAL_A", label: "Partial — Agent A", color: "border-blue-200 bg-blue-50/50 hover:border-blue-400" },
  { value: "PARTIAL_B", label: "Partial — Agent B", color: "border-red-200 bg-red-50/50 hover:border-red-400" },
  { value: "DISMISS", label: "Dismiss", color: "border-neutral-300 bg-neutral-50 hover:border-neutral-500" },
];

export function SubmitDecision({ caseId, hasConsensus }: SubmitDecisionProps) {
  const { connected, address, privateKey } = useWallet();
  const [selectedVerdict, setSelectedVerdict] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  if (!connected) {
    return (
      <Card className="text-center py-6">
        <p className="text-neutral-500">
          <a href="/login" className="text-brand-600 hover:underline">Connect your wallet</a> to submit your verdict on-chain.
        </p>
      </Card>
    );
  }

  if (!hasConsensus) return null;

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/30 text-center py-6">
        <p className="text-green-700 font-medium">Your decision has been recorded on-chain!</p>
        {txHash && (
          <p className="text-xs text-green-600 mt-1 font-mono">TX: {txHash}</p>
        )}
      </Card>
    );
  }

  async function handleSubmit() {
    if (!selectedVerdict || reasoning.length < 10) {
      setError("Select a verdict and provide at least 10 characters of reasoning.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Submit decision on-chain via Adjudicator contract
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_user_decision",
          private_key: privateKey,
          params: {
            case_id: caseId,
            user_address: address,
            decision: selectedVerdict,
            reasoning,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit decision");
      }

      setTxHash(data.tx_hash || "");
      setSubmitted(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Your Verdict</h2>
      <Card>
        <CardTitle className="text-base mb-2">
          What is your decision on this case?
        </CardTitle>
        <p className="text-xs text-neutral-500 mb-4">
          Your decision will be submitted on-chain from wallet{" "}
          <span aria-label={`wallet address ${address}`}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </p>

        <div role="radiogroup" aria-label="Verdict options" className="grid gap-2 md:grid-cols-5 mb-4">
          {verdictOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selectedVerdict === opt.value}
              onClick={() => setSelectedVerdict(opt.value)}
              className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                selectedVerdict === opt.value
                  ? "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200"
                  : opt.color + " text-neutral-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label htmlFor="verdict-reasoning" className="sr-only">
          Your reasoning
        </label>
        <textarea
          id="verdict-reasoning"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          placeholder="Explain your reasoning (at least 10 characters)..."
          aria-describedby={error ? "verdict-error" : undefined}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
          rows={3}
        />

        {error && (
          <p id="verdict-error" role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} disabled={loading || !selectedVerdict}>
            {loading ? "Submitting on-chain..." : "Submit Decision On-Chain"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

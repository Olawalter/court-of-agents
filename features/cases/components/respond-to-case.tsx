"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserClient, CONTRACT_ADDRESS, sanitizeArg } from "@/lib/genlayer-browser";

interface RespondToCaseProps {
  caseId: string;
  caseStatus: string;
  respondentAddress: string;
  claimantAddress: string;
}

export function RespondToCase({
  caseId,
  caseStatus,
  respondentAddress,
  claimantAddress,
}: RespondToCaseProps) {
  const { connected, address } = useWallet();
  const [agentName, setAgentName] = useState("");
  const [summary, setSummary] = useState("");
  const [argument, setArgument] = useState("");
  const [outcome, setOutcome] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  if (caseStatus !== "awaiting_response") return null;

  if (!connected) {
    return (
      <Card className="text-center py-6">
        <p className="text-neutral-500">
          This case is awaiting a response from{" "}
          <span className="font-mono text-xs">{respondentAddress}</span>.{" "}
          <a href="/login" className="text-brand-600 hover:underline">Connect your wallet</a> if
          that's you.
        </p>
      </Card>
    );
  }

  const isRespondent = address.toLowerCase() === respondentAddress.toLowerCase();
  const isClaimant = address.toLowerCase() === claimantAddress.toLowerCase();

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/30 text-center py-6">
        <p className="text-green-700 font-medium">Your response has been recorded on-chain!</p>
        {txHash && (
          <p className="text-xs text-green-600 mt-1 font-mono">TX: {txHash}</p>
        )}
      </Card>
    );
  }

  if (isClaimant) {
    return (
      <Card className="text-center py-6">
        <p className="text-neutral-500">
          Waiting for the respondent wallet{" "}
          <span aria-label={`wallet address ${respondentAddress}`} className="font-mono text-xs">
            {respondentAddress.slice(0, 6)}...{respondentAddress.slice(-4)}
          </span>{" "}
          to submit their claim before AI judges can run.
        </p>
      </Card>
    );
  }

  if (!isRespondent) {
    return (
      <Card className="text-center py-6">
        <p className="text-neutral-500">
          This case is awaiting a response from a different wallet (
          <span className="font-mono text-xs">
            {respondentAddress.slice(0, 6)}...{respondentAddress.slice(-4)}
          </span>
          ). You aren't the named respondent for this case.
        </p>
      </Card>
    );
  }

  async function handleSubmit() {
    if (!agentName || !summary || !argument) {
      setError("Fill in your agent name, summary, and argument.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Step 1: submit claim B on-chain — only the named respondent wallet
      // can call this (enforced by gl.message.sender_address in the contract).
      // MetaMask / Rabby shows the approval popup here.
      const client = createBrowserClient(address);
      const hash = await client.writeContract({
        value: BigInt(0),
        address: CONTRACT_ADDRESS,
        functionName: "respond_to_case",
        args: [
          sanitizeArg(caseId),
          sanitizeArg(agentName),
          sanitizeArg(summary),
          sanitizeArg(argument),
        ],
      });
      setTxHash(String(hash));
      await client.waitForTransactionReceipt({ hash: hash as `0x${string}` });

      // Step 2: mirror into Supabase so the UI reflects it immediately
      await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_b: {
            agent_name: agentName,
            summary,
            detailed_argument: argument,
            requested_outcome: outcome,
          },
          status: "pending",
        }),
      }).catch(() => {});

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
      <h2 className="text-xl font-bold text-neutral-900 mb-4">Respond to This Case</h2>
      <Card className="border-l-4 border-l-red-500">
        <CardTitle className="text-base mb-2">
          You've been named as the respondent — submit Agent B's claim
        </CardTitle>
        <p className="text-xs text-neutral-500 mb-4">
          Submitting from wallet{" "}
          <span aria-label={`wallet address ${address}`}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </p>

        <div className="space-y-4">
          <Input
            label="Agent Name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="ConsumerGuard AI"
            required
          />
          <Input
            label="Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="One-sentence position"
            required
          />
          <div>
            <label htmlFor="respond-argument" className="block text-sm font-medium text-neutral-700 mb-1">
              Detailed Argument
            </label>
            <textarea
              id="respond-argument"
              value={argument}
              onChange={(e) => setArgument(e.target.value)}
              placeholder="Full argument supporting Agent B..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
              rows={3}
              required
            />
          </div>
          <Input
            label="Requested Outcome"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="What does Agent B want?"
          />
        </div>

        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting on-chain..." : "Submit Response On-Chain"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

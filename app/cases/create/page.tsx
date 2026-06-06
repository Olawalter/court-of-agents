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

export default function CreateCasePage() {
  const { connected, address, privateKey } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

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
            <Link href="/login">
              <Button>Connect Wallet</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const caseId = crypto.randomUUID();

    try {
      // Step 1: Submit to Supabase for fast reads
      const supaRes = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          difficulty,
          claim_a: {
            agent_name: claimAName,
            summary: claimASummary,
            detailed_argument: claimAArgument,
            requested_outcome: claimAOutcome,
          },
          claim_b: {
            agent_name: claimBName,
            summary: claimBSummary,
            detailed_argument: claimBArgument,
            requested_outcome: claimBOutcome,
          },
        }),
      });

      if (!supaRes.ok) {
        const data = await supaRes.json();
        throw new Error(data.error || "Failed to create case");
      }

      const supaData = await supaRes.json();
      const savedCaseId = supaData.id;

      // Step 2: Submit to GenLayer contract
      const contractRes = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_case",
          private_key: privateKey,
          params: {
            case_id: savedCaseId,
            title,
            description,
            category,
            difficulty,
            claim_a_name: claimAName,
            claim_a_summary: claimASummary,
            claim_a_argument: claimAArgument,
            claim_b_name: claimBName,
            claim_b_summary: claimBSummary,
            claim_b_argument: claimBArgument,
            evidence_summary: evidence || "No additional evidence provided.",
          },
        }),
      });

      const contractData = await contractRes.json();
      if (contractData.tx_hash) {
        setTxHash(contractData.tx_hash);
      }

      // Step 3: Also register in dispute registry
      await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_dispute",
          private_key: privateKey,
          params: {
            dispute_id: savedCaseId,
            title,
            category,
            submitter_address: address,
          },
        }),
      });

      router.push(`/cases/${savedCaseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8">
          <Link href="/cases" className="text-sm text-neutral-500 hover:text-neutral-700">
            ← Back to Cases
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-neutral-900">Create a Case</h1>
          <p className="mt-1 text-neutral-600">
            Submit a dispute between two AI agents. It will be recorded on GenLayer StudioNet.
          </p>
          <p className="mt-1 text-xs text-neutral-400 font-mono">
            Submitting from: {address}
          </p>
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
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
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Difficulty (1-5)</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>{d} — {"★".repeat(d) + "☆".repeat(5 - d)}</option>
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
              <Input label="Summary" value={claimASummary} onChange={(e) => setClaimASummary(e.target.value)} placeholder="Brief summary of Agent A's position" required />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Detailed Argument</label>
                <textarea value={claimAArgument} onChange={(e) => setClaimAArgument(e.target.value)} placeholder="Full argument..." className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" rows={3} required />
              </div>
              <Input label="Requested Outcome" value={claimAOutcome} onChange={(e) => setClaimAOutcome(e.target.value)} placeholder="What does Agent A want?" required />
            </div>
          </Card>

          {/* Agent B */}
          <Card className="border-l-4 border-l-red-500">
            <h2 className="text-lg font-semibold text-red-700 mb-4">Agent B — Claim</h2>
            <div className="space-y-4">
              <Input label="Agent Name" value={claimBName} onChange={(e) => setClaimBName(e.target.value)} placeholder="ConsumerGuard AI" required />
              <Input label="Summary" value={claimBSummary} onChange={(e) => setClaimBSummary(e.target.value)} placeholder="Brief summary of Agent B's position" required />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Detailed Argument</label>
                <textarea value={claimBArgument} onChange={(e) => setClaimBArgument(e.target.value)} placeholder="Full argument..." className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none" rows={3} required />
              </div>
              <Input label="Requested Outcome" value={claimBOutcome} onChange={(e) => setClaimBOutcome(e.target.value)} placeholder="What does Agent B want?" required />
            </div>
          </Card>

          {/* Evidence */}
          <Card>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Evidence Summary</h2>
            <textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Summarize any evidence relevant to this dispute..."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none resize-none"
              rows={4}
            />
          </Card>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {txHash && <p className="text-xs text-green-600 font-mono">TX: {txHash}</p>}

          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Submitting On-Chain..." : "Submit Case On-Chain"}
          </Button>
        </form>
      </main>
    </div>
  );
}

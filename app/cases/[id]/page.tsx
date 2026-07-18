import { notFound } from "next/navigation";
import Link from "next/link";
import { getGenLayerClient, CONTRACT_ADDRESSES } from "@/services/genlayer/client";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RunJudgesButton } from "@/features/cases/components/run-judges-button";
import { SubmitOnChainButton } from "@/features/contracts/components/submit-onchain-button";
import { SubmitDecision } from "@/features/cases/components/submit-decision";
import { RespondToCase } from "@/features/cases/components/respond-to-case";
import { AppealCase } from "@/features/cases/components/appeal-case";
import { AttachEvidence } from "@/features/cases/components/attach-evidence";
import type { OnChainVerdict, OnChainConsensus } from "@/lib/genlayer-browser";

export const dynamic = "force-dynamic";

const statusVariants: Record<string, "default" | "info" | "warning" | "success" | "danger"> = {
  awaiting_response: "warning",
  pending: "default",
  in_review: "info",
  deliberating: "warning",
  consensus_reached: "success",
  appealed: "danger",
  finalized: "success",
};

const verdictLabels: Record<string, string> = {
  FAVOR_A: "Favor Agent A",
  FAVOR_B: "Favor Agent B",
  PARTIAL_A: "Partial — Agent A",
  PARTIAL_B: "Partial — Agent B",
  DISMISS: "Dismissed",
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let caseData: Record<string, any> | null = null;
  let verdicts: OnChainVerdict[] | null = null;
  let consensus: OnChainConsensus | null = null;

  try {
    const { client } = getGenLayerClient();
    const addr = CONTRACT_ADDRESSES.adjudicator;

    const [rawCase, rawVerdicts, rawConsensus] = await Promise.all([
      client.readContract({ address: addr, functionName: "get_case", args: [id] }),
      client.readContract({ address: addr, functionName: "get_verdicts", args: [id] }),
      client.readContract({ address: addr, functionName: "get_consensus", args: [id] }),
    ]);

    if (rawCase) {
      const parsed = JSON.parse(rawCase as string);
      // Normalise: contract uses "argument"; UI expects "detailed_argument"
      const norm = (claim: any) =>
        claim
          ? { ...claim, detailed_argument: claim.argument ?? claim.detailed_argument ?? "" }
          : null;
      caseData = {
        ...parsed,
        id: parsed.case_id ?? id,
        claim_a: norm(parsed.claim_a),
        claim_b: norm(parsed.claim_b),
      };
    }
    if (rawVerdicts) verdicts = JSON.parse(rawVerdicts as string) as OnChainVerdict[];
    if (rawConsensus) consensus = JSON.parse(rawConsensus as string) as OnChainConsensus;
  } catch {
    // StudioNet temporarily unreachable
  }

  if (!caseData) notFound();

  const claimA = caseData.claim_a as Record<string, string>;
  const claimB = caseData.claim_b as Record<string, string> | null;
  const hasEvidence = (caseData.evidence_count ?? 0) > 0;
  const evidenceSummary: string = caseData.evidence_summary ?? "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Back */}
        <Link
          href="/cases"
          className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← Back to Cases
        </Link>

        {/* Case Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral-900">{caseData.title}</h1>
            <Badge variant={statusVariants[caseData.status] || "default"}>
              {caseData.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-neutral-600">{caseData.description}</p>
        </div>

        {/* Claims */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardTitle className="text-blue-700">Agent A: {claimA.agent_name}</CardTitle>
            <CardDescription className="mt-1 font-medium">{claimA.summary}</CardDescription>
            <CardContent className="mt-3">
              <p className="text-sm text-neutral-600">{claimA.detailed_argument}</p>
            </CardContent>
          </Card>

          {claimB ? (
            <Card className="border-l-4 border-l-red-500">
              <CardTitle className="text-red-700">Agent B: {claimB.agent_name}</CardTitle>
              <CardDescription className="mt-1 font-medium">{claimB.summary}</CardDescription>
              <CardContent className="mt-3">
                <p className="text-sm text-neutral-600">{claimB.detailed_argument}</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-l-4 border-l-neutral-300 flex items-center justify-center text-center py-8">
              <div>
                <p className="text-sm font-medium text-neutral-500">
                  Awaiting response from the named respondent
                </p>
                <p className="mt-1 text-xs text-neutral-400 font-mono break-all">
                  {caseData.respondent_address}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Evidence — from on-chain evidence_summary */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">
            Evidence{" "}
            {hasEvidence && (
              <span className="text-sm font-normal text-green-600">
                — {caseData.evidence_count} piece{caseData.evidence_count !== 1 ? "s" : ""} verified on-chain
              </span>
            )}
          </h2>
          {!hasEvidence ? (
            <p className="text-neutral-500">No evidence submitted yet.</p>
          ) : (
            <Card>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {evidenceSummary}
              </p>
            </Card>
          )}
        </div>

        {/* Respond to case */}
        <RespondToCase
          caseId={id}
          caseStatus={caseData.status}
          respondentAddress={caseData.respondent_address || ""}
          claimantAddress={caseData.claimant_address || ""}
        />

        {/* Attach evidence */}
        {claimB && (!verdicts || verdicts.length === 0) && (
          <div className="mb-4">
            <AttachEvidence
              caseId={id}
              claimantAddress={caseData.claimant_address || ""}
              respondentAddress={caseData.respondent_address || ""}
              hasEvidence={hasEvidence}
            />
          </div>
        )}

        {/* Run judges / consensus */}
        {claimB && (
          <div className="mb-8">
            <RunJudgesButton
              caseId={id}
              caseStatus={caseData.status}
              hasVerdicts={!!verdicts && verdicts.length > 0}
              hasEvidence={hasEvidence}
            />
          </div>
        )}

        {/* Verdicts */}
        {verdicts && verdicts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Judge Verdicts{" "}
              <span className="text-sm font-normal text-green-600">— verified on-chain</span>
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {verdicts.map((v) => (
                <Card key={v.persona}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-neutral-900 capitalize">
                      {v.persona} Judge
                    </h3>
                    <span className="text-lg font-bold text-brand-600">{v.confidence}%</span>
                  </div>
                  <Badge
                    variant={
                      v.verdict.startsWith("FAVOR_A") || v.verdict.startsWith("PARTIAL_A")
                        ? "info"
                        : v.verdict.startsWith("FAVOR_B") || v.verdict.startsWith("PARTIAL_B")
                          ? "danger"
                          : "warning"
                    }
                    className="mb-2"
                  >
                    {verdictLabels[v.verdict] || v.verdict}
                  </Badge>
                  <p className="text-sm text-neutral-600 line-clamp-4">{v.reasoning}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Consensus */}
        {consensus && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Consensus Result{" "}
              <span className="text-sm font-normal text-green-600">— verified on-chain</span>
            </h2>
            <Card className="border-2 border-brand-200 bg-brand-50/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Badge variant="success" className="text-sm px-3 py-1">
                    {verdictLabels[consensus.final_verdict] || consensus.final_verdict}
                  </Badge>
                  <span className="ml-3 text-sm text-neutral-600">
                    Method: {consensus.method.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-brand-600">
                    {consensus.overall_confidence}%
                  </div>
                  <div className="text-xs text-neutral-500">confidence</div>
                </div>
              </div>
              <p className="text-sm text-neutral-700 mb-4">{consensus.resolution_explanation}</p>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                <div className="text-xs text-neutral-500">
                  Agreement: {Math.round(consensus.agreement_ratio * 100)}% |{" "}
                  Judges: {consensus.participating_judges.length}
                </div>
                <SubmitOnChainButton
                  caseId={id}
                  caseTitle={caseData.title}
                  claimASummary={claimA.summary}
                  claimBSummary={claimB?.summary || ""}
                  consensusVerdict={consensus.final_verdict}
                  hasOnChainTx={caseData.status === "finalized"}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Appeal */}
        <AppealCase
          caseId={id}
          caseStatus={caseData.status}
          claimantAddress={caseData.claimant_address || ""}
          respondentAddress={caseData.respondent_address || ""}
        />

        {/* User decision */}
        <SubmitDecision caseId={id} hasConsensus={!!consensus} />
      </main>
    </div>
  );
}

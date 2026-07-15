import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/services/supabase/server";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RunJudgesButton } from "@/features/cases/components/run-judges-button";
import { SubmitOnChainButton } from "@/features/contracts/components/submit-onchain-button";
import { SubmitDecision } from "@/features/cases/components/submit-decision";
import { RespondToCase } from "@/features/cases/components/respond-to-case";
import { AppealCase } from "@/features/cases/components/appeal-case";

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
  favor_a: "Favor Agent A",
  favor_b: "Favor Agent B",
  partial_a: "Partial - Agent A",
  partial_b: "Partial - Agent B",
  dismiss: "Dismissed",
};

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdmin();

  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !caseData) notFound();

  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const { data: verdicts } = await supabase
    .from("verdicts")
    .select("*")
    .eq("case_id", id)
    .order("created_at", { ascending: true });

  const { data: consensus } = caseData.consensus_id
    ? await supabase
        .from("consensus_results")
        .select("*")
        .eq("id", caseData.consensus_id)
        .single()
    : { data: null };

  const claimA = caseData.claim_a as Record<string, string>;
  const claimB = caseData.claim_b as Record<string, string> | null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {/* Back link */}
        <Link
          href="/cases"
          className="mb-6 inline-flex items-center text-sm text-neutral-500 hover:text-neutral-700"
        >
          ← Back to Cases
        </Link>

        {/* Case Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-neutral-900">
              {caseData.title}
            </h1>
            <Badge variant={statusVariants[caseData.status] || "default"}>
              {caseData.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-neutral-600">{caseData.description}</p>
        </div>

        {/* Claims */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardTitle className="text-blue-700">
              Agent A: {claimA.agent_name}
            </CardTitle>
            <CardDescription className="mt-1 font-medium">
              {claimA.summary}
            </CardDescription>
            <CardContent className="mt-3">
              <p className="text-sm text-neutral-600">
                {claimA.detailed_argument}
              </p>
              <p className="mt-3 text-sm font-medium text-blue-600">
                Requested: {claimA.requested_outcome}
              </p>
            </CardContent>
          </Card>

          {claimB ? (
            <Card className="border-l-4 border-l-red-500">
              <CardTitle className="text-red-700">
                Agent B: {claimB.agent_name}
              </CardTitle>
              <CardDescription className="mt-1 font-medium">
                {claimB.summary}
              </CardDescription>
              <CardContent className="mt-3">
                <p className="text-sm text-neutral-600">
                  {claimB.detailed_argument}
                </p>
                <p className="mt-3 text-sm font-medium text-red-600">
                  Requested: {claimB.requested_outcome}
                </p>
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

        {/* Evidence */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Evidence</h2>
          {!evidence || evidence.length === 0 ? (
            <p className="text-neutral-500">No evidence submitted.</p>
          ) : (
            <div className="space-y-3">
              {evidence.map((e) => (
                <Card key={e.id} className="py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-neutral-900">
                          {e.title}
                        </h3>
                        <Badge variant="default">{e.type}</Badge>
                        <Badge
                          variant={
                            e.submitted_by === "agent_a"
                              ? "info"
                              : e.submitted_by === "agent_b"
                                ? "danger"
                                : "default"
                          }
                        >
                          {e.submitted_by.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">
                        {e.description}
                      </p>
                      <div className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700 font-mono">
                        {e.content}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-xs text-neutral-500">Credibility</div>
                      <div
                        className={`text-lg font-bold ${
                          e.credibility_score >= 80
                            ? "text-green-600"
                            : e.credibility_score >= 60
                              ? "text-yellow-600"
                              : "text-red-600"
                        }`}
                      >
                        {e.credibility_score}%
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Respond to case (only shown while awaiting_response) */}
        <RespondToCase
          caseId={id}
          caseStatus={caseData.status}
          respondentAddress={caseData.respondent_address || ""}
          claimantAddress={caseData.claimant_address || ""}
        />

        {/* Action Buttons — only meaningful once claim_b exists */}
        {claimB && (
          <div className="mb-8">
            <RunJudgesButton
              caseId={id}
              caseStatus={caseData.status}
              hasVerdicts={!!verdicts && verdicts.length > 0}
              isOnChain={!!caseData.onchain_tx_hash}
              caseTitle={caseData.title}
              caseDescription={caseData.description}
              caseCategory={caseData.category}
              caseDifficulty={caseData.difficulty}
              claimAName={claimA.agent_name}
              claimASummary={claimA.summary}
              claimAArgument={claimA.detailed_argument || claimA.argument || ""}
              claimBName={claimB.agent_name}
              claimBSummary={claimB.summary}
              claimBArgument={claimB.detailed_argument || claimB.argument || ""}
              evidenceSummary={(evidence || []).map((e: any) => `[${e.type}] ${e.title}: ${e.content}`).join(" | ")}
            />
          </div>
        )}

        {/* Verdicts */}
        {verdicts && verdicts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Judge Verdicts
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {verdicts.map((v) => (
                <Card key={v.id}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-neutral-900 capitalize">
                      {v.judge_persona} Judge
                    </h3>
                    <span className="text-lg font-bold text-brand-600">
                      {v.confidence}%
                    </span>
                  </div>
                  <Badge
                    variant={
                      v.verdict.includes("favor_a")
                        ? "info"
                        : v.verdict.includes("favor_b")
                          ? "danger"
                          : "warning"
                    }
                    className="mb-2"
                  >
                    {verdictLabels[v.verdict] || v.verdict}
                  </Badge>
                  <p className="text-sm text-neutral-600 line-clamp-4">
                    {v.reasoning}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Consensus */}
        {consensus && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Consensus Result
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
              <div className="text-sm text-neutral-700 mb-3">
                {consensus.resolution_explanation}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                <div className="text-xs text-neutral-500">
                  Agreement: {Math.round(consensus.agreement_ratio * 100)}% |{" "}
                  Judges: {(consensus.participating_judges as string[]).length}
                </div>
                <SubmitOnChainButton
                  caseId={id}
                  caseTitle={caseData.title}
                  claimASummary={claimA.summary}
                  claimBSummary={claimB?.summary || ""}
                  consensusVerdict={consensus.final_verdict}
                  hasOnChainTx={!!caseData.onchain_tx_hash}
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

        {/* User Decision */}
        <SubmitDecision caseId={id} hasConsensus={!!consensus} />
      </main>
    </div>
  );
}

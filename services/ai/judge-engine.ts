import type { JudgeConfig, JudgeVerdict, JudgePersona } from "@/types/agents";
import type { Case } from "@/types/cases";

/**
 * Judge Engine — generates verdicts for each judge persona.
 *
 * Phase 7-8: Uses deterministic analysis based on evidence and judge bias.
 * Phase 9: Will be replaced with GenLayer Intelligent Contract calls
 *          where gl.exec_prompt() produces consensus-validated LLM verdicts.
 */

interface EvidenceAnalysis {
  favorA: number;
  favorB: number;
  totalCredibility: number;
}

function analyzeEvidence(evidence: Case["evidence"]): EvidenceAnalysis {
  let favorA = 0;
  let favorB = 0;
  let totalCredibility = 0;

  for (const e of evidence) {
    const weight = e.credibility_score / 100;
    totalCredibility += e.credibility_score;

    if (e.submitted_by === "agent_a") {
      favorA += weight * 30;
      favorB += weight * 5;
    } else if (e.submitted_by === "agent_b") {
      favorB += weight * 30;
      favorA += weight * 5;
    } else {
      // System evidence — analyze content keywords
      const content = e.content.toLowerCase();
      const aName = "agent a";
      const bName = "agent b";

      // Neutral evidence slightly favors the higher-credibility side
      favorA += weight * 15;
      favorB += weight * 15;

      if (content.includes("violation") || content.includes("breach") || content.includes("failed")) {
        favorB += weight * 10;
      }
      if (content.includes("compliant") || content.includes("optimiz") || content.includes("efficient")) {
        favorA += weight * 10;
      }
    }
  }

  return { favorA, favorB, totalCredibility };
}

// Each judge persona has a bias that shifts their analysis
const personaBias: Record<JudgePersona, { aBias: number; bBias: number; confidenceBase: number }> = {
  commerce: { aBias: 8, bBias: -3, confidenceBase: 72 },    // Favors commercial efficiency
  consumer: { aBias: -5, bBias: 10, confidenceBase: 78 },    // Favors consumer protection
  contract: { aBias: -2, bBias: 5, confidenceBase: 82 },     // Favors strict contract terms
  neutral:  { aBias: 0, bBias: 0, confidenceBase: 68 },      // No bias
  risk:     { aBias: 3, bBias: -2, confidenceBase: 74 },     // Favors lower risk outcomes
  genlayer: { aBias: 0, bBias: 0, confidenceBase: 76 },      // Consensus-seeking
};

function generateReasoning(
  judge: JudgeConfig,
  caseData: Case,
  verdict: string,
  analysis: EvidenceAnalysis
): { reasoning: string; key_factors: string[]; dissenting_points: string[] } {
  const claimA = caseData.claim_a;
  const claimB = caseData.claim_b;

  const reasoningTemplates: Record<JudgePersona, Record<string, string>> = {
    commerce: {
      favor_a: `From a commercial standpoint, ${claimA.agent_name}'s position is supported by market efficiency principles. The evidence shows operational decisions were made within acceptable business parameters. Commercial precedent supports reasonable adaptation of service delivery methods when the end result is achieved.`,
      favor_b: `Commercial obligations must be honored as stated. ${claimB.agent_name} demonstrates that the terms were clear and binding. In commercial disputes, the written agreement takes precedence over operational convenience. The market relies on enforceable commitments.`,
      partial_a: `While ${claimA.agent_name} had legitimate operational reasons, the commercial impact on the counterparty cannot be ignored. A partial resolution acknowledging both the operational reality and the contractual expectation is warranted.`,
      partial_b: `The commercial terms favor ${claimB.agent_name}'s position, but mitigating circumstances reduce the liability. A partial resolution reflecting the shared responsibility is appropriate.`,
      dismiss: `Neither party presents a commercially compelling case. The evidence is insufficient to determine a clear commercial breach or obligation.`,
    },
    consumer: {
      favor_a: `Despite consumer protection considerations, the evidence shows ${claimA.agent_name} acted within disclosed terms. Consumer expectations must be balanced against clearly communicated service parameters.`,
      favor_b: `Consumer protection principles strongly support ${claimB.agent_name}'s position. When a service guarantee is made, the consumer has a right to rely on that commitment. The power asymmetry between provider and consumer demands strict enforcement of guarantees.`,
      partial_a: `Consumer rights are important, but the evidence suggests the consumer's expectations exceeded what was explicitly guaranteed. Partial relief acknowledges the consumer's position while recognizing the provider's disclosed limitations.`,
      partial_b: `The consumer's rights were partially violated. While full compensation may not be warranted, the provider bears responsibility for the gap between their guarantee and actual performance.`,
      dismiss: `The consumer protection angle does not clearly apply to this dispute. Both parties operated within reasonable expectations.`,
    },
    contract: {
      favor_a: `Strict contractual analysis supports ${claimA.agent_name}. The terms, when read in their entirety including limitations and conditions, support the position taken. Contract law requires reading all provisions together, not in isolation.`,
      favor_b: `The contractual language clearly supports ${claimB.agent_name}'s position. The specific commitment made creates a binding obligation. Subsequent disclaimers or general terms cannot override specific guarantees under established contract interpretation principles.`,
      partial_a: `The contract contains conflicting provisions. The specific terms partially support ${claimA.agent_name}, but ambiguity must be construed against the drafter. A balanced interpretation is required.`,
      partial_b: `Contractual analysis reveals that while ${claimB.agent_name}'s core claim is valid, the scope of relief should be limited to what the contract explicitly provides for in breach scenarios.`,
      dismiss: `The contractual terms are ambiguous to the point where neither party can claim clear support. The contract fails to adequately address this specific scenario.`,
    },
    neutral: {
      favor_a: `After weighing all evidence impartially, ${claimA.agent_name}'s position has stronger evidentiary support. The balance of credible evidence tips in their favor, though the margin is not overwhelming.`,
      favor_b: `An impartial assessment of all evidence favors ${claimB.agent_name}'s position. The credibility-weighted evidence supports their claims more strongly than the opposing position.`,
      partial_a: `Neither party has a decisive advantage. The evidence is relatively balanced but slightly favors ${claimA.agent_name}'s position. A nuanced resolution acknowledging both perspectives is most just.`,
      partial_b: `The evidence slightly favors ${claimB.agent_name}, but both parties make valid points. An equitable resolution should acknowledge the merits on both sides.`,
      dismiss: `The evidence is evenly balanced and neither party has demonstrated a clearly superior position. The dispute may require additional evidence or context for resolution.`,
    },
    risk: {
      favor_a: `Risk analysis indicates that ruling for ${claimA.agent_name} carries lower systemic risk. The precedent set would not create undue liability exposure or market instability.`,
      favor_b: `From a risk perspective, ${claimB.agent_name}'s position better protects against future disputes. Enforcing the commitment reduces moral hazard and maintains trust in the system.`,
      partial_a: `The lowest-risk outcome partially favors ${claimA.agent_name}. Full enforcement either way creates precedent risks. A measured resolution minimizes exposure for all parties.`,
      partial_b: `Risk mitigation favors a partial resolution leaning toward ${claimB.agent_name}. This approach reduces the likelihood of escalation while establishing reasonable expectations.`,
      dismiss: `The risk profile of this dispute is low regardless of outcome. Neither resolution would set a particularly dangerous precedent.`,
    },
    genlayer: {
      favor_a: `Through multi-validator consensus analysis, the weighted evidence and reasoning support ${claimA.agent_name}'s position. Multiple independent evaluations converge on this outcome with moderate confidence.`,
      favor_b: `Consensus among multiple independent evaluators favors ${claimB.agent_name}. The convergence of different analytical perspectives strengthens this conclusion beyond any single judge's assessment.`,
      partial_a: `Decentralized consensus indicates a nuanced outcome slightly favoring ${claimA.agent_name}. The lack of strong convergence on a single verdict suggests the dispute has legitimate merit on both sides.`,
      partial_b: `The consensus mechanism produces a partial verdict favoring ${claimB.agent_name}. Independent validators agree on the general direction but diverge on the degree of remedy.`,
      dismiss: `Consensus could not be reached. The independent evaluations produced divergent results, indicating this dispute may be genuinely ambiguous and require human judgment.`,
    },
  };

  const verdictKey = verdict as keyof (typeof reasoningTemplates)[JudgePersona];
  const reasoning = reasoningTemplates[judge.persona]?.[verdictKey] || reasoningTemplates[judge.persona]?.dismiss || "Unable to produce reasoning.";

  const key_factors = [
    `Evidence credibility weighted score: A=${Math.round(analysis.favorA)}, B=${Math.round(analysis.favorB)}`,
    `${caseData.evidence.length} pieces of evidence analyzed`,
    `Case category: ${caseData.category.replace(/_/g, " ")}`,
    `Difficulty level: ${caseData.difficulty}/5`,
  ];

  const dissenting_points: string[] = [];
  if (verdict.includes("favor_a")) {
    dissenting_points.push(`${claimB.agent_name}'s argument about ${claimB.summary.substring(0, 60)} has some merit`);
  } else if (verdict.includes("favor_b")) {
    dissenting_points.push(`${claimA.agent_name}'s operational justification deserves consideration`);
  }

  return { reasoning, key_factors, dissenting_points };
}

export async function getJudgeVerdict(
  judge: JudgeConfig,
  caseData: Case
): Promise<JudgeVerdict> {
  const analysis = analyzeEvidence(caseData.evidence);
  const bias = personaBias[judge.persona];

  const adjustedA = analysis.favorA + bias.aBias;
  const adjustedB = analysis.favorB + bias.bBias;
  const total = adjustedA + adjustedB || 1;
  const aRatio = adjustedA / total;

  // Add controlled randomness per judge
  const seed = judge.persona.charCodeAt(0) + caseData.id.charCodeAt(0);
  const jitter = ((seed * 9301 + 49297) % 233280) / 233280 * 0.15 - 0.075;
  const finalRatio = aRatio + jitter;

  let verdict: JudgeVerdict["verdict"];
  if (finalRatio > 0.62) verdict = "favor_a";
  else if (finalRatio > 0.52) verdict = "partial_a";
  else if (finalRatio > 0.48) verdict = "dismiss";
  else if (finalRatio > 0.38) verdict = "partial_b";
  else verdict = "favor_b";

  const confidence = Math.min(
    95,
    Math.max(45, Math.round(bias.confidenceBase + Math.abs(finalRatio - 0.5) * 40))
  );

  const { reasoning, key_factors, dissenting_points } = generateReasoning(
    judge,
    caseData,
    verdict,
    analysis
  );

  // Simulate async delay (GenLayer consensus takes time)
  await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

  return {
    id: crypto.randomUUID(),
    case_id: caseData.id,
    judge_persona: judge.persona,
    provider: "genlayer",
    verdict,
    confidence,
    reasoning,
    key_factors,
    dissenting_points,
    created_at: new Date().toISOString(),
  };
}

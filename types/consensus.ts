export type ConsensusMethod = "weighted_majority" | "supermajority" | "unanimous";

export interface ConsensusInput {
  case_id: string;
  verdicts: import("./agents").JudgeVerdict[];
}

export interface ConsensusResult {
  id: string;
  case_id: string;
  method: ConsensusMethod;
  final_verdict: "favor_a" | "favor_b" | "partial_a" | "partial_b" | "dismiss";
  overall_confidence: number;
  agreement_ratio: number;
  majority_reasoning: string;
  dissenting_summary: string;
  resolution_explanation: string;
  participating_judges: import("./agents").JudgePersona[];
  verdict_breakdown: Record<string, number>;
  created_at: string;
  finalized_at: string | null;
  onchain_tx_hash: string | null;
}

export interface ConsensusGraphNode {
  id: string;
  type: "judge" | "verdict" | "consensus";
  label: string;
  data: Record<string, unknown>;
}

export interface ConsensusGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number;
}

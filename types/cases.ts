export type CaseCategory =
  | "commerce"
  | "service"
  | "prediction_market"
  | "dao_governance"
  | "agent_agreement"
  | "contract_interpretation";

export type CaseStatus =
  | "pending"
  | "in_review"
  | "deliberating"
  | "consensus_reached"
  | "appealed"
  | "finalized";

export interface Evidence {
  id: string;
  case_id: string;
  title: string;
  description: string;
  type: "document" | "transaction" | "communication" | "testimony" | "data";
  content: string;
  submitted_by: "agent_a" | "agent_b" | "system";
  credibility_score: number;
  created_at: string;
}

export interface CaseClaim {
  agent_id: string;
  agent_name: string;
  summary: string;
  detailed_argument: string;
  requested_outcome: string;
}

export interface Case {
  id: string;
  title: string;
  description: string;
  category: CaseCategory;
  status: CaseStatus;
  difficulty: 1 | 2 | 3 | 4 | 5;
  claim_a: CaseClaim;
  claim_b: CaseClaim;
  evidence: Evidence[];
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  consensus_id: string | null;
  onchain_tx_hash: string | null;
}

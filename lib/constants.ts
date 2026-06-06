export const SITE_NAME = "Court of Agents";
export const SITE_DESCRIPTION =
  "When AI agents disagree, who decides? An interactive adjudication game powered by GenLayer.";
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const CASE_CATEGORIES = [
  { value: "commerce", label: "Commerce Dispute" },
  { value: "service", label: "Service Dispute" },
  { value: "prediction_market", label: "Prediction Market" },
  { value: "dao_governance", label: "DAO Governance" },
  { value: "agent_agreement", label: "Agent Agreement" },
  { value: "contract_interpretation", label: "Contract Interpretation" },
] as const;

export const REPUTATION_THRESHOLDS = [
  { rank: "novice_arbiter", display_name: "Novice Arbiter", min_score: 0, min_cases: 0, min_accuracy: 0 },
  { rank: "trusted_judge", display_name: "Trusted Judge", min_score: 100, min_cases: 5, min_accuracy: 0.5 },
  { rank: "consensus_architect", display_name: "Consensus Architect", min_score: 500, min_cases: 20, min_accuracy: 0.65 },
  { rank: "master_adjudicator", display_name: "Master Adjudicator", min_score: 1500, min_cases: 50, min_accuracy: 0.75 },
  { rank: "grand_adjudicator", display_name: "Grand Adjudicator", min_score: 5000, min_cases: 100, min_accuracy: 0.85 },
] as const;

export const JUDGE_PERSONAS = [
  "commerce",
  "consumer",
  "contract",
  "neutral",
  "risk",
  "genlayer",
] as const;

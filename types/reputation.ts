export type ReputationRank =
  | "novice_arbiter"
  | "trusted_judge"
  | "consensus_architect"
  | "master_adjudicator"
  | "grand_adjudicator";

export interface ReputationThreshold {
  rank: ReputationRank;
  display_name: string;
  min_score: number;
  min_cases: number;
  min_accuracy: number;
}

export interface UserReputation {
  user_id: string;
  rank: ReputationRank;
  score: number;
  total_cases: number;
  correct_decisions: number;
  accuracy: number;
  streak: number;
  best_streak: number;
  participation_rate: number;
  consistency_score: number;
  onchain_score: number | null;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string | null;
  rank: ReputationRank;
  score: number;
  accuracy: number;
  total_cases: number;
  position: number;
}

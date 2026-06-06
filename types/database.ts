export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      cases: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          status: string;
          difficulty: number;
          claim_a: Record<string, unknown>;
          claim_b: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          consensus_id: string | null;
          onchain_tx_hash: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["cases"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["cases"]["Insert"]>;
      };
      evidence: {
        Row: {
          id: string;
          case_id: string;
          title: string;
          description: string;
          type: string;
          content: string;
          submitted_by: string;
          credibility_score: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["evidence"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["evidence"]["Insert"]>;
      };
      verdicts: {
        Row: {
          id: string;
          case_id: string;
          judge_persona: string;
          provider: string;
          verdict: string;
          confidence: number;
          reasoning: string;
          key_factors: string[];
          dissenting_points: string[];
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["verdicts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["verdicts"]["Insert"]>;
      };
      consensus_results: {
        Row: {
          id: string;
          case_id: string;
          method: string;
          final_verdict: string;
          overall_confidence: number;
          agreement_ratio: number;
          majority_reasoning: string;
          dissenting_summary: string;
          resolution_explanation: string;
          participating_judges: string[];
          verdict_breakdown: Record<string, number>;
          created_at: string;
          finalized_at: string | null;
          onchain_tx_hash: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["consensus_results"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["consensus_results"]["Insert"]>;
      };
      user_reputation: {
        Row: {
          user_id: string;
          rank: string;
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
        };
        Insert: Omit<Database["public"]["Tables"]["user_reputation"]["Row"], "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_reputation"]["Insert"]>;
      };
      user_decisions: {
        Row: {
          id: string;
          user_id: string;
          case_id: string;
          decision: string;
          reasoning: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["user_decisions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["user_decisions"]["Insert"]>;
      };
    };
  };
}

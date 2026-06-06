export type JudgePersona =
  | "commerce"
  | "consumer"
  | "contract"
  | "neutral"
  | "risk"
  | "genlayer";

export type AIProvider = "openai" | "anthropic" | "genlayer";

export interface JudgeConfig {
  persona: JudgePersona;
  display_name: string;
  description: string;
  system_prompt: string;
  provider: AIProvider;
  model: string;
  temperature: number;
  icon: string;
}

export interface JudgeVerdict {
  id: string;
  case_id: string;
  judge_persona: JudgePersona;
  provider: AIProvider;
  verdict: "favor_a" | "favor_b" | "partial_a" | "partial_b" | "dismiss";
  confidence: number;
  reasoning: string;
  key_factors: string[];
  dissenting_points: string[];
  created_at: string;
}

import { z } from "zod";

export const userDecisionSchema = z.object({
  case_id: z.string().uuid(),
  decision: z.enum(["favor_a", "favor_b", "partial_a", "partial_b", "dismiss"]),
  reasoning: z.string().min(10).max(2000),
});

export const createCaseSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum([
    "commerce",
    "service",
    "prediction_market",
    "dao_governance",
    "agent_agreement",
    "contract_interpretation",
  ]),
  difficulty: z.number().int().min(1).max(5),
  claim_a: z.object({
    agent_name: z.string(),
    summary: z.string(),
    detailed_argument: z.string(),
    requested_outcome: z.string(),
  }),
  // claim_b is filled in later by the respondent via respond_to_case() —
  // not known at case-creation time.
  claim_b: z
    .object({
      agent_name: z.string(),
      summary: z.string(),
      detailed_argument: z.string(),
      requested_outcome: z.string(),
    })
    .nullable()
    .optional(),
  claimant_address: z.string(),
  respondent_address: z.string(),
});

export const respondToCaseSchema = z.object({
  case_id: z.string().uuid(),
  claim_b: z.object({
    agent_name: z.string(),
    summary: z.string(),
    detailed_argument: z.string(),
    requested_outcome: z.string(),
  }),
});

export type UserDecisionInput = z.infer<typeof userDecisionSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type RespondToCaseInput = z.infer<typeof respondToCaseSchema>;

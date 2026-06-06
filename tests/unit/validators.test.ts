import { userDecisionSchema, createCaseSchema } from "@/lib/validators";

describe("userDecisionSchema", () => {
  it("accepts valid input", () => {
    const result = userDecisionSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      decision: "favor_a",
      reasoning: "The evidence strongly supports Agent A's claim.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid verdict", () => {
    const result = userDecisionSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      decision: "invalid_verdict",
      reasoning: "Some reasoning here.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short reasoning", () => {
    const result = userDecisionSchema.safeParse({
      case_id: "550e8400-e29b-41d4-a716-446655440000",
      decision: "favor_b",
      reasoning: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID", () => {
    const result = userDecisionSchema.safeParse({
      case_id: "not-a-uuid",
      decision: "favor_a",
      reasoning: "Valid reasoning text here.",
    });
    expect(result.success).toBe(false);
  });
});

describe("createCaseSchema", () => {
  const validCase = {
    title: "Test Dispute Case",
    description: "A detailed description of the dispute that is at least twenty characters long.",
    category: "commerce",
    difficulty: 3,
    claim_a: {
      agent_name: "Agent Alpha",
      summary: "Agent A's position",
      detailed_argument: "Full argument",
      requested_outcome: "Refund",
    },
    claim_b: {
      agent_name: "Agent Beta",
      summary: "Agent B's position",
      detailed_argument: "Full argument",
      requested_outcome: "Dismiss",
    },
  };

  it("accepts valid case", () => {
    const result = createCaseSchema.safeParse(validCase);
    expect(result.success).toBe(true);
  });

  it("rejects short title", () => {
    const result = createCaseSchema.safeParse({ ...validCase, title: "Hi" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = createCaseSchema.safeParse({ ...validCase, category: "invalid" });
    expect(result.success).toBe(false);
  });

  it("rejects difficulty out of range", () => {
    const result = createCaseSchema.safeParse({ ...validCase, difficulty: 6 });
    expect(result.success).toBe(false);
  });
});

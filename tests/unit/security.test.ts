import { sanitizeInput, validateAIOutput } from "@/middleware/security";

describe("sanitizeInput", () => {
  it("escapes HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>")).not.toContain("<script>");
  });

  it("escapes quotes", () => {
    expect(sanitizeInput('"hello"')).toBe("&quot;hello&quot;");
  });

  it("leaves plain text unchanged", () => {
    expect(sanitizeInput("Hello World")).toBe("Hello World");
  });
});

describe("validateAIOutput", () => {
  it("accepts valid output", () => {
    expect(
      validateAIOutput({
        verdict: "favor_a",
        confidence: 75,
        reasoning: "The evidence supports Agent A.",
        key_factors: ["factor 1"],
        dissenting_points: [],
      })
    ).toBe(true);
  });

  it("rejects invalid verdict", () => {
    expect(
      validateAIOutput({
        verdict: "invalid",
        confidence: 75,
        reasoning: "Some reasoning.",
      })
    ).toBe(false);
  });

  it("rejects confidence out of range", () => {
    expect(
      validateAIOutput({
        verdict: "favor_a",
        confidence: 150,
        reasoning: "Some reasoning.",
      })
    ).toBe(false);
  });

  it("rejects null input", () => {
    expect(validateAIOutput(null)).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(validateAIOutput({ verdict: "favor_a" })).toBe(false);
  });
});

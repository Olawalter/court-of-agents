import { checkRateLimit } from "@/middleware/rate-limit";

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("test-user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59);
  });

  it("tracks requests per identifier", () => {
    const id = "test-user-2";
    checkRateLimit(id);
    checkRateLimit(id);
    const result = checkRateLimit(id);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(57);
  });

  it("different identifiers have separate limits", () => {
    const r1 = checkRateLimit("user-a");
    const r2 = checkRateLimit("user-b");
    expect(r1.remaining).toBe(59);
    expect(r2.remaining).toBe(59);
  });
});

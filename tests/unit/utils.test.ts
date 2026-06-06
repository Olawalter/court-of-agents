import { cn, formatDate, truncate, percentageToColor } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra");
  });

  it("merges tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2025-01-15T00:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });
});

describe("truncate", () => {
  it("truncates long strings", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...");
  });

  it("does not truncate short strings", () => {
    expect(truncate("Hi", 10)).toBe("Hi");
  });
});

describe("percentageToColor", () => {
  it("returns green for high values", () => {
    expect(percentageToColor(85)).toBe("text-green-600");
  });

  it("returns yellow for medium values", () => {
    expect(percentageToColor(65)).toBe("text-yellow-600");
  });

  it("returns red for low values", () => {
    expect(percentageToColor(30)).toBe("text-red-600");
  });
});

import { describe, it, expect } from "vitest";
import { computeTokenSimilarity } from "../services/pdfParser";

describe("PDF Parser Fuzzy Title Matcher", () => {
  it("matches identical titles with score 1.0", () => {
    expect(computeTokenSimilarity("Two Sum", "Two Sum")).toBe(1.0);
    expect(computeTokenSimilarity("two sum", "TWO SUM!")).toBe(1.0);
  });

  it("handles minor formatting differences and page noise", () => {
    const score = computeTokenSimilarity("1. Two Sum - Array, Hash Table", "Two Sum");
    expect(score).toBeGreaterThanOrEqual(0.75);
  });

  it("distinguishes non-matching titles", () => {
    const score = computeTokenSimilarity("Merge K Sorted Lists", "Two Sum");
    expect(score).toBeLessThan(0.3);
  });
});

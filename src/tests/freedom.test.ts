import { describe, it, expect } from "vitest";
import { calculateFreedomMinutes } from "../services/scheduler";

describe("Freedom Window Duration Calculator", () => {
  it("grants 15 minutes for Easy problems", () => {
    expect(calculateFreedomMinutes("Easy")).toBe(15);
    expect(calculateFreedomMinutes("easy")).toBe(15);
  });

  it("grants 25 minutes for Medium problems", () => {
    expect(calculateFreedomMinutes("Medium")).toBe(25);
    expect(calculateFreedomMinutes("medium")).toBe(25);
  });

  it("grants 40 minutes for Hard problems", () => {
    expect(calculateFreedomMinutes("Hard")).toBe(40);
    expect(calculateFreedomMinutes("hard")).toBe(40);
  });

  it("defaults to 25 minutes for unknown difficulties", () => {
    expect(calculateFreedomMinutes("Unknown")).toBe(25);
  });

  it("calculates boundary expiry timestamps correctly", () => {
    const now = 1000000;
    const durationMins = calculateFreedomMinutes("Medium");
    const freedomExpiresAt = now + durationMins * 60 * 1000;

    expect(now < freedomExpiresAt).toBe(true);
    expect(now + 25 * 60 * 1000 === freedomExpiresAt).toBe(true);
    expect(now + 26 * 60 * 1000 > freedomExpiresAt).toBe(true);
  });
});

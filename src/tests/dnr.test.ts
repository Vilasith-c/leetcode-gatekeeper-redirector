import { describe, it, expect } from "vitest";
import { buildDNRRuleList } from "../services/dnr";
import { WhitelistEntry } from "../schemas/storage";

describe("DNR Rule Builder", () => {
  const sampleWhitelist: WhitelistEntry[] = [
    { id: "1", domain: "leetcode.com", addedAt: Date.now(), label: "LeetCode" },
    { id: "2", domain: "developer.mozilla.org", addedAt: Date.now(), label: "MDN" }
  ];

  it("returns empty rules when session is inactive", () => {
    const rules = buildDNRRuleList(sampleWhitelist, false);
    expect(rules).toHaveLength(0);
  });

  it("builds allow rules with priority 2 and a catch-all block rule with priority 1 when session is active", () => {
    const rules = buildDNRRuleList(sampleWhitelist, true);

    // 2 whitelist rules + 1 YouTube watch rule + 1 block-all rule = 4 rules
    expect(rules).toHaveLength(4);

    const allowRules = rules.filter((r) => r.action.type === "allow");
    const blockRules = rules.filter((r) => r.action.type === "block");

    expect(allowRules.length).toBe(3);
    expect(blockRules.length).toBe(1);

    // Verify priority: ALLOW rules (priority 2) override BLOCK rule (priority 1)
    allowRules.forEach((rule) => {
      expect(rule.priority).toBe(2);
    });
    expect(blockRules[0].priority).toBe(1);
    expect(blockRules[0].condition.urlFilter).toBe("*");
  });
});

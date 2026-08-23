import { WhitelistEntry } from "../schemas/storage";

export interface DNRRule {
  id: number;
  priority: number;
  action: { type: "allow" | "block" };
  condition: {
    requestDomains?: string[];
    urlFilter?: string;
    resourceTypes: string[];
  };
}

export function buildDNRRuleList(whitelist: WhitelistEntry[], sessionActive: boolean): DNRRule[] {
  if (!sessionActive) return [];

  const allowRules: DNRRule[] = whitelist.map((entry, index) => {
    const domain = entry.domain.replace(/^\*\./, "").split("/")[0];
    return {
      id: index + 1,
      priority: 2,
      action: { type: "allow" },
      condition: {
        requestDomains: [domain],
        resourceTypes: ["main_frame", "sub_frame"]
      }
    };
  });

  // YouTube specific watch allow rule
  allowRules.push({
    id: 9998,
    priority: 2,
    action: { type: "allow" },
    condition: {
      urlFilter: "||youtube.com/watch*",
      resourceTypes: ["main_frame", "sub_frame"]
    }
  });

  const blockAllRule: DNRRule = {
    id: 9999,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: "*",
      resourceTypes: ["main_frame"]
    }
  };

  return [...allowRules, blockAllRule];
}

export async function rebuildDNRRules(whitelist: WhitelistEntry[], sessionActive: boolean): Promise<void> {
  if (typeof chrome === "undefined" || !chrome.declarativeNetRequest) return;

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  const addRules = buildDNRRuleList(whitelist, sessionActive);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: addRules as chrome.declarativeNetRequest.Rule[]
  });
}

import { localStorage } from "../storage";

export interface AnalyticsEvent {
  type: "SOLVE" | "BLOCK" | "OVERRIDE" | "SKIP" | "SESSION_START" | "SESSION_END" | "FREEDOM_START" | "FREEDOM_END";
  timestamp: number;
  data: Record<string, any>;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function logAnalyticsEvent(
  type: AnalyticsEvent["type"],
  data: Record<string, any> = {}
): Promise<void> {
  try {
    const existing = (await localStorage.get<AnalyticsEvent[]>("analyticsLog")) || [];
    const now = Date.now();
    const event: AnalyticsEvent = { type, timestamp: now, data };

    // Purge older than 90 days
    const filtered = existing.filter((e) => now - e.timestamp < NINETY_DAYS_MS);
    filtered.push(event);

    await localStorage.set("analyticsLog", filtered);
  } catch (err) {
    console.error("Failed to log analytics event:", err);
  }
}

import { Storage } from "@plasmohq/storage";
import {
  DEFAULT_LOCAL_STATE,
  DEFAULT_SESSION_STATE,
  LocalState,
  LocalStateSchema,
  SessionState,
  SessionStateSchema
} from "../schemas/storage";

export const localStorage = new Storage({ area: "local" });
export const sessionStorage = new Storage({ area: "session" });

export async function getSessionState(): Promise<SessionState> {
  try {
    const raw = await sessionStorage.get<SessionState>("session");
    if (!raw) return DEFAULT_SESSION_STATE;
    return SessionStateSchema.parse(raw);
  } catch (err) {
    console.warn("Invalid session storage payload, falling back to default:", err);
    return DEFAULT_SESSION_STATE;
  }
}

export async function setSessionState(data: Partial<SessionState>): Promise<SessionState> {
  const current = await getSessionState();
  const updated = SessionStateSchema.parse({ ...current, ...data });
  await sessionStorage.set("session", updated);
  return updated;
}

export async function getLocalState(): Promise<LocalState> {
  try {
    const raw = await localStorage.get<LocalState>("local");
    if (!raw) {
      await localStorage.set("local", DEFAULT_LOCAL_STATE);
      return DEFAULT_LOCAL_STATE;
    }
    return LocalStateSchema.parse(raw);
  } catch (err) {
    console.warn("Invalid local storage payload, falling back to default:", err);
    return DEFAULT_LOCAL_STATE;
  }
}

export async function setLocalState(data: Partial<LocalState>): Promise<LocalState> {
  const current = await getLocalState();
  const updated = LocalStateSchema.parse({ ...current, ...data });
  await localStorage.set("local", updated);
  return updated;
}

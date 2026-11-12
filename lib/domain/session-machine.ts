export type SessionState =
  | "idle"
  | "active"
  | "paused"
  | "stopping"
  | "billed"
  | "paid"
  | "void";

export class SessionDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionDomainError";
  }
}

export const VALID_SESSION_TRANSITIONS: Record<SessionState, SessionState[]> = {
  idle: ["active"],
  active: ["paused", "stopping"],
  paused: ["active", "stopping"],
  stopping: ["billed", "active"], // Can be resumed if stop was rejected by reception
  billed: ["paid", "void"],
  paid: [], // Terminal state (financial entries cannot be hard modified, only audited)
  void: [], // Terminal state
};

export function canTransition(from: SessionState, to: SessionState): boolean {
  const allowed = VALID_SESSION_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function validateSessionTransition(from: SessionState, to: SessionState): void {
  if (!canTransition(from, to)) {
    throw new SessionDomainError(
      `Illegal session state transition from '${from}' to '${to}'. Allowed: [${(
        VALID_SESSION_TRANSITIONS[from] || []
      ).join(", ")}]`
    );
  }
}

export interface SessionTimelineEvent {
  eventType: "start" | "pause" | "resume" | "stop_requested" | "stop_confirmed" | "override" | "comp" | "void";
  serverTimestamp: Date;
  reason?: string;
  actorRole: string;
}

/**
 * Computes exact active elapsed duration from append-only events using server timestamps.
 * Client clocks are never trusted.
 */
export function computeElapsedFromEvents(
  events: SessionTimelineEvent[],
  now: Date = new Date()
): { activeSeconds: number; pausedSeconds: number; currentState: SessionState } {
  let activeSeconds = 0;
  let pausedSeconds = 0;
  let currentState: SessionState = "idle";
  let lastStateChange: Date | null = null;

  for (const event of events) {
    const time = new Date(event.serverTimestamp);

    if (currentState === "active" && lastStateChange) {
      activeSeconds += Math.max(0, Math.floor((time.getTime() - lastStateChange.getTime()) / 1000));
    } else if (currentState === "paused" && lastStateChange) {
      pausedSeconds += Math.max(0, Math.floor((time.getTime() - lastStateChange.getTime()) / 1000));
    }

    if (event.eventType === "start") {
      validateSessionTransition(currentState, "active");
      currentState = "active";
      lastStateChange = time;
    } else if (event.eventType === "pause") {
      validateSessionTransition(currentState, "paused");
      currentState = "paused";
      lastStateChange = time;
    } else if (event.eventType === "resume") {
      validateSessionTransition(currentState, "active");
      currentState = "active";
      lastStateChange = time;
    } else if (event.eventType === "stop_requested") {
      validateSessionTransition(currentState, "stopping");
      currentState = "stopping";
      lastStateChange = time;
    } else if (event.eventType === "stop_confirmed") {
      validateSessionTransition(currentState, "billed");
      currentState = "billed";
      lastStateChange = time;
    }
  }

  // Add time up to 'now' if still active or paused
  if (currentState === "active" && lastStateChange) {
    activeSeconds += Math.max(0, Math.floor((now.getTime() - lastStateChange.getTime()) / 1000));
  } else if (currentState === "paused" && lastStateChange) {
    pausedSeconds += Math.max(0, Math.floor((now.getTime() - lastStateChange.getTime()) / 1000));
  }

  return {
    activeSeconds,
    pausedSeconds,
    currentState,
  };
}


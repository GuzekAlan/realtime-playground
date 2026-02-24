import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Broadcast
// ---------------------------------------------------------------------------

export interface BroadcastMessage {
  timestamp: string;
  channel: string;
  event: string;
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Postgres Changes
// ---------------------------------------------------------------------------

export type PostgresChange = RealtimePostgresChangesPayload<
  Record<string, unknown>
> & {
  /** ISO string — time we received the event in the browser */
  timestamp: string;
  /** Channel name the event arrived on */
  channel: string;
};

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------

/** Outer key = channel name; inner key = presence key; value = presence objects */
export type PresenceByChannel = Record<string, Record<string, unknown[]>>;

import { create } from "zustand";
import { RealtimeClient, RealtimeChannel } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  NEXT_PUBLIC_REALTIME_URL,
  NEXT_PUBLIC_SUPABASE_KEY,
} from "@/lib/constants";
import type { ChannelConfig } from "@/schemas/channel";

export type SocketStatus = "closed" | "connecting" | "open" | "closing";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Logger = (kind: string, msg: string, data: any) => void;

interface RealtimeStore {
  client: RealtimeClient | null;
  status: SocketStatus;
  channels: Map<string, RealtimeChannel>;

  init: (logger?: Logger) => void;
  destroy: () => void;
  syncStatus: () => void;
  syncChannels: () => void;

  connect: () => void;
  disconnect: () => void;

  createChannel: (name: string, config?: ChannelConfig) => void;
  removeChannel: (name: string) => void;
  subscribedChannels: () => [string, RealtimeChannel][];
  subscribe: (name: string) => void;
  unsubscribe: (name: string) => void;
  trackPresence: (name: string, payload: Record<string, unknown>) => void;
  untrackPresence: (name: string) => void;

  setAuth: (token: string) => void;
}

export const useRealtimeStore = create<RealtimeStore>((set, get) => ({
  client: null,
  status: "closed",
  channels: new Map(),

  init(logger) {
    get().client?.disconnect();
    set({
      client: new RealtimeClient(NEXT_PUBLIC_REALTIME_URL, {
        params: { apikey: NEXT_PUBLIC_SUPABASE_KEY },
        worker: true,
        logger,
      }),
    });
  },

  destroy() {
    get().client?.disconnect();
    set({ client: null, status: "closed", channels: new Map() });
  },

  syncStatus() {
    const { client } = get();
    if (!client) return;
    const status = client.connectionState() as SocketStatus;
    set({ status });
  },

  syncChannels() {
    const { client } = get();
    if (!client) return;
    set({
      channels: new Map(client.getChannels().map((ch) => [ch.subTopic, ch])),
    });
  },

  connect: () => get().client?.connect(),
  disconnect: () => get().client?.disconnect(),

  createChannel(name, config) {
    const { client, channels, syncChannels } = get();
    if (!client) return;
    if (channels.has(name)) {
      toast.warning(`Channel "${name}" already exists`);
      return;
    }

    const ch = client.channel(name, config ? { config } : undefined);
    ch.on("system", {}, (payload) => {
      const msg = `[SYSTEM] ${payload.message}`;
      if (payload.status === "ok") toast.success(msg);
      else toast.error(msg);
    });

    syncChannels();
  },

  removeChannel(name) {
    const { channels, syncChannels } = get();
    const ch = channels.get(name);
    if (!ch) {
      toast.error(`[REMOVE] Channel "${name}" not found`);
      return;
    }
    ch.unsubscribe();
    syncChannels();
  },

  subscribedChannels() {
    const { channels } = get();
    return Array.from(channels.entries()).filter(
      ([, ch]) => ch.state === "joined",
    );
  },

  subscribe(name) {
    const { channels, syncChannels } = get();
    const ch = channels.get(name);
    if (!ch) {
      toast.error(`[SUBSCRIBE] Channel "${name}" not found`);
      return;
    }
    ch.subscribe((status, err) => {
      if (err) {
        toast.error(`[SUBSCRIBE] Error: ${err.message}`);
      } else if (status === "SUBSCRIBED") {
        toast.success(`[SUBSCRIBE] Subscribed to "${name}"`);
      }

      syncChannels();
    });
  },

  unsubscribe(name) {
    const { channels, syncChannels } = get();
    const ch = channels.get(name);
    if (!ch) {
      toast.error(`[UNSUBSCRIBE] Channel "${name}" not found`);
      return;
    }
    ch.unsubscribe();
    syncChannels();
  },

  trackPresence(name, payload) {
    const ch = get().channels.get(name);
    if (!ch) {
      toast.error(`[TRACK] Channel "${name}" not found`);
      return;
    }
    ch.track(payload);
  },

  untrackPresence(name) {
    const ch = get().channels.get(name);
    if (!ch) {
      toast.error(`[UNTRACK] Channel "${name}" not found`);
      return;
    }
    ch.untrack();
  },

  setAuth: (token) => get().client?.setAuth(token),
}));

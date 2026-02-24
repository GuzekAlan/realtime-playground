import { z } from "zod";
import type { RealtimeChannelOptions } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Channel config schema — shape mirrors RealtimeChannelOptions['config']
// ---------------------------------------------------------------------------

export const channelConfigSchema = z.object({
  private: z.boolean(),
  broadcast: z.object({
    ack: z.boolean(),
    self: z.boolean(),
  }),
  presence: z.object({
    enabled: z.boolean(),
    key: z.string().optional(),
  }),
});

export const channelFormSchema = z.object({
  name: z.string().min(1, "Channel name is required"),
  config: channelConfigSchema,
});

export type ChannelFormValues = z.infer<typeof channelFormSchema>;
export type ChannelConfig = z.infer<typeof channelConfigSchema>;

export const broadcastSendSchema = z.object({
  event: z.string().min(1, "Event is required"),
  channel: z.string().min(1, "Select a channel"),
  message: z.string(),
});

export type BroadcastSendValues = z.infer<typeof broadcastSendSchema>;

// Compile-time guarantee that our config is assignable to the supabase type
type _Check = ChannelConfig extends RealtimeChannelOptions["config"]
  ? true
  : "ChannelConfig is not compatible with RealtimeChannelOptions['config']";
const _assert: _Check = true;
void _assert;

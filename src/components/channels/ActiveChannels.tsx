"use client";

import { useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  channels: Map<string, RealtimeChannel>;
  onSubscribe: (name: string) => void;
  onUnsubscribe: (name: string) => void;
  onRemove: (name: string) => void;
  onAddBroadcastListener: (
    channel: RealtimeChannel,
    name: string,
    event: string,
  ) => void;
  onAddPresenceListener: (channel: RealtimeChannel, name: string) => void;
  onUntrack: (name: string) => void;
}

const channelStateBadgeVariant = (
  state: string,
): "default" | "secondary" | "destructive" | "outline" => {
  if (state === "joined") return "default";
  if (state === "joining" || state === "leaving") return "secondary";
  return "outline";
};

export function ActiveChannels({
  channels,
  onSubscribe,
  onUnsubscribe,
  onRemove,
  onAddBroadcastListener,
  onAddPresenceListener,
  onUntrack,
}: Props) {
  const [broadcastEventName, setBroadcastEventName] = useState("*");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Active Channels</CardTitle>
      </CardHeader>
      <CardContent>
        {channels.size === 0 ? (
          <div className="text-center py-6 border border-dashed rounded-md">
            <p className="text-muted-foreground text-xs">
              No channels created yet
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Create a channel above to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-blue-600/30 bg-blue-950/20 p-3 space-y-1">
              <Label className="text-xs">
                Broadcast Event Name (for listener)
              </Label>
              <Input
                placeholder="* for all events, or specific event name"
                value={broadcastEventName}
                onChange={(e) => setBroadcastEventName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use * to listen to all broadcast events, or enter a specific
                event name
              </p>
            </div>

            {Array.from(channels.entries()).map(([name, channel]) => (
              <div key={name} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs truncate">{name}</span>
                  <Badge variant={channelStateBadgeVariant(channel.state)}>
                    {channel.state}
                  </Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {channel.state !== "joined" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-7"
                      onClick={() => onSubscribe(name)}
                    >
                      Subscribe
                    </Button>
                  )}
                  {channel.state === "joined" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => onUnsubscribe(name)}
                    >
                      Unsubscribe
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={() =>
                      onAddBroadcastListener(
                        channel,
                        name,
                        broadcastEventName || "*",
                      )
                    }
                  >
                    📡 Broadcast Listener ({broadcastEventName || "*"})
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={() => onAddPresenceListener(channel, name)}
                  >
                    👥 Presence Listener
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="text-xs h-7"
                    onClick={() => onUntrack(name)}
                  >
                    👤 Untrack
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs h-7"
                    onClick={() => onRemove(name)}
                  >
                    ✕ Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

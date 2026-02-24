"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  RealtimeClient,
  RealtimeChannel,
  createClient,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from "@supabase/supabase-js";
import {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_REALTIME_URL,
  NEXT_PUBLIC_SUPABASE_KEY,
  NEXT_PUBLIC_TEST_USER_EMAIL,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChannelForm } from "@/components/forms/ChannelForm";
import { ActiveChannels } from "@/components/channels/ActiveChannels";
import { type ChannelFormValues } from "@/schemas/channel";
import { useBroadcastMessages } from "@/hooks/useBroadcastMessages";
import { useLogMessages } from "@/hooks/useLogMessages";
import { usePostgresChanges } from "@/hooks/usePostgresChanges";
import { usePresenceState } from "@/hooks/usePresenceState";
import {
  BroadcastMessagesTable,
  LogsTable,
  PostgresChangesTable,
  PresenceStateTable,
} from "@/components/tables";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    socket: RealtimeClient;
    supabase: ReturnType<typeof createClient>;
    channel: RealtimeChannel;
  }
}

interface SocketInfo {
  status: "closed" | "connecting" | "open" | "closing";
  channels: Map<string, RealtimeChannel>;
}

interface UserInfo {
  id: string | null;
  email: string;
  password: string;
}

interface PgForm {
  schema: string;
  table: string;
  event: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Home() {
  const [socketInfo, setSocketInfo] = useState<SocketInfo>({
    status: "closed",
    channels: new Map(),
  });

  const updateChannels = () => {
    const currentChannels = window.socket.getChannels();
    const channels = new Map<string, RealtimeChannel>(
      currentChannels.map((channel) => [channel.subTopic, channel]),
    );
    setSocketInfo((prev) => ({ ...prev, channels }));
  };

  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: null,
    email: NEXT_PUBLIC_TEST_USER_EMAIL,
    password: "",
  });

  const isAuthenticated = (info: UserInfo) => info.id !== null;

  const [pgForm, setPgForm] = useState<PgForm>({
    schema: "public",
    table: "",
    event: "*",
  });

  const [presencePayload, setPresencePayload] = useState<
    Record<string, unknown>
  >({});

  const { logs, addLog, clear: clearLogs } = useLogMessages();

  const {
    messages: broadcastMessages,
    addListener: registerBroadcastListener,
    clear: clearBroadcastMessages,
  } = useBroadcastMessages();

  const {
    changes: postgresChanges,
    addListener: registerPostgresListener,
    clear: clearPostgresChanges,
  } = usePostgresChanges();

  const {
    presenceState,
    addListener: registerPresenceListener,
    clear: clearPresenceState,
  } = usePresenceState();

  // Initialize socket and supabase client
  useEffect(() => {
    window.socket = new RealtimeClient(NEXT_PUBLIC_REALTIME_URL, {
      params: { apikey: NEXT_PUBLIC_SUPABASE_KEY },
      worker: true,
      logger: addLog,
    });

    window.supabase = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_KEY,
    );

    return () => {
      if (window.socket) window.socket.disconnect();
    };
  }, [addLog]);

  // Monitor WebSocket connection status
  useEffect(() => {
    if (!window.socket) return;

    const updateStatus = () => {
      let status: SocketInfo["status"] = "closed";
      if (window.socket.isConnecting()) status = "connecting";
      else if (window.socket.isConnected()) status = "open";
      else if (window.socket.isDisconnecting()) status = "closing";
      setSocketInfo((prev) => ({ ...prev, status }));
    };

    const interval = setInterval(updateStatus, 500);
    updateStatus();
    return () => clearInterval(interval);
  }, []);

  // Authentication
  const handleLogin = async () => {
    if (!userInfo.email || !userInfo.password) {
      toast.warning("Please enter both email and password");
      return;
    }

    const { data, error } = await window.supabase.auth.signInWithPassword({
      email: userInfo.email,
      password: userInfo.password,
    });

    if (error) {
      toast.error(`Login failed: ${error.message}`);
      return;
    }

    if (data?.session) {
      await window.socket.setAuth(data.session.access_token);
    }

    setUserInfo((prev) => ({ ...prev, id: data.user.id }));
    updateChannels();
  };

  const handleLogout = async () => {
    await window.supabase.auth.signOut();
    setUserInfo((prev) => ({ ...prev, id: null, email: "", password: "" }));
    window.socket.setAuth(NEXT_PUBLIC_SUPABASE_KEY);
    updateChannels();
  };

  // Connection management
  const toggleConnection = () => {
    if (socketInfo.status === "open") {
      window.socket.disconnect();
    } else {
      window.socket.connect();
    }
  };

  // Channel management
  const createChannel = ({ name, config }: ChannelFormValues) => {
    if (socketInfo.channels.has(name)) {
      toast.warning(`Channel "${name}" already exists`);
      return;
    }

    const ch = window.socket.channel(name, { config });
    window.channel = ch;

    ch.on("system", {}, (payload) => {
      const message = `[SYSTEM] ${payload.message}`;
      switch (payload.status) {
        case "ok":
          toast.success(message);
          break;
        case "error":
          toast.error(message);
          break;
        default:
          toast.error(message);
      }
    });

    updateChannels();
  };

  const addBroadcastListener = (
    channel: RealtimeChannel,
    channelNameParam: string,
    event: string,
  ) => {
    registerBroadcastListener(channel, channelNameParam, event);
    updateChannels();
  };

  const addPresenceListener = (
    channel: RealtimeChannel,
    channelNameParam: string,
  ) => {
    registerPresenceListener(channel, channelNameParam);
    updateChannels();
  };

  const addPostgresChangesListener = (
    channel: RealtimeChannel,
    channelNameParam: string,
    event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
    schema: string,
    table: string,
  ) => {
    registerPostgresListener(channel, channelNameParam, event, schema, table);
    updateChannels();
  };

  const subscribeToChannel = (
    name: string,
    trackPayload?: Record<string, unknown>,
  ) => {
    const channel = socketInfo.channels.get(name);
    if (!channel) {
      toast.error(`[SUBSCRIBE] Channel ${name} not found`);
      return;
    }

    channel.subscribe((status, err) => {
      if (!err && status === "SUBSCRIBED" && trackPayload) {
        channel.track(trackPayload).catch((e: Error) => {
          toast.error(`[TRACK] Error tracking presence: ${e.message}`);
        });
      }
      if (err) {
        toast.error(
          `[SUBSCRIBE] Error subscribing to channel ${name}: ${err.message}`,
        );
      }
      updateChannels();
    });
  };

  const unsubscribeFromChannel = (name: string) => {
    const channel = socketInfo.channels.get(name);
    if (!channel) {
      toast.error(`[UNSUBSCRIBE] Channel ${name} not found`);
      return;
    }
    channel.unsubscribe();
    updateChannels();
  };

  const removeChannel = (name: string) => {
    const channel = socketInfo.channels.get(name);
    if (!channel) {
      toast.error(`[REMOVE] Channel ${name} not found`);
      return;
    }
    channel.unsubscribe();
    updateChannels();
  };

  const trackPresence = (name: string) => {
    const channel = socketInfo.channels.get(name);
    if (!channel) {
      toast.error(`[TRACK_PRESENCE] Channel ${name} not found`);
      return;
    }
    channel.track(presencePayload);
  };

  const untrackPresence = (name: string) => {
    const channel = socketInfo.channels.get(name);
    if (!channel) {
      toast.error(`[UNTRACK_PRESENCE] Channel ${name} not found`);
      return;
    }
    channel.untrack();
  };

  const subscribedChannels = Array.from(socketInfo.channels.entries()).filter(
    ([, ch]) => ch.state === "joined",
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen p-4 font-mono text-sm">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-bold mb-6">
          Realtime-js Interactive Example
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ---------------------------------------------------------------- */}
          {/* Left Column: Controls                                            */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-4">
            {/* WebSocket Connection */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  WebSocket Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      socketInfo.status === "open"
                        ? "bg-green-500"
                        : socketInfo.status === "connecting"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                  />
                  <span className="uppercase font-semibold">
                    {socketInfo.status}
                  </span>
                </div>
                <Button className="w-full" onClick={toggleConnection}>
                  {socketInfo.status === "open"
                    ? "Disconnect Socket"
                    : "Connect Socket"}
                </Button>
              </CardContent>
            </Card>

            {/* User Authentication */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                {!isAuthenticated(userInfo) ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={userInfo.email}
                        onChange={(e) =>
                          setUserInfo((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={userInfo.password}
                        onChange={(e) =>
                          setUserInfo((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <Button className="w-full" onClick={handleLogin}>
                      Log In
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Tip: Set NEXT_PUBLIC_TEST_USER_EMAIL and
                      NEXT_PUBLIC_TEST_USER_PASSWORD in .env.local
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-md border border-green-600/40 bg-green-950/30 p-3 space-y-1">
                      <p className="text-green-400 font-semibold text-xs">
                        ✓ Authenticated
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        <span className="font-semibold">User ID:</span>{" "}
                        {userInfo.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Email:</span>{" "}
                        {userInfo.email}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <ChannelForm onSubmit={createChannel} />

            <ActiveChannels
              channels={socketInfo.channels}
              onSubscribe={subscribeToChannel}
              onUnsubscribe={unsubscribeFromChannel}
              onRemove={removeChannel}
              onAddBroadcastListener={addBroadcastListener}
              onAddPresenceListener={addPresenceListener}
              onUntrack={untrackPresence}
            />

            {/* Postgres Changes Config */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Postgres Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Schema</Label>
                  <Input
                    placeholder="public"
                    value={pgForm.schema}
                    onChange={(e) =>
                      setPgForm((prev) => ({ ...prev, schema: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Table Name *</Label>
                  <Input
                    placeholder="e.g., messages, users, posts"
                    value={pgForm.table}
                    onChange={(e) =>
                      setPgForm((prev) => ({ ...prev, table: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Event Type</Label>
                  <Select
                    value={pgForm.event}
                    onValueChange={(val) =>
                      setPgForm((prev) => ({ ...prev, event: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">All Events (*)</SelectItem>
                      <SelectItem value="INSERT">INSERT only</SelectItem>
                      <SelectItem value="UPDATE">UPDATE only</SelectItem>
                      <SelectItem value="DELETE">DELETE only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {socketInfo.channels.size === 0 ? (
                    <div className="text-center py-3 border border-dashed rounded-md">
                      <p className="text-muted-foreground text-xs">
                        No channels
                      </p>
                    </div>
                  ) : (
                    Array.from(socketInfo.channels.entries()).map(
                      ([key, channel]) => (
                        <Button
                          key={key}
                          className="w-full justify-start text-xs"
                          variant="secondary"
                          onClick={() =>
                            addPostgresChangesListener(
                              channel,
                              key,
                              pgForm.event as REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
                              pgForm.schema,
                              pgForm.table,
                            )
                          }
                        >
                          Postgres Changes to: {key}
                        </Button>
                      ),
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Presence Track */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Presence Track</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Track Payload (JSON format)</Label>
                  <Textarea
                    placeholder='{"status": "online", "name": "Alice"}'
                    className="font-mono text-xs"
                    rows={3}
                    defaultValue={JSON.stringify(presencePayload, null, 2)}
                    onChange={(e) => {
                      try {
                        setPresencePayload(JSON.parse(e.target.value));
                      } catch {
                        // Allow typing invalid JSON temporarily
                      }
                    }}
                  />
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {subscribedChannels.length === 0 ? (
                    <div className="text-center py-3 border border-dashed rounded-md">
                      <p className="text-muted-foreground text-xs">
                        No subscribed channels
                      </p>
                      <p className="text-muted-foreground/60 text-xs">
                        Subscribe to a channel first
                      </p>
                    </div>
                  ) : (
                    subscribedChannels.map(([key]) => (
                      <Button
                        key={key}
                        className="w-full justify-start text-xs"
                        variant="secondary"
                        onClick={() => trackPresence(key)}
                      >
                        👥 Track to: {key}
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* Right Column: Data Tables                                        */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-4">
            <LogsTable logs={logs} onClear={clearLogs} />
            <BroadcastMessagesTable
              messages={broadcastMessages}
              onClear={clearBroadcastMessages}
              channels={subscribedChannels.map(([key]) => key)}
            />
            <PostgresChangesTable
              changes={postgresChanges}
              onClear={clearPostgresChanges}
            />
            <PresenceStateTable
              presenceState={presenceState}
              onClear={clearPresenceState}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

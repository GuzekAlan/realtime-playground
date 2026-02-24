import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PresenceByChannel } from "@/types/realtime";

interface Props {
  presenceState: PresenceByChannel;
  onClear: () => void;
}

export function PresenceStateTable({ presenceState, onClear }: Props) {
  const channelCount = Object.keys(presenceState).length;
  const totalUsers = Object.values(presenceState).reduce(
    (acc, state) => acc + Object.keys(state).length,
    0,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Presence State</CardTitle>
          <div className="flex items-center gap-2">
            {totalUsers > 0 && (
              <Badge variant="secondary">{totalUsers} online</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={onClear}
              disabled={channelCount === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {channelCount === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-xs">
            No presence data yet
          </p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {Object.entries(presenceState).map(([channelName, state]) => {
              const userCount = Object.keys(state).length;
              return (
                <div key={channelName} className="rounded-md border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-xs">{channelName}</h3>
                    <Badge
                      variant="outline"
                      className="text-xs border-green-600/40 text-green-400"
                    >
                      {userCount} {userCount === 1 ? "user" : "users"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(state).map(([key, presences]) => (
                      <div key={key} className="rounded bg-muted/50 border p-2">
                        <p className="font-mono text-xs text-muted-foreground mb-1">
                          key:{" "}
                          <span className="text-foreground font-semibold">
                            {key}
                          </span>
                          {Array.isArray(presences) && presences.length > 1 && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs h-4"
                            >
                              {presences.length}
                            </Badge>
                          )}
                        </p>
                        {Array.isArray(presences) &&
                          presences.map((presence, i) => (
                            <pre
                              key={i}
                              className="text-xs overflow-x-auto text-muted-foreground"
                            >
                              {JSON.stringify(presence, null, 2)}
                            </pre>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

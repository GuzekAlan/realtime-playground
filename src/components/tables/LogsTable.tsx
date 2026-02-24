import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LogEntry } from "@/types/realtime";

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogsTable({ logs, onClear }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Socket Logs</CardTitle>
          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <Badge variant="secondary">{logs.length}</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={onClear}
              disabled={logs.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-xs">
            No logs yet
          </p>
        ) : (
          <ul className="overflow-auto max-h-96 space-y-2">
            {logs.map((log, idx) => (
              <li
                key={idx}
                className="rounded-md border border-border px-3 py-2 text-xs space-y-1"
              >
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <Badge variant="outline" className="text-xs font-mono">
                    {log.kind}
                  </Badge>
                  <span className="text-muted-foreground break-all">
                    {log.message}
                  </span>
                </div>
                {log.data !== undefined && (
                  <pre className="text-muted-foreground whitespace-pre-wrap break-all">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

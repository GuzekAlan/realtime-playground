import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PostgresChange } from "@/types/realtime";

interface Props {
  changes: PostgresChange[];
  onClear: () => void;
}

function EventBadge({ eventType }: { eventType: string }) {
  const styles: Record<string, string> = {
    INSERT: "border-green-600/40 text-green-400 bg-green-950/30",
    UPDATE: "border-yellow-600/40 text-yellow-400 bg-yellow-950/30",
    DELETE: "border-red-600/40 text-red-400 bg-red-950/30",
  };
  return (
    <Badge
      variant="outline"
      className={`text-xs font-mono ${styles[eventType] ?? ""}`}
    >
      {eventType}
    </Badge>
  );
}

function ChangeData({ change }: { change: PostgresChange }) {
  if (change.eventType === "INSERT") {
    return (
      <pre className="text-xs overflow-x-auto text-green-400/80">
        {JSON.stringify(change.new, null, 2)}
      </pre>
    );
  }

  if (change.eventType === "DELETE") {
    return (
      <pre className="text-xs overflow-x-auto text-red-400/80">
        {JSON.stringify(change.old, null, 2)}
      </pre>
    );
  }

  if (change.eventType === "UPDATE") {
    return (
      <div className="space-y-1">
        <div>
          <span className="text-xs text-red-400/60 font-semibold">before</span>
          <pre className="text-xs overflow-x-auto text-red-400/60">
            {JSON.stringify(change.old, null, 2)}
          </pre>
        </div>
        <div>
          <span className="text-xs text-green-400 font-semibold">after</span>
          <pre className="text-xs overflow-x-auto text-green-400/80">
            {JSON.stringify(change.new, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <pre className="text-xs overflow-x-auto text-muted-foreground">
      {JSON.stringify(change, null, 2)}
    </pre>
  );
}

export function PostgresChangesTable({ changes, onClear }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Postgres Changes</CardTitle>
          <div className="flex items-center gap-2">
            {changes.length > 0 && (
              <Badge variant="secondary">{changes.length}</Badge>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7"
              onClick={onClear}
              disabled={changes.length === 0}
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {changes.length === 0 ? (
          <p className="text-muted-foreground text-center py-4 text-xs">
            No postgres changes yet
          </p>
        ) : (
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-20">Time</TableHead>
                  <TableHead className="text-xs w-28">Channel</TableHead>
                  <TableHead className="text-xs w-24">Event</TableHead>
                  <TableHead className="text-xs w-32">Table</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {changes.map((change, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs whitespace-nowrap align-top tabular-nums text-muted-foreground">
                      {new Date(change.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs align-top max-w-28 truncate">
                      {change.channel}
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      <EventBadge eventType={change.eventType} />
                    </TableCell>
                    <TableCell className="text-xs align-top font-mono text-muted-foreground">
                      {change.schema}.{change.table}
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      <ChangeData change={change} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-20">Time</TableHead>
                  <TableHead className="text-xs w-24">Kind</TableHead>
                  <TableHead className="text-xs w-40">Message</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-xs whitespace-nowrap align-top tabular-nums text-muted-foreground">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      <Badge variant="outline" className="text-xs font-mono">
                        {log.kind}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs align-top text-muted-foreground">
                      {log.message}
                    </TableCell>
                    <TableCell className="text-xs align-top">
                      {log.data !== undefined ? (
                        <pre className="overflow-x-auto text-muted-foreground">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
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

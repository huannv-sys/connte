import { useQuery } from "@tanstack/react-query";
import { type Log } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogsPage() {
  const { data: logs, isLoading } = useQuery<Log[]>({
    queryKey: ["/api/logs"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {logs?.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded ${
                  log.type === "error"
                    ? "bg-red-50 text-red-700"
                    : log.type === "auth"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{log.type}</span>
                  <span className="text-sm">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1">{log.message}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

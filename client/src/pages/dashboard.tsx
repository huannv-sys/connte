import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceChart from "@/components/metrics/ResourceChart";
import NetworkStatus from "@/components/metrics/NetworkStatus";
import { type Metric } from "@shared/schema";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<Metric>({
    queryKey: ["/api/metrics"],
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceChart data={metrics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Network Status</CardTitle>
          </CardHeader>
          <CardContent>
            <NetworkStatus data={metrics} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

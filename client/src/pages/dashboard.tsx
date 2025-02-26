import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceChart from "@/components/metrics/ResourceChart";
import NetworkStatus from "@/components/metrics/NetworkStatus";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Device, type Metric } from "@shared/schema";

export default function Dashboard() {
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);

  const { data: devices } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const { data: metrics, isLoading } = useQuery<Metric>({
    queryKey: ["/api/metrics", selectedDeviceId],
    enabled: !!selectedDeviceId,
  });

  if (!devices?.length) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Chưa có thiết bị nào được thêm vào. Vui lòng thêm thiết bị trong mục "Quản lý thiết bị".
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedDeviceId && devices.length > 0) {
    setSelectedDeviceId(devices[0].id);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="w-[240px]">
        <Select
          value={selectedDeviceId?.toString()}
          onValueChange={(value) => setSelectedDeviceId(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn thiết bị" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device) => (
              <SelectItem key={device.id} value={device.id.toString()}>
                {device.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tài nguyên hệ thống</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && <ResourceChart data={metrics} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trạng thái mạng</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics && <NetworkStatus data={metrics} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
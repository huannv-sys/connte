import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDeviceSchema, type InsertDevice, type Device } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, PowerIcon, Terminal, Settings } from "lucide-react";

export default function DevicesPage() {
  const { toast } = useToast();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const { data: devices, isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const form = useForm<InsertDevice>({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      name: "",
      ipAddress: "",
      username: "",
      password: "",
      apiKey: "",
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async (data: InsertDevice) => {
      await apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Thành công",
        description: "Đã thêm thiết bị mới",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (deviceId: number) => {
      await apiRequest("POST", `/api/devices/${deviceId}/disconnect`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Thành công",
        description: "Đã ngắt kết nối thiết bị",
      });
    },
  });

  const commandMutation = useMutation({
    mutationFn: async ({ deviceId, command }: { deviceId: number; command: string }) => {
      const res = await apiRequest("POST", `/api/devices/${deviceId}/command`, { command });
      return res.json();
    },
  });

  const onSubmit = (data: InsertDevice) => {
    addDeviceMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thêm thiết bị mới</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label>Tên thiết bị</label>
                <Input {...form.register("name")} placeholder="VD: Router Văn Phòng" />
              </div>

              <div>
                <label>Địa chỉ IP</label>
                <Input {...form.register("ipAddress")} placeholder="VD: 192.168.1.1" />
              </div>

              <div>
                <label>Username</label>
                <Input {...form.register("username")} />
              </div>

              <div>
                <label>Password</label>
                <Input type="password" {...form.register("password")} />
              </div>

              <div>
                <label>API Key</label>
                <Input {...form.register("apiKey")} />
              </div>

              <Button type="submit" disabled={addDeviceMutation.isPending}>
                {addDeviceMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Thêm thiết bị
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thiết bị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices?.map((device) => (
              <Card key={device.id} className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{device.name}</h3>
                        <p className="text-sm text-muted-foreground">{device.ipAddress}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => disconnectMutation.mutate(device.id)}
                      >
                        <PowerIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedDevice(device)}
                      >
                        <Terminal className="mr-2 h-4 w-4" />
                        Gửi lệnh
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Settings className="mr-2 h-4 w-4" />
                        Cấu hình
                      </Button>
                    </div>

                    {selectedDevice?.id === device.id && (
                      <div className="mt-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Nhập lệnh API..."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                commandMutation.mutate({
                                  deviceId: device.id,
                                  command: e.currentTarget.value,
                                });
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedDevice(null)}
                          >
                            Đóng
                          </Button>
                        </div>
                        {commandMutation.data && (
                          <pre className="mt-2 p-2 bg-muted rounded text-sm">
                            {JSON.stringify(commandMutation.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
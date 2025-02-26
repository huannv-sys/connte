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
import { apiRequest } from "@/lib/queryClient";

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
    return <div>Loading...</div>;
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
                <Input {...form.register("name")} />
              </div>

              <div>
                <label>Địa chỉ IP</label>
                <Input {...form.register("ipAddress")} />
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

              <Button type="submit">Thêm thiết bị</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thiết bị</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {devices?.map((device) => (
              <div key={device.id} className="p-4 border rounded">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{device.name}</h3>
                    <p className="text-sm text-muted-foreground">{device.ipAddress}</p>
                  </div>
                  <div className="space-x-2">
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedDevice(device)}
                    >
                      Gửi lệnh
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => disconnectMutation.mutate(device.id)}
                    >
                      Ngắt kết nối
                    </Button>
                  </div>
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
                        onClick={() => setSelectedDevice(null)}
                      >
                        Đóng
                      </Button>
                    </div>
                    {commandMutation.data && (
                      <pre className="mt-2 p-2 bg-muted rounded">
                        {JSON.stringify(commandMutation.data, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

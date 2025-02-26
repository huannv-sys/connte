import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { insertAlertSchema, type InsertAlert } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Config() {
  const { toast } = useToast();
  const form = useForm<InsertAlert>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      type: "cpu",
      threshold: 80,
      email: "",
    },
  });

  const onSubmit = async (data: InsertAlert) => {
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast({
        title: "Success",
        description: "Alert configuration saved",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save alert configuration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Alert Type</label>
            <select {...form.register("type")}>
              <option value="cpu">CPU Usage</option>
              <option value="memory">Memory Usage</option>
            </select>
          </div>
          
          <div>
            <label>Threshold (%)</label>
            <Input type="number" {...form.register("threshold")} />
          </div>

          <div>
            <label>Email</label>
            <Input type="email" {...form.register("email")} />
          </div>

          <Button type="submit">Save Configuration</Button>
        </form>
      </Form>
    </div>
  );
}

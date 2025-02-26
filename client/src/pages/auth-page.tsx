import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Form } from "@/components/ui/form";

export default function AuthPage() {
  const [location, setLocation] = useLocation();
  const { loginMutation, registerMutation, user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = async (data: InsertUser) => {
    if (isLogin) {
      await loginMutation.mutateAsync({
        username: data.username,
        password: data.password,
      });
    } else {
      await registerMutation.mutateAsync(data);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {isLogin ? "Đăng nhập" : "Đăng ký"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label>Username</label>
                  <Input {...form.register("username")} />
                </div>

                <div>
                  <label>Password</label>
                  <Input type="password" {...form.register("password")} />
                </div>

                {!isLogin && (
                  <div>
                    <label>Email</label>
                    <Input type="email" {...form.register("email")} />
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {isLogin ? "Đăng nhập" : "Đăng ký"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary hover:underline"
                  >
                    {isLogin ? "Tạo tài khoản mới" : "Đã có tài khoản? Đăng nhập"}
                  </button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex items-center justify-center bg-primary/5 p-8">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4">
            Mikrotik Device Monitor
          </h1>
          <p className="text-lg text-muted-foreground">
            Ứng dụng giám sát và quản lý thiết bị Mikrotik với các tính năng theo dõi tài nguyên, 
            quản lý cấu hình và cảnh báo.
          </p>
        </div>
      </div>
    </div>
  );
}
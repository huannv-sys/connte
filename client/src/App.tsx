import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/dashboard";
import Terminal from "@/pages/terminal";
import Config from "@/pages/config";
import Logs from "@/pages/logs";
import Devices from "@/pages/devices";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar";

function Router() {
  return (
    <div className="flex h-screen">
      <Sidebar className="w-64 border-r">
        <div className="p-4">
          <h2 className="text-2xl font-bold">Mikrotik Monitor</h2>
        </div>
      </Sidebar>
      <main className="flex-1 overflow-auto">
        <Switch>
          <ProtectedRoute path="/" component={Dashboard} />
          <ProtectedRoute path="/terminal" component={Terminal} />
          <ProtectedRoute path="/config" component={Config} />
          <ProtectedRoute path="/logs" component={Logs} />
          <ProtectedRoute path="/devices" component={Devices} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <Router />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
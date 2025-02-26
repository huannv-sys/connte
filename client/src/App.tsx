import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/dashboard";
import Terminal from "@/pages/terminal";
import Config from "@/pages/config";
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
          <Route path="/" component={Dashboard} />
          <Route path="/terminal" component={Terminal} />
          <Route path="/config" component={Config} />
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
      <SidebarProvider>
        <Router />
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
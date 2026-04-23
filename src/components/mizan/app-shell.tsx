import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "./theme-provider";
import { SolSidebar } from "./sol-sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <SolSidebar />
        <SidebarInset className="flex min-h-svh flex-col bg-background">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
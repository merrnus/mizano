import * as React from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "./theme-provider";
import { SolSidebar } from "./sol-sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/lib/auth-context";
import { MizanLogo } from "./mizan-logo";
import { IconRail } from "./icon-rail";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isAuthRoute = pathname === "/giris";

  React.useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      navigate({ to: "/giris" });
    }
  }, [loading, user, isAuthRoute, navigate]);

  if (loading) {
    return (
      <ThemeProvider>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <MizanLogo />
        </div>
      </ThemeProvider>
    );
  }

  if (isAuthRoute || !user) {
    return <ThemeProvider>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider>
      <SidebarProvider>
        <SolSidebar />
        <IconRail />
        <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-background md:pl-12">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}
import * as React from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "./theme-provider";
import { SolSidebar } from "./sol-sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/lib/auth-context";
import { MizanLogo } from "./mizan-logo";
import { IconRail } from "./icon-rail";
import { AltTabBar } from "./alt-tab-bar";

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
        <SidebarInset className="flex min-h-svh min-w-0 flex-col bg-background xl:pl-12">
          {!pathname.startsWith("/takvim") && <Topbar />}
          <Main>{children}</Main>
          {!pathname.startsWith("/takvim") && <AltTabBar />}
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const isTakvim = pathname.startsWith("/takvim");
  return (
    <main
      className={
        isTakvim
          ? "min-w-0 min-h-0 h-svh flex-1 overflow-hidden"
          : "min-w-0 flex-1 overflow-x-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] xl:pb-0"
      }
    >
      {children}
    </main>
  );
}
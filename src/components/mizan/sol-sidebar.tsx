import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Scale, Users, CalendarDays, Briefcase } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { MizanLogo } from "./mizan-logo";
import { cn } from "@/lib/utils";

const items = [
  { title: "Bugün", url: "/" as const, icon: LayoutDashboard },
  { title: "İstikamet", url: "/mizan" as const, icon: Scale },
  { title: "Planlama", url: "/takvim" as const, icon: CalendarDays },
  { title: "Rehberlik", url: "/network" as const, icon: Users },
  { title: "Mutfak", url: "/workspace" as const, icon: Briefcase },
];

export function SolSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" side="left" variant="inset">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <MizanLogo />
          {!collapsed && (
            <span className="text-sm font-semibold tracking-wide text-foreground">Mizan</span>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Menü</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                      <Link
                        to={item.url}
                        className={cn(active && "text-primary")}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
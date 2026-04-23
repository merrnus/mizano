import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Scale, Users, CalendarDays, Briefcase, PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const items = [
  { title: "Bugün", url: "/" as const, icon: LayoutDashboard },
  { title: "İstikamet", url: "/mizan" as const, icon: Scale },
  { title: "Planlama", url: "/takvim" as const, icon: CalendarDays },
  { title: "Rehberlik", url: "/network" as const, icon: Users },
  { title: "Mutfak", url: "/workspace" as const, icon: Briefcase },
];

/**
 * Sol kenarda her zaman görünen ince ikon şeridi.
 * Hover'da tooltip; tıklayınca sayfaya gider.
 * En üstteki menü butonu tam sidebar'ı (overlay) açar.
 */
export function IconRail() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-12 flex-col items-center gap-1 border-r border-border bg-sidebar py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
              aria-label="Menüyü aç"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Menüyü aç (⌘B)</TooltipContent>
        </Tooltip>

        <div className="my-1 h-px w-6 bg-sidebar-border" />

        {items.map((item) => {
          const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
          return (
            <Tooltip key={item.title}>
              <TooltipTrigger asChild>
                <Link
                  to={item.url}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-sidebar-accent text-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                  aria-label={item.title}
                >
                  <item.icon className="h-4 w-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
    </TooltipProvider>
  );
}
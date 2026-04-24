import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Scale, Users, CalendarDays, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { title: "Bugün", url: "/" as const, icon: LayoutDashboard },
  { title: "İstikamet", url: "/mizan" as const, icon: Scale },
  { title: "Planlama", url: "/takvim" as const, icon: CalendarDays },
  { title: "Rehberlik", url: "/network" as const, icon: Users },
  { title: "Mutfak", url: "/workspace" as const, icon: Briefcase },
];

/**
 * Mobil + tablet için sticky alt navigasyon.
 * Masaüstünde (xl ve üzeri) gizlenir; orada IconRail kullanılır.
 */
export function AltTabBar() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur xl:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Ana navigasyon"
    >
      <ul className="mx-auto flex h-14 max-w-md items-stretch justify-around px-1">
        {items.map((item) => {
          const active = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
          return (
            <li key={item.title} className="flex flex-1">
              <Link
                to={item.url}
                aria-label={item.title}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "absolute -top-px h-0.5 w-8 rounded-full transition-opacity",
                    active ? "bg-primary opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
                <span className={cn("font-medium tracking-tight", active && "text-foreground")}>
                  {item.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
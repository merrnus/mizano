import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Heart,
  PanelRight,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const items = [
  { title: "Akademi", url: "/akademi", icon: GraduationCap },
  { title: "Maneviyat", url: "/maneviyat", icon: Heart },
  { title: "Hedefler", url: "/hedefler", icon: Target },
  { title: "Kardeşler", url: "/kardesler", icon: Users },
  { title: "Gündemler", url: "/gundemler", icon: BookOpen },
  { title: "İstatistik", url: "/istatistik", icon: BarChart3 },
];

export function SagSidebar() {
  const [collapsed, setCollapsed] = React.useState(false);
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "hidden border-l border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear md:flex md:flex-col",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-12 items-center gap-2 border-b border-sidebar-border px-3",
          collapsed && "justify-center px-0",
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Hayat Alanları
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", !collapsed && "ml-auto")}
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Sağ paneli daralt"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        <TooltipProvider delayDuration={0}>
          {items.map((item) => {
            const active = pathname.startsWith(item.url);
            const link = (
              <Link
                to={item.url}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center",
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="left">{item.title}</TooltipContent>
              </Tooltip>
            ) : (
              <React.Fragment key={item.title}>{link}</React.Fragment>
            );
          })}
        </TooltipProvider>
      </nav>
    </aside>
  );
}
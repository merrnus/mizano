import { LogOut, Moon, Plus, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@tanstack/react-router";

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur">
      <div className="relative hidden min-w-0 flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ara: ders, gündem, kişi, not…"
          className="h-8 border-border bg-muted/40 pl-8 text-sm"
        />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Hızlı ekle">
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggle}
          aria-label="Temayı değiştir"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={async () => {
              await signOut();
              navigate({ to: "/giris" });
            }}
            aria-label="Çıkış yap"
            title={user.email ?? "Çıkış yap"}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
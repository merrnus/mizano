import { LogOut, Moon, Plus, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "./theme-provider";
import { useAuth } from "@/lib/auth-context";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { MizanLogo } from "./mizan-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScrollDirection } from "@/hooks/use-scroll-direction";
import { cn } from "@/lib/utils";

/**
 * Pathname → mobil başlık etiketi.
 * En spesifik eşleşmeyi bulmak için sıralama önemli.
 */
function sayfaBasligi(pathname: string): string {
  const map: Array<[string, string]> = [
    ["/mizan/hedef/", "Hedef"],
    ["/mizan/mana", "Mana"],
    ["/mizan/ilim", "İlim"],
    ["/mizan/amel", "Hedefler"],
    ["/mizan/akademi", "Akademi"],
    ["/mizan/dunyevi", "Dünyevi"],
    ["/mizan/maneviyat", "Maneviyat"],
    ["/mizan", "İstikamet"],
    ["/takvim", "Planlama"],
    ["/network", "Rehberlik"],
    ["/workspace", "Mutfak"],
    ["/gundemler", "Gündemler"],
  ];
  for (const [prefix, etiket] of map) {
    if (pathname.startsWith(prefix)) return etiket;
  }
  return "Bugün";
}

function kullaniciBasHarfi(email?: string | null): string {
  if (!email) return "·";
  return email.trim().charAt(0).toUpperCase();
}

export function Topbar() {
  const { theme, toggle } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { direction, atTop } = useScrollDirection(64);

  // Mobilde aşağı scroll'da gizle, yukarı scroll veya üstte ise göster.
  const gizle = direction === "down" && !atTop;
  const baslik = sayfaBasligi(pathname);

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-12 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur transition-transform duration-200 will-change-transform",
        // Sadece mobilde gizleme animasyonu — xl ve üzeri her zaman görünür
        gizle ? "-translate-y-full xl:translate-y-0" : "translate-y-0",
      )}
    >
      {/* Mobil başlık — masaüstünde gizli */}
      <div className="flex items-center gap-2 xl:hidden">
        <MizanLogo className="text-primary" />
        <h1 className="text-sm font-semibold tracking-tight text-foreground">{baslik}</h1>
      </div>

      {/* Masaüstü arama — mobilde gizli */}
      <div className="relative hidden min-w-0 flex-1 max-w-md xl:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Ara: ders, gündem, kişi, not…"
          className="h-8 border-border bg-muted/40 pl-8 text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Hızlı ekle — masaüstü; tema toggle — masaüstü */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 xl:inline-flex"
          aria-label="Hızlı ekle"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden h-8 w-8 xl:inline-flex"
          onClick={toggle}
          aria-label="Temayı değiştir"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user && (
          <>
            {/* Masaüstü çıkış */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 xl:inline-flex"
              onClick={async () => {
                await signOut();
                navigate({ to: "/giris" });
              }}
              aria-label="Çıkış yap"
              title={user.email ?? "Çıkış yap"}
            >
              <LogOut className="h-4 w-4" />
            </Button>

            {/* Mobil profil dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground transition-colors hover:bg-accent xl:hidden"
                  aria-label="Hesap menüsü"
                >
                  {kullaniciBasHarfi(user.email)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
                  {user.email ?? "Hesap"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggle}>
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  {theme === "dark" ? "Açık tema" : "Koyu tema"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/giris" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
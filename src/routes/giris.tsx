import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MizanLogo } from "@/components/mizan/mizan-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/giris")({
  head: () => ({
    meta: [
      { title: "Giriş — Mizan" },
      { name: "description", content: "Mizan'a giriş yap." },
    ],
  }),
  component: GirisSayfasi,
});

function GirisSayfasi() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<"giris" | "kayit">("giris");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } =
      mode === "giris"
        ? await signIn(email, password)
        : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (mode === "kayit") {
      toast.success("Hesap oluşturuldu. Giriş yapabilirsin.");
      setMode("giris");
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <MizanLogo />
          <h1 className="text-lg font-semibold tracking-tight">Mizan</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "giris" ? "Devam etmek için giriş yap" : "Yeni hesap oluştur"}
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-xs">E-posta</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seninadres@ornek.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password" className="text-xs">Şifre</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
            />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "..." : mode === "giris" ? "Giriş yap" : "Hesap oluştur"}
          </Button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "giris" ? "kayit" : "giris"))}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "giris" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PomodoroRing } from "@/components/mizan/mutfak/pomodoro-ring";

export const Route = createFileRoute("/workspace/pomodoro")({
  component: PomodoroPage,
});

function PomodoroPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
      <header className="mb-8">
        <Link
          to="/workspace"
          className="mb-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Mutfak
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Pomodoro
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bir seans odak, bir kısa mola. Bildirim için izin verirsen ses gelir.
        </p>
      </header>
      <PomodoroRing />
    </div>
  );
}

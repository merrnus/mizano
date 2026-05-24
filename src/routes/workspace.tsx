import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { MutfakYanPanel } from "@/components/mizan/mutfak/yan-panel";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Mutfak — Notlar, Belgeler, Tablolar, Sürücü" },
      {
        name: "description",
        content:
          "Notlar, belgeler, tablolar, sürücü ve pomodoro tek bir mutfakta.",
      },
    ],
  }),
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { pathname } = useLocation();
  // Hub (index) ve pomodoro tam ekran kalsın; diğer alt sayfalarda yan panel açılır.
  const yanPanelGizli =
    pathname === "/workspace" || pathname === "/workspace/pomodoro";

  if (yanPanelGizli) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-full w-full">
      <MutfakYanPanel />
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

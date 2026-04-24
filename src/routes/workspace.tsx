import { createFileRoute, Outlet } from "@tanstack/react-router";

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
  component: () => <Outlet />,
});

import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/mizan/amel")({
  component: () => <Outlet />,
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/gundemler")({
  beforeLoad: () => {
    throw redirect({ to: "/network", search: { tab: "gundemler" } });
  },
});

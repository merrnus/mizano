import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mizan/akademi")({
  beforeLoad: () => {
    throw redirect({ to: "/mizan/ilim" });
  },
});
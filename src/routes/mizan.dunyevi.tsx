import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mizan/dunyevi")({
  beforeLoad: () => {
    throw redirect({ to: "/mizan/amel" });
  },
});
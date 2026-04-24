import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/mizan/maneviyat")({
  beforeLoad: () => {
    throw redirect({ to: "/mizan/mana" });
  },
});
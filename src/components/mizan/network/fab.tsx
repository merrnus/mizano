import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClick: () => void;
  label: string;
  className?: string;
};

/**
 * Material 3 inspired Floating Action Button.
 * Sits bottom-right, lifts above mobile alt-tab bar via pb-safe spacing.
 */
export function Fab({ onClick, label, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "fixed right-4 bottom-20 z-40 sm:bottom-6 sm:right-6",
        "group inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3.5",
        "text-sm font-medium text-primary-foreground",
        "shadow-lg shadow-primary/25 ring-1 ring-primary/20",
        "transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

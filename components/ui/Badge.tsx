// components/ui/Badge.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "success" | "destructive" | "outline";
};

export function Badge({ className, variant = "default", children, ...rest }: BadgeProps) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  const variantClass =
    variant === "secondary"
      ? "bg-secondary text-secondary-foreground"
      : variant === "success"
      ? "bg-green-100 text-green-800"
      : variant === "destructive"
      ? "bg-red-100 text-red-800"
      : variant === "outline"
      ? "border bg-transparent text-neutral-700"
      : "bg-primary text-primary-foreground";

  return (
    <span className={cn(base, variantClass, className)} {...rest}>
      {children}
    </span>
  );
}

export default Badge;

import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        {
          "bg-neutral-100 text-neutral-700": variant === "default",
          "bg-green-50 text-green-700": variant === "success",
          "bg-yellow-50 text-yellow-700": variant === "warning",
          "bg-red-50 text-red-700": variant === "danger",
          "bg-blue-50 text-blue-700": variant === "info",
        },
        className
      )}
      {...props}
    />
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Cases", href: "/cases" },
  { name: "Leaderboard", href: "/leaderboard" },
  { name: "Profile", href: "/profile" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 border-r border-neutral-200 bg-surface-1 lg:block">
      <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-brand-50 text-brand-700"
                : "text-neutral-600 hover:bg-surface-2 hover:text-neutral-900"
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

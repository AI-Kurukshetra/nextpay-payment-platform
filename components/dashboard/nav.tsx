"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/payments", label: "Payments" },
  { href: "/customers", label: "Customers" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/webhooks", label: "Webhooks" }
] as const;

export function DashboardNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (pathname === href) return true;
    return pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="grid gap-2">
      {NAV_ITEMS.map((item) => (
        <Link
          className={
            isActive(item.href)
              ? "rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 transition"
              : "rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
          }
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

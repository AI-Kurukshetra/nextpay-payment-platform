import Link from "next/link";

const NAV_ITEMS = [
  { href: "/overview", label: "Overview" },
  { href: "/payments", label: "Payments" },
  { href: "/customers", label: "Customers" },
  { href: "/subscriptions", label: "Subscriptions" },
  { href: "/webhooks", label: "Webhooks" }
] as const;

export function DashboardNav() {
  return (
    <nav className="grid gap-2">
      {NAV_ITEMS.map((item) => (
        <Link
          className="rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white"
          href={item.href}
          key={item.href}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

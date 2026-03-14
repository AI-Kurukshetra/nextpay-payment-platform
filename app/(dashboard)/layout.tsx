import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/nav";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    redirect("/login");
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <header className="glass sticky top-4 z-20 mb-4 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Merchant Console</p>
            <h1 className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              {merchant.name} Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              href="/api/v1/sandbox/cards"
            >
              Sandbox Cards
            </a>
            <a
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              href="/api/v1/auth/session"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <aside className="glass h-fit rounded-2xl p-3">
          <DashboardNav />
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}

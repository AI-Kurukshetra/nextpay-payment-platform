import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const DASHBOARD_SESSION_COOKIE = "payforge_dashboard_session";

export async function middleware(request: NextRequest) {
  const protectedDashboardRoutes = ["/overview", "/payments", "/customers", "/subscriptions", "/webhooks"];
  if (protectedDashboardRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    const hasSessionCookie = Boolean(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
    if (!hasSessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};

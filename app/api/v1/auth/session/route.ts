import { NextResponse } from "next/server";
import { DASHBOARD_SESSION_COOKIE, getDashboardSessionCookieOptions } from "@/lib/auth/session";

function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: DASHBOARD_SESSION_COOKIE,
    value: "",
    ...getDashboardSessionCookieOptions(),
    maxAge: 0
  });
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  clearSessionCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

export async function POST() {
  return DELETE();
}

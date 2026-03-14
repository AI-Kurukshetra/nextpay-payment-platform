import { cookies } from "next/headers";
import { DASHBOARD_SESSION_COOKIE } from "@/lib/auth/session";
import { verifyDashboardSessionToken } from "@/lib/auth/session";

export async function getDashboardSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value ?? null;
}

export async function getDashboardSessionMerchant() {
  const token = await getDashboardSessionToken();
  if (!token) {
    return null;
  }

  const session = verifyDashboardSessionToken(token);
  if (!session) {
    return null;
  }

  return session.merchant;
}

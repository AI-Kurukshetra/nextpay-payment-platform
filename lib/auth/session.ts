export const DASHBOARD_SESSION_COOKIE = "nextpay_dashboard_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

export type DashboardSessionMerchant = {
  id: string;
  email: string;
  name: string;
  apiKeyHash: string;
  createdAt: string;
};

type SessionPayload = {
  merchant: DashboardSessionMerchant;
  exp: number;
};

function getSessionSecret() {
  if (process.env.NODE_ENV === "production" && !process.env.NEXTPAY_SESSION_SECRET) {
    throw new Error("missing_session_secret");
  }

  return process.env.NEXTPAY_SESSION_SECRET ?? "nextpay-dev-session-secret";
}

function simpleHash(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return hash.toString(16);
}

function sign(value: string) {
  return simpleHash(`${value}:${getSessionSecret()}`);
}

export function createDashboardSessionToken(
  merchant: DashboardSessionMerchant,
  ttlSeconds = SESSION_TTL_SECONDS
) {
  const payload: SessionPayload = {
    merchant,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyDashboardSessionToken(token: string): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionPayload;
    if (!decoded.merchant?.id || !decoded.merchant?.email || !decoded.merchant?.name || !decoded.exp) {
      return null;
    }
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function getDashboardSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

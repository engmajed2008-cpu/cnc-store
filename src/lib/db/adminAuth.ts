/**
 * src/lib/db/adminAuth.ts
 *
 * Lightweight JWT-based admin authentication.
 * No external auth library needed — uses Node.js crypto built-ins.
 *
 * Flow:
 *   POST /api/admin/login  → issues JWT stored in httpOnly cookie
 *   All /api/admin/* routes → verifyAdminRequest()
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "./prisma";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "change-me-in-production";
const COOKIE_NAME = "e3lani_admin";
const SESSION_HOURS = 8;

// ─────────────────────────────────────────────────────────────
// Minimal JWT (HS256) implementation — no jsonwebtoken dep needed
// ─────────────────────────────────────────────────────────────
function base64url(s: string) {
  return Buffer.from(s).toString("base64url");
}

function signJwt(payload: Record<string, unknown>): string {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify(payload));
  const sig     = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verifyJwt(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (expected !== sig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Public: Issue token after successful login
// ─────────────────────────────────────────────────────────────
export async function createAdminSession(adminId: string): Promise<string> {
  const exp   = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const token = signJwt({ sub: adminId, exp, iat: Math.floor(Date.now() / 1000) });

  await prisma.adminSession.create({
    data: {
      adminUserId: adminId,
      token,
      expiresAt: new Date(exp * 1000),
    },
  });

  return token;
}

// ─────────────────────────────────────────────────────────────
// Public: Verify request and return admin payload
// Returns null if unauthenticated (caller should return 401)
// ─────────────────────────────────────────────────────────────
export interface AdminPayload {
  id:    string;
  email: string;
  role:  string;
}

export async function verifyAdminRequest(
  req: NextRequest
): Promise<AdminPayload | null> {
  // Extract token from cookie OR Authorization header
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  const headerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = cookieToken ?? headerToken;

  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload || typeof payload.sub !== "string") return null;

  // Verify token still exists in DB (allows instant revocation)
  const session = await prisma.adminSession.findUnique({
    where: { token },
    include: { adminUser: { select: { id: true, email: true, role: true, isActive: true } } },
  } as any);

  if (!session || !(session as any).adminUser?.isActive) return null;
  if (new Date() > (session as any).expiresAt) return null;

  const user = (session as any).adminUser;
  return { id: user.id, email: user.email, role: user.role };
}

// ─────────────────────────────────────────────────────────────
// Guard decorator — wrap any route handler
// ─────────────────────────────────────────────────────────────
type RouteHandler = (
  req: NextRequest,
  ctx: { params: Record<string, string>; admin: AdminPayload }
) => Promise<NextResponse>;

export function withAdminAuth(
  handler: RouteHandler,
  requiredRole?: string[]
) {
  return async (req: NextRequest, ctx: { params: Record<string, string> }) => {
    const admin = await verifyAdminRequest(req);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (requiredRole && !requiredRole.includes(admin.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, { ...ctx, admin });
  };
}

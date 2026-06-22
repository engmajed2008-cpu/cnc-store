/**
 * src/lib/supabase/server.ts
 *
 * Supabase server-side helpers (App Router).
 * - createSupabaseServerClient(): cookie-based client for Server Components / Route Handlers
 * - getAuthUser(req): resolves the authenticated user from a NextRequest,
 *   supporting BOTH @supabase/ssr cookies AND an Authorization: Bearer header
 *   (the existing store auth keeps the session in localStorage client-side,
 *   so API calls pass the access token in the Authorization header).
 *
 * Server-only — do not import from client components.
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Cookie-based server client (for Server Components / Route Handlers). */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — middleware refreshes sessions instead.
        }
      },
    },
  });
}

/**
 * Resolve the authenticated Supabase user for an API request.
 * Order: Authorization: Bearer <token> header → @supabase/ssr cookies.
 * Returns null when unauthenticated.
 */
export async function getAuthUser(req: NextRequest): Promise<User | null> {
  // 1) Authorization header (client keeps session in localStorage)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token) {
      const bare = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await bare.auth.getUser(token);
      if (!error && data.user) return data.user;
    }
  }

  // 2) Cookie-based session (@supabase/ssr)
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) return data.user;
  } catch {
    // cookies() unavailable outside a request scope
  }

  return null;
}

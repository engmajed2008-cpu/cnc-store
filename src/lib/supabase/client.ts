"use client";
/**
 * src/lib/supabase/client.ts
 *
 * Supabase browser client via @supabase/ssr (cookie-based sessions so the
 * server can read them too). New marketplace UI should prefer this client.
 * The legacy store client in src/lib/supabaseClient.ts keeps working as-is.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

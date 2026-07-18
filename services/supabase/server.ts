import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

// When Supabase env vars are absent (e.g. local dev without a project),
// return a chainable proxy that resolves to { data: null, error: null, count: 0 }
// so server pages render with empty state instead of crashing.
function createNullClient(): ReturnType<typeof createClient<Database>> {
  const EMPTY = { data: null, error: null, count: 0 };
  const terminal = Promise.resolve(EMPTY);
  const handler: ProxyHandler<object> = {
    get(_, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        return (terminal as any)[prop].bind(terminal);
      }
      return new Proxy(() => {}, handler);
    },
    apply(_target, _this, _args) {
      return new Proxy(() => {}, handler);
    },
  };
  return new Proxy(() => {}, handler) as any;
}

// Strip BOM (char code 65279 = 0xFEFF) from the start of an env var string.
// Vercel env vars can acquire a BOM prefix when pasted from Windows UTF-8 files.
const stripBOM = (s: string | undefined): string => {
  let str = s ?? "";
  while (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return str;
};

/**
 * Server client with user's auth context (respects RLS).
 * Use in Server Components and authenticated API routes.
 */
export async function createSupabaseServerClient() {
  const url = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) return createNullClient() as any;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    url,
    stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
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
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}

/**
 * Admin client with service_role key (bypasses RLS).
 * Use in API routes for system operations (inserting verdicts, consensus, etc).
 */
export function createSupabaseAdmin() {
  const url = stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url) return createNullClient();
  return createClient<Database>(
    url,
    stripBOM(process.env.SUPABASE_SERVICE_ROLE_KEY),
    {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 0 } },
    }
  );
}

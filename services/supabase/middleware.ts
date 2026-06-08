import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Strip BOM (char code 65279 = 0xFEFF) from the start of an env var string.
// Vercel env vars can acquire a BOM prefix when pasted from Windows UTF-8 files.
// Uses charCodeAt to avoid embedding the literal BOM character in source.
const stripBOM = (s: string | undefined): string => {
  let str = s ?? "";
  while (str.charCodeAt(0) === 0xFEFF) str = str.slice(1);
  return str;
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      stripBOM(process.env.NEXT_PUBLIC_SUPABASE_URL),
      stripBOM(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // getUser() can throw TypeError if env var has BOM prefix — catch it
    // so auth errors never block API routes or page renders.
    await supabase.auth.getUser();
  } catch {
    // Auth refresh failed — continue without session update
  }

  return supabaseResponse;
}

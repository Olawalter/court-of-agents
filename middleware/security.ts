import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Add security headers to all responses.
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://studio.genlayer.com wss://*.supabase.co;"
  );
  return response;
}

/**
 * Validate that a request body doesn't exceed size limits.
 */
export function validateRequestSize(contentLength: string | null, maxBytes: number = 1_048_576): boolean {
  if (!contentLength) return true;
  return parseInt(contentLength) <= maxBytes;
}

/**
 * Sanitize a string to prevent XSS in stored content.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate AI output to ensure it's safe to store/display.
 */
export function validateAIOutput(output: unknown): boolean {
  if (typeof output !== "object" || output === null) return false;
  const obj = output as Record<string, unknown>;

  // Check required fields
  if (!obj.verdict || !obj.reasoning) return false;

  // Check verdict is a valid value
  const validVerdicts = ["favor_a", "favor_b", "partial_a", "partial_b", "dismiss"];
  if (!validVerdicts.includes(String(obj.verdict))) return false;

  // Check confidence range
  const confidence = Number(obj.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 100) return false;

  // Check reasoning isn't too long
  if (String(obj.reasoning).length > 10000) return false;

  return true;
}

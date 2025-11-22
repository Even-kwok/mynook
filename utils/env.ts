/**
 * Environment variable helpers
 *
 * Provides safe access to environment variables in Next.js.
 * Next.js replaces `process.env.NEXT_PUBLIC_*` at build time.
 * We also support checking for legacy VITE_ prefixes for compatibility during migration,
 * provided they are exposed (e.g. via NEXT_PUBLIC_ prefix if not standard).
 */

/**
 * Retrieve the first defined environment variable from the provided keys.
 * Empty strings are treated as undefined.
 */
export function getEnvVar(...keys: string[]): string | undefined {
  // In Next.js, process.env is the standard way to access env vars.
  // Client-side vars must start with NEXT_PUBLIC_ to be available in the browser.
  
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      const value = process.env[key];
      if (value !== undefined && value !== '') {
        return value;
      }
    }
  }

  return undefined;
}

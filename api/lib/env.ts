/**
 * Server-side environment variable helper for Vercel Serverless Functions
 * 
 * This is a Node.js-only version that safely reads from process.env.
 * Unlike the frontend version, this does NOT attempt to use import.meta
 * since Vercel Functions run in a pure Node.js environment.
 */

/**
 * Retrieve the first defined environment variable from the provided keys.
 * Empty strings are treated as undefined to avoid passing invalid values.
 * 
 * @param keys - List of environment variable names to check in order
 * @returns The first non-empty value found, or undefined if none exist
 * 
 * @example
 * // Try multiple possible names in order of preference
 * const apiKey = getEnvVar('SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY');
 */
export function getEnvVar(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    
    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}


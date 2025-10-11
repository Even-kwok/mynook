/**
 * Environment variable helpers
 *
 * Provides safe access to environment variables in both browser (Vite) and
 * Node.js (serverless) environments. Some parts of the application run in the
 * browser where `import.meta.env` is available, while API routes run in a
 * Node.js context where variables are exposed via `process.env`. This helper
 * consolidates the logic so that we always attempt the available sources in a
 * predictable order.
 */

/**
 * Safely read an environment variable from `import.meta.env` if available.
 */
function getFromImportMeta(key: string): string | undefined {
  try {
    return (import.meta as any)?.env?.[key];
  } catch (_error) {
    return undefined;
  }
}

/**
 * Safely read an environment variable from `process.env` if available.
 */
function getFromProcessEnv(key: string): string | undefined {
  if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
    return process.env[key];
  }
  return undefined;
}

/**
 * Retrieve the first defined environment variable from the provided keys.
 * Empty strings are treated as undefined to avoid passing invalid values to
 * Supabase clients.
 */
export function getEnvVar(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = getFromProcessEnv(key) ?? getFromImportMeta(key);

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}


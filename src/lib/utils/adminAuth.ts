/**
 * Server-side admin authentication helper.
 * Credentials are read from environment variables so they are never
 * exposed to the frontend or hardcoded in source.
 */

/**
 * Validate admin credentials.
 * Returns true only if BOTH username AND password match exactly.
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'techmafia2026';
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

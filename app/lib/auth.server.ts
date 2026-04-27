import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";

/**
 * Creates a Better Auth instance per-request.
 *
 * CRITICAL: On Cloudflare Workers, you MUST NOT create a singleton auth instance.
 * Each request gets its own D1 binding, so auth must be instantiated per-request
 * to avoid D1 write-lock conflicts.
 *
 * @param env - Cloudflare Worker environment bindings
 * @param waitUntil - Optional waitUntil function for background tasks (session cleanup, etc.)
 */
export function createAuth(
  env: Env,
  waitUntil?: (promise: Promise<unknown>) => void
) {
  const db = drizzle(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
    }),
    baseURL: env.APP_ENV === "development" ? "http://localhost:8787/api/auth" : "https://gabios.ness.workers.dev/api/auth",
    secret: env.AUTH_SECRET,

    // Email + Password authentication
    emailAndPassword: {
      enabled: true,
    },

    // App name shown as issuer in authenticator apps (Google Authenticator, Authy)
    appName: "GabiOS",

    // Plugins
    plugins: [
      // Admin plugin — superadmin capabilities
      admin(),
      // Organization plugin — multi-tenant support
      organization(),
      // Two-Factor Authentication (TOTP)
      twoFactor({
        totpOptions: {
          digits: 6,
          period: 30,
        },
      }),
    ],

    // Session configuration
    session: {
      // 7 day session
      expiresIn: 60 * 60 * 24 * 7,
      // Refresh when 1 day remaining
      updateAge: 60 * 60 * 24,
    },

    // Background tasks support
    ...(waitUntil && {
      advanced: {
        waitUntil,
      },
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;

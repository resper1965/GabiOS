import { createMiddleware } from "hono/factory";
import type { HonoEnv } from "../index";

/**
 * Tenant resolution middleware.
 * For V1 (single D1), this simply passes through env.DB.
 * In V2 (per-tenant D1), this will resolve tenant from user → org → D1 binding.
 */
export const tenantMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const path = new URL(c.req.url).pathname;

  // Skip for public routes
  if (path.startsWith("/api/health") || path.startsWith("/api/auth")) {
    await next();
    return;
  }

  // V1: Single D1 database for all tenants
  // V2: Resolve tenant D1 from user's organization
  c.set("tenantDb", c.env.DB);
  c.set("tenantId", "default");

  await next();
});

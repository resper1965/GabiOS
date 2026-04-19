import { createMiddleware } from "hono/factory";
import type { HonoEnv } from "../index";

type Role = "owner" | "admin" | "member";

/**
 * RBAC middleware factory.
 * Pass the minimum required roles to access the route.
 *
 * Usage: `app.use('/admin/*', requireRole('owner', 'admin'))`
 */
export function requireRole(...allowedRoles: Role[]) {
  return createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.var.user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (!allowedRoles.includes(user.role as Role)) {
      return c.json({ error: "Forbidden — insufficient permissions" }, 403);
    }

    await next();
  });
}

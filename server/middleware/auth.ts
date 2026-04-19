import { createMiddleware } from "hono/factory";
import { createAuth } from "../../app/lib/auth.server";
import type { HonoEnv } from "../index";

/**
 * Authentication middleware.
 * Validates the session via Better Auth and injects user into context.
 * Skips auth for /api/health and /api/auth/* routes.
 */
export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const path = new URL(c.req.url).pathname;

  // Skip auth for public routes
  if (path.startsWith("/api/health") || path.startsWith("/api/auth")) {
    await next();
    return;
  }

  const auth = createAuth(c.env);

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || "",
      role: (session.user as Record<string, unknown>).role as string || "member",
    });

    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

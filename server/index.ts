import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { healthRoutes } from "./routes/health";
import { agentRoutes } from "./routes/agents";
import { chatRoutes } from "./routes/chat";
import { tasksRoutes } from "./routes/tasks";
import { organizationRoutes } from "./routes/organization";
import { authMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";

// ─── Types ────────────────────────────────────────────────
export type HonoEnv = {
  Bindings: Env;
  Variables: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    } | null;
    tenantDb: D1Database;
    tenantId: string;
  };
};

// ─── App ──────────────────────────────────────────────────
const api = new Hono<HonoEnv>().basePath("/api");

// Global middleware
api.use("*", logger());
api.use(
  "*",
  cors({
    origin: (origin, c) => {
      const env = c.env as Env;
      const allowedOrigins =
        env.APP_ENV === "production"
          ? ["https://gabios.ness.workers.dev"]
          : ["http://localhost:8787", "http://localhost:5173", "https://gabios.ness.workers.dev"];
      return allowedOrigins.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Public routes (no auth required)
api.route("/health", healthRoutes);

// Protected routes
api.use("/*", authMiddleware);
api.use("/*", tenantMiddleware);
api.route("/agents", agentRoutes);
api.route("/chat", chatRoutes);
api.route("/tasks", tasksRoutes);
api.route("/organization", organizationRoutes);

export { api };

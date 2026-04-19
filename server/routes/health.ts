import { Hono } from "hono";
import type { HonoEnv } from "../index";

export const healthRoutes = new Hono<HonoEnv>();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
    env: c.env.APP_ENV || "development",
  });
});

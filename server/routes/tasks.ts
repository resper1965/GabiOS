import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { tasks, taskEvents } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import type { HonoEnv } from "../index";
import { requireRole } from "../middleware/rbac";
import { logAudit } from "../lib/audit";

const tasksRoutes = new Hono<HonoEnv>();

// ─── Validation Schemas ───────────────────────────────────
const updateStatusSchema = z.object({
  status: z.enum(["open", "queued", "in_progress", "awaiting_approval", "done", "failed"]),
});

// ─── Routes ───────────────────────────────────────────────

// List tasks
tasksRoutes.get("/", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const allTasks = await db.select().from(tasks);
  return c.json({ data: allTasks });
});

// Get single task with events
tasksRoutes.get("/:id", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const id = c.req.param("id");
  
  const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return c.json({ error: "Not found" }, 404);
  
  const events = await db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).orderBy(desc(taskEvents.createdAt));
  
  return c.json({ data: { task, events } });
});

// Update task status (admin/owner only)
tasksRoutes.patch("/:id/status", requireRole("owner", "admin"), async (c) => {
  const db = drizzle(c.var.tenantDb);
  const id = c.req.param("id");

  const parsed = updateStatusSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return c.json({ error: "Not found" }, 404);

  await db.update(tasks).set({ status: parsed.data.status }).where(eq(tasks.id, id));

  // Audit log via task events
  await db.insert(taskEvents).values({
    id: crypto.randomUUID(),
    taskId: id,
    actorId: c.var.user?.id || "unknown",
    actorType: "human",
    eventType: "status_change",
    details: JSON.stringify({ previous: task.status, current: parsed.data.status }),
  });

  // I5: Audit log
  await logAudit(c.var.tenantDb, {
    orgId: c.var.tenantId,
    actorId: c.var.user?.id || "unknown",
    action: "task.status_change",
    targetType: "task",
    targetId: id,
    details: { previous: task.status, current: parsed.data.status },
    ipAddress: c.req.header("cf-connecting-ip"),
  });

  return c.json({ success: true, newStatus: parsed.data.status });
});

export { tasksRoutes };

import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq, and, isNull } from "drizzle-orm";
import { agents } from "../../db/schema";
import type { HonoEnv } from "../index";
import { requireRole } from "../middleware/rbac";
import { logAudit } from "../lib/audit";

export const agentRoutes = new Hono<HonoEnv>();

// ─── Validation Schemas ───────────────────────────────────
const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  soulMd: z.string().max(10000).default(""),
  modelProvider: z.enum(["workers-ai", "openai", "anthropic"]).default("workers-ai"),
  modelId: z.string().default("@cf/meta/llama-3.1-8b-instruct"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(16384).default(4096),
  status: z.enum(["draft", "active", "paused"]).default("draft"),
});

const updateAgentSchema = createAgentSchema.partial();

// ─── Routes ───────────────────────────────────────────────

// List agents (any authenticated user, org-scoped)
agentRoutes.get("/", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const orgId = c.var.tenantId;

  const result = await db
    .select()
    .from(agents)
    .where(and(isNull(agents.deletedAt), eq(agents.orgId, orgId)))
    .all();

  return c.json({ data: result });
});

// Get single agent (org-scoped)
agentRoutes.get("/:id", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const id = c.req.param("id");
  const orgId = c.var.tenantId;

  const result = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
    .get();

  if (!result || result.deletedAt) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({ data: result });
});

// Create agent (admin/owner only, org-scoped)
agentRoutes.post("/", requireRole("owner", "admin"), async (c) => {
  const body = await c.req.json();
  const parsed = createAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.var.tenantDb);
  const orgId = c.var.tenantId;
  const id = crypto.randomUUID();

  await db.insert(agents).values({
    id,
    orgId,
    ...parsed.data,
  });

  const created = await db.select().from(agents).where(eq(agents.id, id)).get();

  // I5: Audit log
  await logAudit(c.var.tenantDb, {
    orgId,
    actorId: c.var.user!.id,
    action: "agent.create",
    targetType: "agent",
    targetId: id,
    details: { name: parsed.data.name },
    ipAddress: c.req.header("cf-connecting-ip"),
  });

  return c.json({ data: created }, 201);
});

// Update agent (admin/owner only, org-scoped)
agentRoutes.put("/:id", requireRole("owner", "admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.var.tenantDb);
  const orgId = c.var.tenantId;

  // Verify ownership before update
  const existing = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
    .get();

  if (!existing || existing.deletedAt) {
    return c.json({ error: "Agent not found" }, 404);
  }

  await db
    .update(agents)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(and(eq(agents.id, id), eq(agents.orgId, orgId)));

  const updated = await db.select().from(agents).where(eq(agents.id, id)).get();

  // I5: Audit log
  await logAudit(c.var.tenantDb, {
    orgId,
    actorId: c.var.user!.id,
    action: "agent.update",
    targetType: "agent",
    targetId: id,
    details: parsed.data,
    ipAddress: c.req.header("cf-connecting-ip"),
  });

  return c.json({ data: updated });
});

// Delete agent — soft delete (owner only, org-scoped)
agentRoutes.delete("/:id", requireRole("owner"), async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.var.tenantDb);
  const orgId = c.var.tenantId;

  const existing = await db
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
    .get();

  if (!existing || existing.deletedAt) {
    return c.json({ error: "Agent not found" }, 404);
  }

  await db
    .update(agents)
    .set({ deletedAt: new Date().toISOString() })
    .where(and(eq(agents.id, id), eq(agents.orgId, orgId)));

  // I5: Audit log
  await logAudit(c.var.tenantDb, {
    orgId,
    actorId: c.var.user!.id,
    action: "agent.delete",
    targetType: "agent",
    targetId: id,
    details: { name: existing.name },
    ipAddress: c.req.header("cf-connecting-ip"),
  });

  return c.json({ success: true });
});

import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { agents } from "../../db/schema";
import type { HonoEnv } from "../index";

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

// List agents
agentRoutes.get("/", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const result = await db
    .select()
    .from(agents)
    .where(eq(agents.deletedAt, null as unknown as string))
    .all();

  return c.json({ data: result });
});

// Get single agent
agentRoutes.get("/:id", async (c) => {
  const db = drizzle(c.var.tenantDb);
  const id = c.req.param("id");

  const result = await db
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .get();

  if (!result) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({ data: result });
});

// Create agent
agentRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = createAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.var.tenantDb);
  const id = crypto.randomUUID();

  await db.insert(agents).values({
    id,
    ...parsed.data,
  });

  const created = await db.select().from(agents).where(eq(agents.id, id)).get();
  return c.json({ data: created }, 201);
});

// Update agent
agentRoutes.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateAgentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.var.tenantDb);

  await db
    .update(agents)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(agents.id, id));

  const updated = await db.select().from(agents).where(eq(agents.id, id)).get();

  if (!updated) {
    return c.json({ error: "Agent not found" }, 404);
  }

  return c.json({ data: updated });
});

// Delete agent (soft delete)
agentRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const db = drizzle(c.var.tenantDb);

  await db
    .update(agents)
    .set({ deletedAt: new Date().toISOString() })
    .where(eq(agents.id, id));

  return c.json({ success: true });
});

import { Hono } from "hono";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { agents, agentSkills } from "../../db/schema";
import { runAgentLoop } from "../agent";
import type { HonoEnv } from "../index";

export const chatRoutes = new Hono<HonoEnv>();

const chatSchema = z.object({
  agentId: z.string(),
  message: z.string().min(1).max(10000),
  conversationId: z.string().optional(),
});

// ─── Chat endpoint — triggers the full Agent Loop ─────────
chatRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  const db = drizzle(c.var.tenantDb);
  const { agentId, message, conversationId } = parsed.data;

  // Fetch agent config
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .get();

  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  if (agent.status !== "active") {
    return c.json({ error: "Agent is not active" }, 400);
  }

  // Fetch active skills
  const skills = await db
    .select({
      name: agentSkills.name,
      instruction: agentSkills.instruction,
      priority: agentSkills.priority,
    })
    .from(agentSkills)
    .where(eq(agentSkills.agentId, agentId))
    .all();

  const activeSkills = skills.filter((s) => s.priority >= 0);

  // Run the Agent Loop
  try {
    const response = await runAgentLoop(
      {
        agentId,
        conversationId: conversationId || crypto.randomUUID(),
        tenantDb: c.var.tenantDb,
        name: agent.name,
        soulMd: agent.soulMd,
        modelId: agent.modelId,
        modelProvider: agent.modelProvider,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        maxLoopIterations: agent.maxLoopIterations,
        skills: activeSkills,
      },
      message,
      c.env,
      // Pass ExecutionContext for waitUntil
      {
        waitUntil: (promise: Promise<unknown>) => {
          // In Hono context, we don't have direct access to ctx.waitUntil
          // The promise runs but we can't guarantee it completes
          promise.catch(console.error);
        },
        passThroughOnException: () => {},
      } as ExecutionContext
    );

    return c.json({ data: response });
  } catch (error) {
    console.error("[Chat] Agent Loop error:", error);
    return c.json(
      {
        error: "Agent loop failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

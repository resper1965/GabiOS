import { Hono } from "hono";
import { z } from "zod";
import type { HonoEnv } from "../index";

export const chatRoutes = new Hono<HonoEnv>();

const chatSchema = z.object({
  agentId: z.string().uuid(),
  message: z.string().min(1).max(10000),
  conversationId: z.string().uuid().optional(),
});

// ─── Chat endpoint (placeholder — full Agent Loop in S3) ──
chatRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = chatSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Validation failed", details: parsed.error.flatten() }, 400);
  }

  // V1 placeholder — uses Workers AI directly via AI Gateway
  // Full Agent Loop (context builder, tool executor, post-processor) comes in Sprint 3
  try {
    const response = await c.env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Respond concisely.",
          },
          {
            role: "user",
            content: parsed.data.message,
          },
        ],
      }
    );

    return c.json({
      data: {
        response: (response as { response: string }).response,
        conversationId: parsed.data.conversationId || crypto.randomUUID(),
        model: "@cf/meta/llama-3.1-8b-instruct",
      },
    });
  } catch (error) {
    return c.json(
      {
        error: "AI inference failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

import { drizzle } from "drizzle-orm/d1";
import { eq, sql } from "drizzle-orm";
import { messages, conversations } from "../../db/schema";
import type { AgentConfig, AgentResponse } from "./types";

/**
 * Post-Processor — runs after the agent responds.
 * Executes via `ctx.waitUntil()` to avoid blocking the response.
 *
 * Tasks:
 *   1. Save user message and agent response to DB
 *   2. Increment conversation message count
 *   3. Session compaction (when count > threshold)
 *   4. Fact extraction (TODO: Sprint 4 — uses cheap LLM)
 *   5. Log metrics
 */
export async function postProcess(
  config: AgentConfig,
  userMessage: string,
  response: AgentResponse,
  env: Env
): Promise<void> {
  const db = drizzle(config.tenantDb);

  try {
    // 1. Ensure conversation exists
    await ensureConversation(db, config);

    // 2. Save user message
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: config.conversationId,
      role: "user",
      content: userMessage,
    });

    // 3. Save assistant response
    await db.insert(messages).values({
      id: crypto.randomUUID(),
      conversationId: config.conversationId,
      role: "assistant",
      content: response.text,
      metadata: JSON.stringify({
        model: response.model,
        toolCalls: response.toolCalls,
        usage: response.usage,
        durationMs: response.durationMs,
      }),
    });

    // 4. Update conversation message count
    await db
      .update(conversations)
      .set({
        messageCount: sql`${conversations.messageCount} + 2`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(conversations.id, config.conversationId));

    // 5. Check if compaction is needed (threshold: 20 messages)
    const convo = await db
      .select({ messageCount: conversations.messageCount })
      .from(conversations)
      .where(eq(conversations.id, config.conversationId))
      .get();

    if (convo && convo.messageCount >= 20) {
      // TODO: Run session compaction via cheap LLM call
      // This will summarize the conversation and save to conversations.summary
      console.log(`[PostProcess] Conversation ${config.conversationId} has ${convo.messageCount} messages — compaction needed`);
    }

    // 6. Log metrics
    console.log(
      `[PostProcess] Agent=${config.agentId} Conversation=${config.conversationId} ` +
      `Tokens=${response.usage.totalTokens} Duration=${response.durationMs}ms ` +
      `ToolCalls=${response.toolCalls.length}`
    );
  } catch (error) {
    console.error("[PostProcess] Error:", error);
  }
}

// ─── Helpers ──────────────────────────────────────────────
async function ensureConversation(
  db: ReturnType<typeof drizzle>,
  config: AgentConfig
) {
  const existing = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.id, config.conversationId))
    .get();

  if (!existing) {
    await db.insert(conversations).values({
      id: config.conversationId,
      agentId: config.agentId,
      channelId: "webchat-default", // TODO: resolve from channel
      status: "open",
    });
  }
}

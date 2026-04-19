import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { messages, memoryFacts, conversations, agentSkills } from "../../db/schema";
import type { AgentConfig, AgentMessage, ContextResult } from "./types";

/**
 * Context Builder — assembles the full context window for the LLM.
 *
 * Layers (in order):
 *   1. System prompt (base instructions)
 *   2. SOUL.md (agent personality)
 *   3. Active skills (sorted by priority)
 *   4. Session compaction summary
 *   5. Memory facts (structured data about the user/case)
 *   6. RAG context (TODO: Vectorize integration in Sprint 4)
 *   7. Recent message history
 */
export async function buildContext(
  config: AgentConfig,
  env: Env
): Promise<ContextResult> {
  const db = drizzle(config.tenantDb);

  // Fetch in parallel
  const [history, facts, conversation] = await Promise.all([
    fetchRecentHistory(db, config.conversationId),
    fetchFacts(db, config.agentId, config.conversationId),
    fetchConversation(db, config.conversationId),
  ]);

  // Build system prompt
  const systemPrompt = assembleSystemPrompt(config, conversation?.summary, facts);

  return {
    systemPrompt,
    history,
    facts,
    ragChunks: [], // TODO: Vectorize RAG in Sprint 4
  };
}

// ─── System Prompt Assembly ───────────────────────────────
function assembleSystemPrompt(
  config: AgentConfig,
  sessionSummary: string | null | undefined,
  facts: Array<{ category: string; key: string; value: string }>
): string {
  const parts: string[] = [];

  // Base system instruction
  parts.push(
    `Você é ${config.name}, um agente de IA do GabiOS.`,
    `Responda de forma útil, precisa e concisa.`,
    `Data atual: ${new Date().toISOString().split("T")[0]}.`
  );

  // SOUL.md (agent personality)
  if (config.soulMd.trim()) {
    parts.push(`\n--- Personalidade ---\n${config.soulMd}`);
  }

  // Active skills (sorted by priority)
  if (config.skills.length > 0) {
    const sortedSkills = [...config.skills].sort((a, b) => a.priority - b.priority);
    const skillsText = sortedSkills
      .map((s) => `[${s.name}]: ${s.instruction}`)
      .join("\n\n");
    parts.push(`\n--- Habilidades ---\n${skillsText}`);
  }

  // Session compaction summary
  if (sessionSummary) {
    parts.push(`\n--- Resumo da Conversa ---\n${sessionSummary}`);
  }

  // Memory facts
  if (facts.length > 0) {
    const factsText = facts
      .map((f) => `- [${f.category}] ${f.key}: ${f.value}`)
      .join("\n");
    parts.push(`\n--- Fatos Conhecidos ---\n${factsText}`);
  }

  return parts.join("\n");
}

// ─── Data Fetchers ────────────────────────────────────────
async function fetchRecentHistory(
  db: ReturnType<typeof drizzle>,
  conversationId: string,
  limit = 20
): Promise<AgentMessage[]> {
  try {
    const rows = await db
      .select({
        role: messages.role,
        content: messages.content,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .all();

    // Reverse to get chronological order
    return rows.reverse().map((r) => ({
      role: r.role as AgentMessage["role"],
      content: r.content,
    }));
  } catch {
    return [];
  }
}

async function fetchFacts(
  db: ReturnType<typeof drizzle>,
  agentId: string,
  conversationId: string
): Promise<Array<{ category: string; key: string; value: string }>> {
  try {
    const rows = await db
      .select({
        category: memoryFacts.category,
        key: memoryFacts.key,
        value: memoryFacts.value,
      })
      .from(memoryFacts)
      .where(eq(memoryFacts.agentId, agentId))
      .limit(50)
      .all();

    return rows;
  } catch {
    return [];
  }
}

async function fetchConversation(
  db: ReturnType<typeof drizzle>,
  conversationId: string
) {
  try {
    return await db
      .select({
        summary: conversations.summary,
        messageCount: conversations.messageCount,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .get();
  } catch {
    return null;
  }
}

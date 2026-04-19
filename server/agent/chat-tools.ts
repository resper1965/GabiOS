import { tool } from "ai";
import { z } from "zod";
import { memoryFacts } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { AgentConfig } from "./types";

/**
 * Chat-specific tools for the conversational agent loop.
 * These are different from task-based tools (getAgentTools) because
 * the chat loop is not task-driven — it's a real-time conversation.
 */
export function getChatTools(db: DrizzleD1Database<any>, config: AgentConfig) {
  return {
    search_knowledge: tool({
      description:
        "Busca informações na memória de longo prazo do agente. Use para encontrar preferências do cliente, contexto de casos anteriores, ou qualquer fato salvo.",
      parameters: z.object({
        query: z
          .string()
          .describe("O termo ou assunto a buscar na memória."),
        category: z
          .enum(["preference", "case", "deadline", "contact", "general"])
          .optional()
          .describe("Categoria opcional para filtrar os resultados."),
      }),
      execute: async ({ query, category }) => {
        let results;
        if (category) {
          results = await db
            .select()
            .from(memoryFacts)
            .where(
              and(
                eq(memoryFacts.agentId, config.agentId),
                eq(memoryFacts.category, category)
              )
            )
            .all();
        } else {
          results = await db
            .select()
            .from(memoryFacts)
            .where(eq(memoryFacts.agentId, config.agentId))
            .all();
        }

        // Basic keyword matching (RAG via Vectorize is Sprint 4)
        const filtered = results.filter(
          (fact) =>
            fact.key.toLowerCase().includes(query.toLowerCase()) ||
            fact.value.toLowerCase().includes(query.toLowerCase())
        );

        if (filtered.length === 0) {
          return { found: false, message: "No matching facts found in memory." };
        }

        return {
          found: true,
          facts: filtered.map((f) => ({
            category: f.category,
            key: f.key,
            value: f.value,
          })),
        };
      },
    }),

    save_fact: tool({
      description:
        "Salva um fato importante na memória de longo prazo. Use para registrar preferências do cliente, descobertas, ou contexto que será útil em conversas futuras.",
      parameters: z.object({
        category: z
          .enum(["preference", "case", "deadline", "contact", "general"])
          .describe("A categoria do fato."),
        key: z.string().describe("Uma chave curta e descritiva (ex: 'linguagem_preferida')."),
        value: z.string().describe("O valor do fato a ser salvo."),
      }),
      execute: async ({ category, key, value }) => {
        await db.insert(memoryFacts).values({
          id: crypto.randomUUID(),
          agentId: config.agentId,
          conversationId: config.conversationId,
          category,
          key,
          value,
        });

        return `Fact saved: [${category}] ${key} = ${value}`;
      },
    }),
  };
}

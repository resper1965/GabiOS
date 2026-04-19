import { tool } from "ai";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { memoryFacts } from "../../db/schema";
import type { AgentConfig } from "./types";

/**
 * Agent Tools — the actions an agent can perform.
 *
 * V1 tools:
 *   - search_knowledge: Semantic search in documents (placeholder until Vectorize)
 *   - get_facts: Query structured memory facts
 *   - save_fact: Store a new fact in memory
 *   - get_current_time: Returns the current date/time
 */
export function getAgentTools(config: AgentConfig, env: Env) {
  const db = drizzle(config.tenantDb);

  return {
    search_knowledge: tool({
      description:
        "Busca informações na base de conhecimento do agente. Use quando o usuário perguntar sobre documentos, contratos, políticas ou procedimentos.",
      parameters: z.object({
        query: z.string().describe("A pergunta ou termo de busca"),
      }),
      execute: async ({ query }) => {
        // TODO: Replace with Vectorize semantic search in Sprint 4
        return {
          results: [],
          message: `Busca por "${query}" — base de conhecimento ainda não configurada. Vectorize será integrado em breve.`,
        };
      },
    }),

    get_facts: tool({
      description:
        "Consulta fatos estruturados salvos na memória do agente. Use para lembrar informações sobre o usuário, caso, preferências, etc.",
      parameters: z.object({
        category: z
          .string()
          .optional()
          .describe("Categoria do fato: preference, case, deadline, contact"),
      }),
      execute: async ({ category }) => {
        try {
          let query = db
            .select()
            .from(memoryFacts)
            .where(eq(memoryFacts.agentId, config.agentId));

          const rows = await query.all();

          const filtered = category
            ? rows.filter((r) => r.category === category)
            : rows;

          return {
            facts: filtered.map((r) => ({
              category: r.category,
              key: r.key,
              value: r.value,
            })),
            count: filtered.length,
          };
        } catch {
          return { facts: [], count: 0 };
        }
      },
    }),

    save_fact: tool({
      description:
        "Salva um fato importante na memória do agente. Use quando o usuário informar dados relevantes como email, telefone, número de processo, preferências, etc.",
      parameters: z.object({
        category: z.enum(["preference", "case", "deadline", "contact", "general"]).describe("Categoria do fato"),
        key: z.string().describe("Chave descritiva do fato, ex: 'email', 'numero_processo'"),
        value: z.string().describe("O valor do fato"),
      }),
      execute: async ({ category, key, value }) => {
        try {
          const id = crypto.randomUUID();
          await db.insert(memoryFacts).values({
            id,
            agentId: config.agentId,
            conversationId: config.conversationId,
            category,
            key,
            value,
          });
          return { saved: true, id, category, key, value };
        } catch (error) {
          return {
            saved: false,
            error: error instanceof Error ? error.message : "Failed to save fact",
          };
        }
      },
    }),

    get_current_time: tool({
      description: "Retorna a data e hora atual. Use quando o usuário perguntar que dia é hoje, que horas são, etc.",
      parameters: z.object({}),
      execute: async () => {
        const now = new Date();
        return {
          date: now.toISOString().split("T")[0],
          time: now.toISOString().split("T")[1].split(".")[0],
          iso: now.toISOString(),
          dayOfWeek: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][now.getDay()],
        };
      },
    }),
  };
}

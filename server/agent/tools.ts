import { tool } from "ai";
import { z } from "zod";
import { tasks, taskEvents, approvalRequests } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";

export function getAgentTools(db: DrizzleD1Database<any>, taskId: string) {
  return {
    request_approval: tool({
      description: "Pausa a tarefa e pede aprovação ou clarificação para um humano. Use quando houver ambiguidade severa ou quando uma ação crítica/destrutiva for necessária.",
      parameters: z.object({
        reason: z.string().describe("O motivo detalhado pelo qual você precisa de aprovação humana."),
        requiredRole: z.string().optional().describe("Se precisar de um cargo específico para aprovar (ex: admin, manager)."),
      }),
      execute: async ({ reason, requiredRole }) => {
        // Halt the task
        await db.update(tasks).set({ status: "awaiting_approval" }).where(eq(tasks.id, taskId));
        
        // Log the event
        await db.insert(taskEvents).values({
          id: crypto.randomUUID(),
          taskId,
          actorId: "agent",
          actorType: "agent",
          eventType: "approval_request",
          details: JSON.stringify({ reason, requiredRole }),
        });

        // Insert into approval requests table
        await db.insert(approvalRequests).values({
          id: crypto.randomUUID(),
          taskId,
          requiredRoleId: requiredRole || null,
          status: "pending",
          reason,
        });

        return `Approval requested successfully. You must now stop execution.`;
      },
    }),
    
    mark_task_done: tool({
      description: "Marca a tarefa atual como concluída. Chame esta ferramenta assim que tiver certeza absoluta de que todos os objetivos foram alcançados.",
      parameters: z.object({
        summary: z.string().describe("Um resumo do que foi feito para completar a tarefa."),
      }),
      execute: async ({ summary }) => {
        await db.update(tasks).set({ status: "done" }).where(eq(tasks.id, taskId));
        
        await db.insert(taskEvents).values({
          id: crypto.randomUUID(),
          taskId,
          actorId: "agent",
          actorType: "agent",
          eventType: "status_change",
          details: JSON.stringify({ previous: "in_progress", current: "done", summary }),
        });

        return `Task marked as done. Summary: ${summary}`;
      },
    }),

    fetch_task_context: tool({
      description: "Obtém os detalhes completos do projeto ao qual a tarefa pertence.",
      parameters: z.object({}),
      execute: async () => {
        const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
        if (!task) return { error: "Task not found" };
        return {
          title: task.title,
          description: task.description || "Sem descrição adicional",
          projectId: task.projectId,
        };
      },
    }),
  };
}

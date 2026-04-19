import { drizzle } from "drizzle-orm/d1";
import { tasks, taskEvents } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Env } from "../worker-configuration";

export const taskDispatcher = async (env: Env, ctx: ExecutionContext) => {
  console.log("Task dispatcher cron tick");
  
  if (!env.DB) {
    console.error("No DB binding found");
    return;
  }
  
  const db = drizzle(env.DB);
  
  try {
    // Busca tarefas abertas
    const openTasks = await db.select().from(tasks).where(eq(tasks.status, "open")).limit(10);
    
    for (const task of openTasks) {
      if (env.AGENT_QUEUE) {
        // Envia para a fila
        await env.AGENT_QUEUE.send({ taskId: task.id, action: "process" });
        
        // Atualiza status
        await db.update(tasks).set({ status: "queued" }).where(eq(tasks.id, task.id));
        
        // Loga o evento
        await db.insert(taskEvents).values({
          id: crypto.randomUUID(),
          taskId: task.id,
          actorId: "system",
          actorType: "system",
          eventType: "status_change",
          details: JSON.stringify({ previous: "open", current: "queued", reason: "Cron trigger dispatched task" })
        });
      }
    }
  } catch (error) {
    console.error("Failed to dispatch tasks:", error);
  }
};

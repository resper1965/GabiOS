import { drizzle } from "drizzle-orm/d1";
import { agents, tasks, taskEvents } from "../db/schema";
import { eq, asc } from "drizzle-orm";
import { generateText, type CoreMessage } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { getAgentTools } from "../server/agent/tools";
import type { Env } from "../worker-configuration";

export const agentWorker = async (batch: MessageBatch<any>, env: Env, ctx: ExecutionContext) => {
  if (!env.DB) return;
  const db = drizzle(env.DB);
  
  for (const message of batch.messages) {
    const payload = message.body;
    console.log("Agent Worker processing message:", payload);
    
    let taskId: string | undefined;
    
    try {
      taskId = payload.taskId;
      if (!taskId) {
        message.ack();
        continue;
      }
      
      const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).get();
      if (!task || task.status === "done" || task.status === "failed") {
        message.ack();
        continue;
      }

      // Update to in_progress if starting
      if (task.status === "open" || task.status === "queued") {
        await db.update(tasks).set({ status: "in_progress" }).where(eq(tasks.id, taskId));
        await db.insert(taskEvents).values({
          id: crypto.randomUUID(),
          taskId: task.id,
          actorId: "system",
          actorType: "system",
          eventType: "status_change",
          details: JSON.stringify({ previous: task.status, current: "in_progress" })
        });
      }

      // Fetch agent config for maxLoopIterations
      const agent = task.assignedAgentId
        ? await db.select().from(agents).where(eq(agents.id, task.assignedAgentId)).get()
        : null;
      const maxSteps = agent?.maxLoopIterations ?? 3;
      
      // 1. Context Rehydration
      const rawEvents = await db.select().from(taskEvents)
        .where(eq(taskEvents.taskId, taskId))
        .orderBy(asc(taskEvents.createdAt));
        
      const messages: CoreMessage[] = [
        { role: "system", content: `You are an autonomous agent in GabiOS. Your current assigned task is: "${task.title}".\n\nTask ID: ${task.id}\n\nThink step by step and use tools to achieve the objective. If you face ambiguity or need to take a destructive/costly action, ALWAYS use the request_approval tool. When you are 100% sure you have finished, use mark_task_done.` }
      ];

      for (const ev of rawEvents) {
        if (ev.eventType === "thought") {
           messages.push({ role: "assistant", content: ev.details || "" });
        } else if (ev.eventType === "tool_result") {
           messages.push({ role: "user", content: `[System Tool Result]: ${ev.details}` });
        } else if (ev.eventType === "status_change") {
           messages.push({ role: "system", content: `[Status changed]: ${ev.details}` });
        }
      }

      messages.push({ role: "user", content: "Continue working on the task. What is your next step? Use tools if necessary." });

      // 2. The Agent Loop — uses Workers AI (same as chat route)
      console.log(`Calling LLM for task: ${task.title} (maxSteps: ${maxSteps})`);
      
      const workersai = createWorkersAI({ binding: env.AI });
      const modelId = agent?.modelId ?? "@cf/meta/llama-3.1-8b-instruct";

      const { text, toolCalls, toolResults } = await generateText({
        model: workersai(modelId),
        messages,
        tools: getAgentTools(db, taskId),
        maxSteps,
        onStepFinish: async ({ text, toolCalls, toolResults }) => {
           if (text) {
             await db.insert(taskEvents).values({
               id: crypto.randomUUID(),
               taskId: task.id,
               actorId: task.assignedAgentId || "agent",
               actorType: "agent",
               eventType: "thought",
               details: text
             });
           }
           for (const t of toolCalls) {
              await db.insert(taskEvents).values({
               id: crypto.randomUUID(),
               taskId: task.id,
               actorId: task.assignedAgentId || "agent",
               actorType: "agent",
               eventType: "tool_call",
               details: JSON.stringify({ name: t.toolName, args: t.args })
             });
           }
           for (const res of toolResults) {
             await db.insert(taskEvents).values({
               id: crypto.randomUUID(),
               taskId: task.id,
               actorId: "system",
               actorType: "system",
               eventType: "tool_result",
               details: JSON.stringify({ name: res.toolName, result: res.result })
             });
           }
        }
      });
      
      // A3: Record actual token cost for budget tracking
      const totalTokens = (text?.length || 0); // Approximate — Workers AI doesn't always return usage
      await db.update(tasks).set({ 
        costInTokens: totalTokens 
      }).where(eq(tasks.id, task.id));
      
      message.ack();
    } catch (err) {
      console.error("Agent Worker error:", err);
      
      // B7 FIX: Mark task as failed so it doesn't stay as zombie "in_progress"
      if (taskId) {
        try {
          await db.update(tasks).set({ status: "failed" }).where(eq(tasks.id, taskId));
          await db.insert(taskEvents).values({
            id: crypto.randomUUID(),
            taskId,
            actorId: "system",
            actorType: "system",
            eventType: "status_change",
            details: JSON.stringify({
              previous: "in_progress",
              current: "failed",
              error: err instanceof Error ? err.message : "Unknown error",
            }),
          });
        } catch (dbErr) {
          console.error("Failed to mark task as failed:", dbErr);
        }
      }
      
      message.ack();
    }
  }
};

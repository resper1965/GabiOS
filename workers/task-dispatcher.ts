import { drizzle } from "drizzle-orm/d1";
import { tasks, taskEvents, projects, departments } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import type { Env } from "../worker-configuration";

/**
 * Task Dispatcher — Cron-triggered worker that dispatches open tasks to the agent queue.
 * 
 * Budget enforcement: Before dispatching, checks if the department's monthly token
 * budget has been exceeded. If budgetLimit > 0 and spending >= budgetLimit,
 * the task is marked as failed instead of dispatched.
 * 
 * budgetLimit = 0 means unlimited.
 */
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
      // A3: Token budget enforcement
      const budgetExceeded = await checkBudgetExceeded(db, task);
      
      if (budgetExceeded) {
        // Block: mark task as failed
        await db.update(tasks).set({ status: "failed" }).where(eq(tasks.id, task.id));
        await db.insert(taskEvents).values({
          id: crypto.randomUUID(),
          taskId: task.id,
          actorId: "system",
          actorType: "system",
          eventType: "status_change",
          details: JSON.stringify({
            previous: "open",
            current: "failed",
            reason: "Department token budget exceeded for current month",
          }),
        });
        console.log(`Task ${task.id} blocked: budget exceeded`);
        continue;
      }

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

/**
 * Check if the department owning this task has exceeded its monthly token budget.
 * Returns true if budget exceeded, false if within budget or unlimited (budgetLimit = 0).
 */
async function checkBudgetExceeded(db: ReturnType<typeof drizzle>, task: { projectId: string }) {
  try {
    // task → project → department
    const project = await db.select().from(projects).where(eq(projects.id, task.projectId)).get();
    if (!project) return false;

    const dept = await db.select().from(departments).where(eq(departments.id, project.departmentId)).get();
    if (!dept || dept.budgetLimit === 0) return false; // 0 = unlimited

    // Sum tokens spent this month by tasks in projects of this department
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().slice(0, 19).replace("T", " ");

    // Get all projects in this department
    const deptProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.departmentId, dept.id))
      .all();
    
    if (deptProjects.length === 0) return false;

    const projectIds = deptProjects.map((p) => `'${p.id}'`).join(",");

    // Sum cost_in_tokens for completed tasks this month
    const result = await db.all(
      sql`SELECT COALESCE(SUM(cost_in_tokens), 0) as total_spend 
          FROM tasks 
          WHERE project_id IN (${sql.raw(projectIds)}) 
          AND status = 'done' 
          AND updated_at >= ${monthStartStr}`
    );

    const totalSpend = (result[0] as any)?.total_spend || 0;
    return totalSpend >= dept.budgetLimit;
  } catch (err) {
    console.error("Budget check failed:", err);
    return false; // Fail open — don't block tasks if budget check fails
  }
}

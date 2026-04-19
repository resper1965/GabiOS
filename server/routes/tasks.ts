import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { tasks, taskEvents, projects, departments } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import type { HonoEnv } from "../index";

const tasksRoutes = new Hono<HonoEnv>();

tasksRoutes.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  
  // Seed inicial se o banco estiver vazio
  const existingProjects = await db.select().from(projects).limit(1);
  if (existingProjects.length === 0) {
    // 1. Criar Department
    const deptId = crypto.randomUUID();
    await db.insert(departments).values({
      id: deptId,
      name: "Engenharia AI",
      budgetLimit: 100000,
      orgId: c.get("tenantId") || "default-org",
    });

    // 2. Criar Project
    const projId = crypto.randomUUID();
    await db.insert(projects).values({
      id: projId,
      name: "Plataforma Core",
      departmentId: deptId,
      status: "active",
    });

    // 3. Criar Tasks Mockadas
    const mockTasks = [
      { id: crypto.randomUUID(), projectId: projId, title: "Analisar Logs de Segurança", status: "done", costInTokens: 1200 },
      { id: crypto.randomUUID(), projectId: projId, title: "Gerar Relatório de Auditoria", status: "awaiting_approval", costInTokens: 450 },
      { id: crypto.randomUUID(), projectId: projId, title: "Refatorar Módulo X", status: "in_progress", costInTokens: 300 },
      { id: crypto.randomUUID(), projectId: projId, title: "Revisar PR #405", status: "open", costInTokens: 0 },
    ];
    await db.insert(tasks).values(mockTasks);
    
    // Inserir um evento na awaiting_approval
    await db.insert(taskEvents).values({
      id: crypto.randomUUID(),
      taskId: mockTasks[1].id,
      actorId: "system",
      actorType: "agent",
      eventType: "approval_request",
      details: JSON.stringify({ reason: "Ação de alto custo identificada. Deseja aprovar o envio do e-mail com o relatório?" }),
    });
  }

  const allTasks = await db.select().from(tasks);
  return c.json({ data: allTasks });
});

tasksRoutes.get("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  
  const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return c.json({ error: "Not found" }, 404);
  
  const events = await db.select().from(taskEvents).where(eq(taskEvents.taskId, id)).orderBy(desc(taskEvents.createdAt));
  
  return c.json({ data: { task, events } });
});

tasksRoutes.patch("/:id/status", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const body = await c.req.json();
  
  if (!body.status) return c.json({ error: "Missing status" }, 400);

  const task = await db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) return c.json({ error: "Not found" }, 404);

  await db.update(tasks).set({ status: body.status }).where(eq(tasks.id, id));

  // Log
  await db.insert(taskEvents).values({
    id: crypto.randomUUID(),
    taskId: id,
    actorId: c.get("user")?.id || "unknown_human",
    actorType: "human",
    eventType: "status_change",
    details: JSON.stringify({ previous: task.status, current: body.status }),
  });

  return c.json({ success: true, newStatus: body.status });
});

export { tasksRoutes };

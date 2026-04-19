import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { departments, agentRoles } from "../../db/schema";
import { eq } from "drizzle-orm";
import type { HonoEnv } from "../index";

const organizationRoutes = new Hono<HonoEnv>();

organizationRoutes.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  
  const allDepartments = await db.select().from(departments);
  const allRoles = await db.select().from(agentRoles);
  
  // Agrupar roles por departamento
  const orgStructure = allDepartments.map(dept => {
    return {
      ...dept,
      roles: allRoles.filter(role => role.departmentId === dept.id)
    };
  });
  
  return c.json({ data: orgStructure });
});

export { organizationRoutes };

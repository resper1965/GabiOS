import { Hono } from "hono";
import type { HonoEnv } from "../index";
import { AegisService } from "../lib/aegis";
import { z } from "zod";

export const standardsRoutes = new Hono<HonoEnv>();

// Lista todos os frameworks
standardsRoutes.get("/frameworks", async (c) => {
  const aegis = new AegisService(c.env.AEGIS_API_KEY as string);
  const region = c.req.query("region");
  const sector = c.req.query("sector");
  
  try {
    const frameworks = await aegis.listFrameworks({ region, sector });
    return c.json({ data: frameworks });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Busca controles de um framework
standardsRoutes.get("/controls/:frameworkId", async (c) => {
  const aegis = new AegisService(c.env.AEGIS_API_KEY as string);
  const frameworkId = c.req.param("frameworkId");
  const domain = c.req.query("domain");
  
  try {
    const controls = await aegis.getControls(frameworkId, { domain });
    return c.json({ data: controls });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Busca por termo em todas as normas
standardsRoutes.get("/search", async (c) => {
  const aegis = new AegisService(c.env.AEGIS_API_KEY as string);
  
  const querySchema = z.object({
    q: z.string().min(2),
    limit: z.string().optional().transform(v => v ? parseInt(v) : 10)
  });
  const parsed = querySchema.safeParse({ q: c.req.query("q"), limit: c.req.query("limit") });
  if (!parsed.success) return c.json({ error: "Invalid query parameters" }, 400);
  
  const { q, limit } = parsed.data;
  
  try {
    const controls = await aegis.searchControls(q, limit);
    return c.json({ data: controls });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Cruzamento de normas
standardsRoutes.get("/mappings/cross", async (c) => {
  const aegis = new AegisService(c.env.AEGIS_API_KEY as string);
  
  const querySchema = z.object({
    standard_a: z.string(),
    standard_b: z.string(),
  });
  const parsed = querySchema.safeParse({ standard_a: c.req.query("standard_a"), standard_b: c.req.query("standard_b") });
  if (!parsed.success) return c.json({ error: "Invalid query parameters" }, 400);
  
  const { standard_a, standard_b } = parsed.data;
  
  try {
    const mapping = await aegis.crossMap(standard_a, standard_b);
    return c.json({ data: mapping });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

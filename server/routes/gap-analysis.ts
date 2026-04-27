import { Hono } from "hono";
import type { HonoEnv } from "../index";
import { AegisService } from "../lib/aegis";
import { z } from "zod";
import { createWorkersAI } from "workers-ai-provider";
import { generateObject } from "ai";

export const gapAnalysisRoutes = new Hono<HonoEnv>();

const AnalyzeSchema = z.object({
  frameworkId: z.string(),
  orgId: z.string().optional(), // Used if we query local Vectorize for org specific data
});

const GapAnalysisResultSchema = z.object({
  standard: z.string(),
  overallCompliance: z.number().min(0).max(100),
  domains: z.array(z.object({
    name: z.string(),
    status: z.enum(["compliant", "partial", "non_compliant", "not_assessed"]),
    score: z.number().min(0).max(100),
    findings: z.array(z.object({
      control: z.string(),
      finding: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      recommendation: z.string()
    })),
  })),
  summary: z.string(),
  criticalGaps: z.array(z.string()),
  nextActions: z.array(z.string()),
});

gapAnalysisRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid payload" }, 400);
  
  const aegis = new AegisService(c.env.AEGIS_API_KEY as string);
  const { frameworkId } = parsed.data;
  
  try {
    // 1. Fetch controls from Aegis
    const controls = await aegis.getControls(frameworkId, { limit: 20 }); // Limit to 20 for now to not overflow context
    
    // Group controls by domain
    const domainsObj = controls.reduce((acc, curr) => {
      const domain = curr.domain || "Geral";
      if (!acc[domain]) acc[domain] = [];
      acc[domain].push(curr);
      return acc;
    }, {} as Record<string, typeof controls>);

    // 2. Fetch local organizational context (Vectorize)
    // TODO: In sprint 4, fetch from Vectorize using c.env.VECTORIZE
    const localContext = "A organização possui políticas de acesso e senha forte. Criptografia em repouso está implementada. Não há política de retenção de dados documentada.";

    // 3. Prepare AI
    const workersai = createWorkersAI({ binding: c.env.AI as any });
    const model = workersai("@cf/meta/llama-3.1-8b-instruct");

    const prompt = `Você é um auditor de compliance (Gap Analysis Agent).
Analise os controles da norma abaixo contra as evidências locais da organização.

Norma ID: ${frameworkId}
Controles a analisar:
${JSON.stringify(controls.map(c => ({ id: c.id, name: c.name, domain: c.domain })), null, 2)}

Evidências Locais (Contexto da Organização):
${localContext}

Identifique os gaps. Para controles sem evidência, assuma "not_assessed" ou "non_compliant".
Responda APENAS com o JSON estruturado.
`;

    // 4. Run Analysis
    const { object } = await generateObject({
      model,
      schema: GapAnalysisResultSchema,
      prompt,
      temperature: 0.2,
    });

    return c.json({ data: object });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

import { drizzle } from "drizzle-orm/d1";
import { auditLogs } from "../../db/schema";

/**
 * Audit logging utility.
 * Writes structured audit entries to the audit_logs table.
 * 
 * Usage:
 *   await logAudit(c.var.tenantDb, {
 *     orgId: c.var.tenantId,
 *     actorId: c.var.user!.id,
 *     action: "agent.create",
 *     targetType: "agent",
 *     targetId: agentId,
 *     details: { name: "Agent X" },
 *     ipAddress: c.req.header("cf-connecting-ip"),
 *   });
 */

interface AuditEntry {
  orgId: string;
  actorId: string;
  action: string;       // "agent.create" | "agent.update" | "agent.delete" | "task.status_change"
  targetType: string;    // "agent" | "task" | "department"
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(tenantDb: D1Database, entry: AuditEntry) {
  const db = drizzle(tenantDb);
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    orgId: entry.orgId,
    actorId: entry.actorId,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    details: JSON.stringify(entry.details || {}),
    ipAddress: entry.ipAddress || null,
  });
}

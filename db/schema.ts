import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────
const timestamps = {
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
};

const softDelete = {
  deletedAt: text("deleted_at"),
};

// ─── Agents ───────────────────────────────────────────────
export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().default("default"),
  name: text("name").notNull(),
  roleId: text("role_id"), // fk to agentRoles
  soulMd: text("soul_md").notNull().default(""),

  // Model config
  modelProvider: text("model_provider").notNull().default("workers-ai"),
  modelId: text("model_id").notNull().default("@cf/meta/llama-3.1-8b-instruct"),
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(4096),

  // Settings
  status: text("status").notNull().default("draft"), // draft | active | paused
  maxLoopIterations: integer("max_loop_iterations").notNull().default(10),
  thinkingEnabled: integer("thinking_enabled", { mode: "boolean" }).notNull().default(false),

  ...timestamps,
  ...softDelete,
});

// ─── Channels ─────────────────────────────────────────────
export const channels = sqliteTable("channels", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  type: text("type").notNull(), // whatsapp | webchat | teams
  name: text("name").notNull(),
  config: text("config").notNull().default("{}"), // JSON — provider-specific config
  status: text("status").notNull().default("inactive"), // active | inactive
  ...timestamps,
});

// ─── Conversations ────────────────────────────────────────
export const conversations = sqliteTable("conversations", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  channelId: text("channel_id")
    .notNull()
    .references(() => channels.id),
  externalContactId: text("external_contact_id"), // WhatsApp number, Teams user, etc.
  summary: text("summary"), // Compacted context
  status: text("status").notNull().default("open"), // open | closed | archived
  messageCount: integer("message_count").notNull().default(0),
  ...timestamps,
});

// ─── Messages ─────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversations.id),
  role: text("role").notNull(), // user | assistant | system | tool
  content: text("content").notNull(),
  metadata: text("metadata").default("{}"), // JSON — tool calls, tokens used, etc.
  ...timestamps,
});

// ─── Agent Skills ─────────────────────────────────────────
export const agentSkills = sqliteTable("agent_skills", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  name: text("name").notNull(),
  instruction: text("instruction").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  priority: integer("priority").notNull().default(0),
  ...timestamps,
});

// ─── Memory Facts ─────────────────────────────────────────
export const memoryFacts = sqliteTable("memory_facts", {
  id: text("id").primaryKey(),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id),
  conversationId: text("conversation_id")
    .references(() => conversations.id),
  category: text("category").notNull(), // preference | case | deadline | contact
  key: text("key").notNull(),
  value: text("value").notNull(),
  ...timestamps,
});

// ─── Documents (R2 references) ────────────────────────────
export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().default("default"),
  agentId: text("agent_id")
    .references(() => agents.id),
  name: text("name").notNull(),
  r2Key: text("r2_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | processing | indexed | error
  chunkCount: integer("chunk_count").notNull().default(0),
  ...timestamps,
  ...softDelete,
});

// ─── Workflows ────────────────────────────────────────────
export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().default("default"),
  agentId: text("agent_id")
    .references(() => agents.id),
  name: text("name").notNull(),
  triggerType: text("trigger_type").notNull(), // message | cron | webhook | manual
  triggerConfig: text("trigger_config").notNull().default("{}"), // JSON
  steps: text("steps").notNull().default("[]"), // JSON — workflow step definitions
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

// ─── Audit Logs ───────────────────────────────────────────
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull().default("default"),
  actorId: text("actor_id").notNull(), // user who performed the action
  action: text("action").notNull(), // agent.create, channel.update, etc.
  targetType: text("target_type").notNull(), // agent, channel, conversation
  targetId: text("target_id").notNull(),
  details: text("details").default("{}"), // JSON — change details
  ipAddress: text("ip_address"),
  ...timestamps,
});

// ─── Departments ──────────────────────────────────────────
export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  budgetLimit: integer("budget_limit").notNull().default(0), // token budget
  orgId: text("org_id").notNull(),
  ...timestamps,
});

// ─── Agent Roles ──────────────────────────────────────────
export const agentRoles = sqliteTable("agent_roles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  departmentId: text("department_id").notNull().references(() => departments.id),
  reportsToRoleId: text("reports_to_role_id"), // Self-referencing FK
  ...timestamps,
});

// ─── Projects ─────────────────────────────────────────────
export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  departmentId: text("department_id").notNull().references(() => departments.id),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

// ─── Tasks ────────────────────────────────────────────────
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id),
  assignedAgentId: text("assigned_agent_id").references(() => agents.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"), // open | queued | in_progress | awaiting_approval | done | failed
  costInTokens: integer("cost_in_tokens").notNull().default(0),
  ...timestamps,
});

// ─── Task Events (Agent Logs) ─────────────────────────────
export const taskEvents = sqliteTable("task_events", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  actorId: text("actor_id").notNull(),
  actorType: text("actor_type").notNull(), // human | agent | system
  eventType: text("event_type").notNull(), // thought | tool_call | tool_result | approval_request | error | status_change
  details: text("details").default("{}"), // JSON
  ...timestamps,
});

// ─── Approval Requests ────────────────────────────────────
export const approvalRequests = sqliteTable("approval_requests", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  requiredRoleId: text("required_role_id"), // se precisar de alguém com certo cargo para aprovar
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  reason: text("reason"),
  resolutionDetails: text("resolution_details"), // JSON reason for rejection/approval
  ...timestamps,
});

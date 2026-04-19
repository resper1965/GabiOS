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
  name: text("name").notNull(),
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
  actorId: text("actor_id").notNull(), // user who performed the action
  action: text("action").notNull(), // agent.create, channel.update, etc.
  targetType: text("target_type").notNull(), // agent, channel, conversation
  targetId: text("target_id").notNull(),
  details: text("details").default("{}"), // JSON — change details
  ipAddress: text("ip_address"),
  ...timestamps,
});

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Master Registry ──────────────────────────────────────
// This schema lives in the shared master D1 database.
// Each tenant gets their own D1 instance; this table tracks them.

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  d1DatabaseId: text("d1_database_id").notNull(),
  plan: text("plan").notNull().default("free"), // free | starter | pro | enterprise
  status: text("status").notNull().default("active"), // active | suspended | deleted
  schemaVersion: integer("schema_version").notNull().default(1),
  ownerId: text("owner_id").notNull(), // Better Auth user ID
  maxAgents: integer("max_agents").notNull().default(3),
  maxDocumentsMb: integer("max_documents_mb").notNull().default(100),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

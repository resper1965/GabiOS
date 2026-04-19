ALTER TABLE `agents` ADD `org_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `org_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `org_id` text DEFAULT 'default' NOT NULL;--> statement-breakpoint
ALTER TABLE `workflows` ADD `org_id` text DEFAULT 'default' NOT NULL;
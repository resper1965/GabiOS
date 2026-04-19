# GabiOS — Product Requirements Document (PRD)

## Overview
GabiOS is a multi-tenant B2B SaaS platform designed to orchestrate autonomous AI agents. The platform abstracts agents into a corporate hierarchy, assigning them tasks, budgets, and roles within a unified Kanban-style dashboard.

## Core Features

### 1. The Company Board (Kanban Orchestration)
The central interface of GabiOS is the Company Board. Unlike conversational interfaces, the board manages the state and lifecycle of tasks.
- **Task Lifecycle:** `open` -> `queued` -> `in_progress` -> `awaiting_approval` -> `done` (or `failed`).
- **Transparency:** Clicking on a task reveals the `Task Event Log` (Scratchpad), detailing the agent's thought process, tool invocations, and errors in real-time.

### 2. Organizational Hierarchy
Agents are organized into a strict corporate structure to ensure context alignment and budget control.
- **Departments:** High-level groupings (e.g., "Marketing", "Engineering"). Each department has a strict monthly token/financial budget.
- **Roles:** Specific job titles (e.g., "Director", "SDR"). Agents inherit the instructions and constraints of their role, ensuring behavior is aligned with corporate goals.
- **Delegation:** Agents with higher-tier roles can spawn sub-tasks and delegate them to subordinate agents.

### 3. Human-in-the-Loop Governance
GabiOS enforces safety and financial responsibility through mandatory approval checkpoints.
- **Awaiting Approval:** An agent can voluntarily pause a task and request human intervention if it encounters ambiguity or is about to perform a destructive/high-cost action.
- **Budget Enforcements:** Tasks that approach their allocated token limit are automatically paused, requiring human override to proceed.

### 4. Stateful Agent Collaboration
Complex tasks often require multiple agents with different skill sets.
- **Meeting Rooms:** Agents can enter designated digital rooms to debate strategies and reach a consensus before executing a multi-step plan.

### 5. Deep Tool Ecosystem
Agents interact with the world through a governed tool registry. Tools are granular APIs that range from web scraping and database queries to sending emails. Tools are permissioned based on the agent's Role and Department.

## Non-Functional Requirements
- **Multi-tenant Isolation:** Every organization operating on GabiOS must have complete data isolation, achieved through dedicated tenant databases.
- **Edge Scalability:** The system must handle thousands of concurrent background tasks without timeout restrictions, utilizing serverless message queues.
- **Security:** All external tool calls must be securely logged for audit purposes. Token management must be secure to prevent unauthorized API billing.

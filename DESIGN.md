# GabiOS — Design Document

## UX/UI Principles

GabiOS is a command center for managing a non-human workforce. The design philosophy strictly avoids "chatbot-style" conversational bubbles. Instead, it mirrors high-density enterprise software (like Linear, Jira, or Datadog), prioritizing data visibility, cost tracking, and workflow management.

### Identity & Aesthetics
- **Theme:** Professional, data-dense, dark mode by default (`#0F172A` Slate).
- **Focus:** The user must instantly understand which agents are working, what they are costing, and where human bottlenecks exist.

### Semantic Status Colors
Color coding is critical for rapid triage:
- 🟡 **Awaiting Approval (Amber/Orange):** Requires immediate human intervention.
- 🔵 **In Progress (Blue, pulsating):** The agent is actively burning compute.
- 🟢 **Done (Green):** Task successfully completed.
- 🔴 **Failed / Over Budget (Red):** Task aborted due to errors or financial constraints.

---

## Core Views

### 1. The Company Board (Dashboard)
A Kanban-style interface summarizing the organization's current operational state.
- **Left Sidebar:** Displays the organizational chart (Departments and Roles) and global budget consumption.
- **Main View:** Kanban columns displaying tasks grouped by status.
- **Task Cards:** Highly compact. Displays Task ID, Assigned Agent, elapsed time, and current token cost (e.g., `$0.42`).

### 2. The Task Inspector (The Agent's Mind)
Clicking on a task does not open a chat window. It opens the Task Inspector, split into two panes:
- **Left Pane (Details & Controls):** Objective, assigned agent context, and manual override buttons (Pause, Abort, Force Complete).
- **Right Pane (Event Ledger):** A terminal-like scrolling log of the agent's actions.
  - `[08:00:10] Thought: Need to verify database schemas.`
  - `[08:00:15] Tool Call: fetch_schema(db="users")`
  - `[08:00:18] System: Return 45 rows.`

### 3. The Approval Gate
When an agent halts at an `awaiting_approval` state, the Task Inspector prominently displays a "Decision Required" banner.
- It shows the exact destructive or costly action the agent intends to take (e.g., `execute_sql("DROP TABLE logs;")`).
- Provides large **APPROVE** and **REJECT** action buttons, with an optional text field to provide redirection feedback to the agent if rejected.

---

## Front-End Stack
- **Framework:** React Router v7 (SSR + SPA hybrid).
- **Styling:** Tailwind CSS v4.
- **Components:** Radix UI / Shadcn UI (modified for extreme data density).
- **Icons:** Lucide React.

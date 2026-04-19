# GabiOS — Agent Model & Hierarchy

## Overview
In GabiOS, an "Agent" is an autonomous worker. It is assigned a job, given access to specific tools, and left to execute tasks asynchronously. To ensure safety and coherence, GabiOS employs a rigid hierarchy and a persistent task-driven memory model.

## Corporate Hierarchy (The SOUL Model)

The behavior of an agent is defined by its `SOUL.md` (System Output Utility Logic), which is a composite of its organizational placement. An agent's final system prompt is constructed by merging context top-down:

1. **Company Rules:** Global constraints (e.g., "Always be polite", "Never disclose internal source code").
2. **Department Rules:** Domain-specific constraints (e.g., "Marketing: Optimize for SEO", "Finance: Minimize token spend").
3. **Role Rules:** Specific job functions (e.g., "Auditor: You are skeptical and meticulous").
4. **Agent Personality:** Individual quirks or specific fine-tuned instructions.

## Task-Driven Scratchpad (Memory Model)

Agents do not use "chat history" or session windows. Since tasks can take hours and involve numerous tool calls, relying on a continuous conversational context window is inefficient and error-prone.

Instead, GabiOS uses a **Task Scratchpad**:
- **Event Ledger:** Every action the agent takes (thought, tool_call, error) is saved immutably to the `task_events` table.
- **Context Rehydration:** When a background worker resumes a task, it reads the recent `task_events` to rehydrate its context state, acting like a developer reading a Jira ticket history before continuing work.
- **Long-Term Memory:** For factual persistence across different tasks (e.g., "Client X prefers email communication"), agents use explicit RAG (Retrieval-Augmented Generation) memory banks.

## The Tool Registry

Tools are the hands of the agents. They are strictly typed and heavily audited.

### Core Governance Tools
- `submit_for_approval(reason)`: Halts the task and alerts a human.
- `delegate_task(role, objective)`: Creates a sub-task assigned to a different role.
- `update_task_status(status)`: Moves the task across the Kanban board.

### Collaboration Tools
- `enter_meeting_room(room_id)`: Joins a multi-agent consensus loop.
- `leave_meeting_room(conclusion)`: Exits the consensus loop and applies the decision to the main task.

### Operational Tools
- `search_knowledge(query)`: Queries the organization's vector database.
- `execute_api(endpoint, payload)`: Interfaces with authorized external software.

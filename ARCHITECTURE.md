# GabiOS — Architecture Document

## High-Level System Architecture

GabiOS is built entirely on Cloudflare's Edge network, ensuring microsecond latency, zero cold-starts, and infinite horizontal scalability. The architecture is explicitly designed to handle heavy, long-running asynchronous AI workloads without falling victim to HTTP timeout limitations.

### Core Stack
- **Compute:** Cloudflare Workers (V8 Isolates)
- **API Framework:** Hono
- **Relational Data:** Cloudflare D1 (SQLite)
- **Object Storage:** Cloudflare R2
- **Vector Search:** Cloudflare Vectorize
- **Event Bus:** Cloudflare Queues
- **Stateful Collaboration:** Cloudflare Durable Objects
- **AI Inference:** Cloudflare AI Gateway & Vercel AI SDK

---

## The Async Engine (Event-Driven Loop)

Since AI agents require minutes (or hours) to complete multi-step reasoning tasks, GabiOS decoupling task ingestion from execution via an event-driven architecture.

### 1. Task Dispatcher (The Heartbeat)
A `Cron Trigger` wakes up a worker every minute.
- Scans the D1 database for tasks with status `open`.
- Validates the tenant's global budget.
- Pushes valid tasks onto the `AGENT_QUEUE`.

### 2. The Queue 
`Cloudflare Queues` act as the buffer. They absorb sudden spikes in tasks, ensuring the system never drops a job and always respects the concurrency limits of the underlying LLM providers.

### 3. Agent Worker (The Brain)
A dedicated queue consumer worker (`agent-worker.ts`) receives the task payload.
- It pulls the `task_events` from D1 to rehydrate the agent's memory.
- It constructs the System Prompt using the agent's Department and Role constraints.
- It invokes the Vercel AI SDK to generate the next action.
- If the AI invokes a tool, the worker executes it, writes the result to D1, and continues the loop.
- If the task requires human approval, it updates the status to `awaiting_approval` and ACKs the queue message, safely going to sleep.

---

## Multi-Tenancy & Data Isolation

GabiOS is a B2B platform. Data isolation is paramount.
- **D1 Master Registry:** A central database maps Organization IDs to specific D1 Database IDs.
- **Tenant Databases:** Each organization has its own isolated D1 database instance. The worker dynamically binds to the correct database on every request using the `x-tenant-id` context.

---

## Stateful Collaboration (Meeting Rooms)

When multiple agents need to debate a topic, stateless queue execution is inefficient. GabiOS leverages **Cloudflare Durable Objects**.
- A Durable Object provides a single point of coordination (a persistent WebSocket server).
- Agents connect to the room, exchange reasoning, and reach a consensus.
- Once consensus is reached, the result is saved, and the Durable Object spins down, yielding back resources.

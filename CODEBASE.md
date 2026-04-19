# GabiOS — Guia do Codebase

## Estrutura de Diretórios

```
GabiOS/
├── app/                        # Frontend React Router v7
│   ├── routes/                 # Páginas (file-based routing)
│   │   ├── _index.tsx          # Landing page
│   │   ├── auth/               # Autenticação
│   │   ├── onboarding/         # Wizard de onboarding (5 passos)
│   │   ├── dashboard/          # App principal
│   │   │   ├── _layout.tsx     # Layout: sidebar + header + command palette
│   │   │   ├── index.tsx       # Dashboard overview
│   │   │   ├── agents/         # CRUD de agentes + editor SOUL.md
│   │   │   ├── chat/           # Conversas (split view + streaming)
│   │   │   ├── knowledge/      # Upload e gestão de documentos
│   │   │   ├── workflows/      # Workflows declarativos
│   │   │   ├── automations/    # Cron jobs
│   │   │   ├── channels/       # Status WhatsApp/Teams/WebChat
│   │   │   ├── analytics/      # Métricas de uso
│   │   │   └── settings/       # Org, membros, API keys, billing
│   │   └── admin/              # Super-admin (gestão de tenants)
│   ├── components/
│   │   ├── ui/                 # Design system (Button, Card, Modal, etc.)
│   │   ├── chat/               # Componentes de chat (thread, bubble, FAB)
│   │   ├── agents/             # Componentes de agente (editor, card)
│   │   └── onboarding/         # Componentes de onboarding
│   └── lib/
│       ├── auth.server.ts      # Better Auth server config
│       ├── auth.client.ts      # Better Auth client hooks
│       ├── db.server.ts        # Drizzle client factory
│       └── tenant.server.ts    # Tenant resolution helpers
├── server/                     # API Backend (Hono)
│   ├── routes/                 # API endpoints
│   │   ├── agents.ts
│   │   ├── chat.ts             # Streaming via Vercel AI SDK
│   │   ├── channels.ts
│   │   ├── workflows.ts
│   │   ├── knowledge.ts
│   │   ├── automations.ts
│   │   ├── analytics.ts
│   │   └── admin.ts
│   ├── services/               # Lógica de negócio
│   │   ├── ai-gateway.ts       # Cloudflare AI Gateway client
│   │   ├── memory-engine.ts    # 3-layer memory orchestrator
│   │   ├── agent-runner.ts     # Agent loop executor
│   │   ├── tool-executor.ts    # Tool use handler
│   │   ├── vectorizer.ts       # Document → chunks → embeddings
│   │   ├── evolution-api.ts    # WhatsApp via Evolution API
│   │   ├── teams-bot.ts        # MS Teams bot
│   │   ├── workflow-engine.ts  # YAML workflow executor
│   │   ├── compactor.ts        # Session compaction
│   │   └── tenant-provisioner.ts
│   ├── middleware/
│   │   ├── auth.ts             # Session validation
│   │   ├── rbac.ts             # Role-based access control
│   │   ├── tenant.ts           # Tenant D1 resolution
│   │   └── rate-limit.ts
│   └── lib/
│       ├── ai.ts               # AI provider abstraction
│       └── observability.ts    # Analytics Engine + Sentry
├── workers/
│   ├── app.ts                  # Main worker entry point
│   └── cron-runner.ts          # Scheduled worker
├── db/
│   ├── schema.ts               # Drizzle schema (per-tenant tables)
│   ├── master-schema.ts        # Registry central schema
│   └── migrations/             # SQL migration files
├── tests/
│   ├── unit/                   # Unit tests (vitest)
│   ├── integration/            # API integration tests
│   └── e2e/                    # End-to-end tests (playwright)
├── docs/                       # Documentação adicional
├── scripts/                    # Scripts de setup, migrations, etc.
│   ├── provision-tenant.ts     # Criar novo tenant
│   └── migrate-all.ts          # Rodar migrações em todos os tenants
├── DESIGN.md
├── ARCHITECTURE.md
├── SECURITY.md
├── AGENTS.md
├── DEVELOPMENT.md
├── VISION.md
├── wrangler.jsonc              # Cloudflare Workers config
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Convenções de Código

### Nomenclatura

| Tipo | Convenção | Exemplo |
|---|---|---|
| Arquivos | kebab-case | `agent-runner.ts` |
| Componentes React | PascalCase | `AgentCard.tsx` |
| Funções | camelCase | `createAgent()` |
| Constantes | UPPER_SNAKE | `MAX_TOKENS` |
| Types/Interfaces | PascalCase | `Agent`, `CreateAgentInput` |
| DB tables | snake_case | `memory_facts` |
| API routes | kebab-case | `/api/agent-skills` |
| CSS classes | kebab-case | `.stat-card` |

### Padrões de Arquivo

#### Route (React Router v7)
```typescript
// app/routes/dashboard/agents/index.tsx
import type { Route } from "./+types/index";

export async function loader({ context }: Route.LoaderArgs) {
  // Server-side data fetching
  const agents = await context.db.select().from(agentsTable);
  return { agents };
}

export default function AgentsPage({ loaderData }: Route.ComponentProps) {
  const { agents } = loaderData;
  return <AgentList agents={agents} />;
}
```

#### API Route (Hono)
```typescript
// server/routes/agents.ts
import { Hono } from "hono";
import { z } from "zod";

const createAgentSchema = z.object({
  name: z.string().min(1).max(100),
  soulMd: z.string().optional(),
  modelProvider: z.enum(["openai", "anthropic", "google", "workers-ai"]),
  modelId: z.string(),
});

const agents = new Hono()
  .post("/", async (c) => {
    const input = createAgentSchema.parse(await c.req.json());
    // ...
  })
  .get("/", async (c) => {
    // ...
  });

export default agents;
```

#### Service
```typescript
// server/services/ai-gateway.ts
export class AIGatewayService {
  constructor(
    private gateway: Fetcher,
    private config: AIGatewayConfig
  ) {}

  async chat(params: ChatParams): Promise<ReadableStream> {
    // ...
  }
}
```

### Validação

- **Inputs**: Zod em todo endpoint de API
- **Env**: Zod schema para variáveis de ambiente
- **Config**: Zod para configurações de agente/workflow

### Error Handling

```typescript
// Erros de domínio
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message);
  }
}

// Uso
throw new AppError("Agente não encontrado", "AGENT_NOT_FOUND", 404);
throw new AppError("Sem permissão", "FORBIDDEN", 403);
throw new AppError("Limite de agentes atingido", "AGENT_LIMIT", 429);
```

### Imports

Ordem:
1. Node/Cloudflare built-ins
2. Third-party packages
3. Internal (server/)
4. Internal (app/)
5. Types

```typescript
import { Hono } from "hono";
import { z } from "zod";

import { AIGatewayService } from "../services/ai-gateway";
import { requireAuth } from "../middleware/auth";

import type { Agent } from "../../db/schema";
```
